import { ApiError, getCurrentUser, request } from "@/lib/onemap-api";
import { WorkOrder } from "./interfaces";
import {
  applyWorkOrder,
  CompanyContext,
  FIELD_SERVICE_CHANNEL,
  kindOfStatus,
  nid,
  Patch,
  statusOfKind,
  Ticket,
  TicketPriority,
  TicketStatus,
  toWorkOrder,
  transitionPath,
} from "./ticket-map";

type Appointment = WorkOrder;

const CONTEXT_TTL = 60_000;
const contexts = new Map<number, { at: number; value: Promise<CompanyContext> }>();

/** Statuses and priorities of a company, kept for a minute: a list of orders asks once per company, not per order. */
const contextOf = (companyId: number): Promise<CompanyContext> => {
  const cached = contexts.get(companyId);
  if (cached && Date.now() - cached.at < CONTEXT_TTL) return cached.value;
  const value = Promise.all([
    request<TicketStatus[]>("GET", "/ticketstatuses", { params: { companyId, limit: 1000 } }),
    request<TicketPriority[]>("GET", "/ticketpriorities", { params: { companyId, limit: 1000 } }),
    request<{ attributes?: Record<string, any> }>("GET", `/companies/${companyId}`).catch(() => undefined),
  ]).then(([statuses, priorities, company]) => ({ statuses, priorities, prefix: String(company?.attributes?.ticketPrefix ?? "") }));
  value.catch(() => contexts.delete(companyId));
  contexts.set(companyId, { at: Date.now(), value });
  return value;
};

const isFieldService = (t: Ticket) => t.channel === FIELD_SERVICE_CHANNEL;

/** Moves a ticket to the status a work order status stands for, through every status the workflow needs on the way. */
async function moveTo(ticket: Ticket, status: WorkOrder["status"], ctx: CompanyContext): Promise<Ticket> {
  const kind = kindOfStatus(status);
  const current = ctx.statuses.find((s) => s.id === ticket.statusId);
  if (current?.kind === kind) return ticket;
  const target = statusOfKind(ctx, kind);
  if (!target) throw new Error(`This company has no "${kind}" status`);
  const path = transitionPath(ctx.statuses, ticket.statusId as number, target.id);
  if (!path) throw new Error(`The workflow does not allow moving from "${current?.name}" to "${target.name}"`);
  let moved = ticket;
  for (const statusId of path) moved = await request<Ticket>("POST", `/tickets/${ticket.id}/transition`, { body: { statusId } });
  return moved;
}

const isMine = (t: Ticket, userId: string) => (Array.isArray(t.attributes?.agentIds) ? t.attributes?.agentIds.map(String).includes(userId) : String(t.assigneeId ?? "") === userId);

async function toWorkOrders(tickets: Ticket[]): Promise<Appointment[]> {
  const companies = [...new Set(tickets.map((t) => t.companyId))];
  const loaded = new Map(await Promise.all(companies.map(async (id) => [id, await contextOf(id)] as const)));
  return tickets.map((t) => toWorkOrder(t, loaded.get(t.companyId) as CompanyContext));
}

/**
 * The engineer's work orders: the field-service tickets of the companies they can see that name them among the
 * agents. The first agent is the ticket's assignee; the rest are in its attributes.
 */
const loadMine = async (): Promise<Appointment[]> => {
  const user = getCurrentUser();
  if (!user) return [];
  // the server keeps only work orders (the channel is how a ticket belongs to a module); the check below is for an older server
  const tickets = await request<Ticket[]>("GET", "/tickets", { params: { limit: 1000, channel: FIELD_SERVICE_CHANNEL } });
  return toWorkOrders(tickets.filter((t) => isFieldService(t) && isMine(t, String(user.id))));
};

// The tabs ask for the same list in different slices at the same moment: one request serves them all.
let recent: { at: number; userId: number; value: Promise<Appointment[]> } | undefined;
const mine = (): Promise<Appointment[]> => {
  const user = getCurrentUser();
  if (recent && recent.userId === user?.id && Date.now() - recent.at < 3000) return recent.value;
  const value = loadMine();
  recent = { at: Date.now(), userId: user?.id ?? 0, value };
  value.catch(() => {
    recent = undefined;
  });
  return value;
};

export const appointments = {
  mine,
  get: async (id: string): Promise<Appointment | undefined> => {
    const n = nid(id);
    if (!n) return undefined;
    try {
      const ticket = await request<Ticket>("GET", `/tickets/${n}`);
      if (!isFieldService(ticket)) return undefined;
      return toWorkOrder(ticket, await contextOf(ticket.companyId));
    } catch (e) {
      if (e instanceof ApiError && (e.status === 404 || e.status === 400)) return undefined;
      throw e;
    }
  },
  /** Saves some fields of a work order. A change of status moves the ticket through the workflow. */
  update: async (id: string, data: Partial<Appointment>): Promise<void> => {
    recent = undefined;
    let ticket = await request<Ticket>("GET", `/tickets/${nid(id)}`);
    const ctx = await contextOf(ticket.companyId);
    if (data.status) ticket = await moveTo(ticket, data.status, ctx);
    await request("PUT", `/tickets/${ticket.id}`, { body: applyWorkOrder(ticket, data as Patch, ctx) });
  },
};

export type Appointments = typeof appointments;
