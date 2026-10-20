/**
 * A work order is a ticket of the customer company, raised on the "fieldservice" channel. This is the same
 * translation the web app uses (src/services/field-service/workorders/ticket-map.ts there): keep the two in step.
 * What a ticket has no field for (equipment, materials, findings, signature, photos, extra agents) is kept in its
 * attributes.
 */
import { Timestamp } from "firebase/firestore";
import { WorkOrder, WorkOrderStatus } from "./interfaces";

export const FIELD_SERVICE_CHANNEL = "fieldservice";

export type StatusKind = "new" | "open" | "on_hold" | "resolved" | "closed" | "cancelled";

export interface TicketStatus {
  id: number;
  companyId: number;
  name: string;
  kind: StatusKind;
  sortOrder?: number;
  disabled?: boolean;
  attributes?: Record<string, any>;
}

export interface TicketPriority {
  id: number;
  companyId: number;
  name: string;
  level: number;
  disabled?: boolean;
}

export interface Ticket {
  id?: number;
  companyId: number;
  branchId?: number;
  contactId?: number;
  categoryId?: number;
  priorityId?: number;
  statusId?: number;
  teamId?: number;
  assigneeId?: number;
  title: string;
  description?: string;
  channel?: string;
  latitude?: number;
  longitude?: number;
  created?: string | null;
  updated?: string | null;
  dueResolution?: string | null;
  scheduledStart?: string | null;
  scheduledEnd?: string | null;
  attributes?: Record<string, any>;
}

/** The ticket statuses and priorities of one company, which the work order words are translated to. */
export interface CompanyContext {
  statuses: TicketStatus[];
  priorities: TicketPriority[];
  /** the company's ticket prefix (attributes.ticketPrefix) */
  prefix: string;
}

const attr = <T>(a: Record<string, any> | undefined, key: string, fallback: T): T => {
  const v = a?.[key];
  return v === undefined || v === null ? fallback : (v as T);
};

const sid = (id?: number | null) => (id ? String(id) : "");
export const nid = (id?: string | number | null) => {
  const n = Number(id);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

const KIND_OF: Record<WorkOrderStatus, StatusKind> = {
  [WorkOrderStatus.New]: "new",
  [WorkOrderStatus.Open]: "open",
  [WorkOrderStatus.InProgress]: "open",
  [WorkOrderStatus.OnHold]: "on_hold",
  [WorkOrderStatus.Completed]: "resolved",
  [WorkOrderStatus.Done]: "closed",
};

const DEFAULT_STATUS_OF: Record<StatusKind, WorkOrderStatus> = {
  new: WorkOrderStatus.New,
  open: WorkOrderStatus.Open,
  on_hold: WorkOrderStatus.OnHold,
  resolved: WorkOrderStatus.Completed,
  closed: WorkOrderStatus.Done,
  cancelled: WorkOrderStatus.Done,
};

const isWorkOrderStatus = (v: unknown): v is WorkOrderStatus => Object.values(WorkOrderStatus).includes(v as WorkOrderStatus);

export const kindOfStatus = (status: WorkOrderStatus): StatusKind => KIND_OF[status] ?? "new";

const usable = (list: TicketStatus[]) => list.filter((s) => !s.disabled).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

/** The first status of a kind, which is where a work order of that stage goes. */
export const statusOfKind = (ctx: CompanyContext, kind: StatusKind) => usable(ctx.statuses).find((s) => s.kind === kind);

/** The work order status of a ticket: the exact one recorded, when it still fits the ticket's stage, else the stage's default. */
export function workOrderStatus(ticket: Ticket, ctx: CompanyContext): WorkOrderStatus {
  const kind = ctx.statuses.find((s) => s.id === ticket.statusId)?.kind ?? "new";
  const recorded = ticket.attributes?.fieldStatus;
  return isWorkOrderStatus(recorded) && KIND_OF[recorded] === kind ? recorded : DEFAULT_STATUS_OF[kind];
}

/**
 * The statuses to pass through to get from one status to another, following the workflow (attributes.next of each
 * status: absent = any). Empty when already there; undefined when the workflow has no way.
 */
export function transitionPath(statuses: TicketStatus[], fromId: number, toId: number): number[] | undefined {
  if (fromId === toId) return [];
  const nodes = usable(statuses);
  const byId = new Map(nodes.map((s) => [s.id, s]));
  const next = (id: number): number[] => {
    const list = byId.get(id)?.attributes?.next;
    return Array.isArray(list) ? list.map(Number).filter((n) => byId.has(n)) : nodes.map((s) => s.id).filter((n) => n !== id);
  };
  const previous = new Map<number, number>();
  const queue = [fromId];
  const seen = new Set([fromId]);
  while (queue.length) {
    const id = queue.shift() as number;
    for (const n of next(id)) {
      if (seen.has(n)) continue;
      seen.add(n);
      previous.set(n, id);
      if (n === toId) {
        const path = [n];
        while (previous.get(path[0]) !== fromId) path.unshift(previous.get(path[0]) as number);
        return path;
      }
      queue.push(n);
    }
  }
  return undefined;
}

// A work order carries the priority of its ticket: the id of one of the priorities of the customer company, the same
// ones the Helpdesk uses. The three old words still read as a position in the list. (Copy of the webapp mapping.)
const RANK: Record<string, number> = { critical: 0, priority: 1, normal: 2 };
const byLevel = (ctx: CompanyContext) => ctx.priorities.filter((p) => !p.disabled).sort((a, b) => a.level - b.level);

/** The level a new order starts on: the middle one (Medium of Critical, High, Medium, Low). */
export function defaultPriority(ctx: CompanyContext): TicketPriority | undefined {
  const list = byLevel(ctx);
  return list[Math.ceil((list.length - 1) / 2)];
}

/** `value` is a priority id, or one of the old words; anything else is the default level. */
export function resolvePriority(ctx: CompanyContext, value?: string): TicketPriority | undefined {
  const list = byLevel(ctx);
  if (!list.length) return undefined;
  const own = list.find((p) => String(p.id) === value);
  if (own) return own;
  if (value && value in RANK) return list[Math.min(RANK[value], list.length - 1)];
  return defaultPriority(ctx);
}

// --- dates ---------------------------------------------------------------------------------------------

const toDate = (v: unknown): Date | null => {
  if (!v) return null;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;
  if (typeof v === "string" || typeof v === "number") {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof (v as { toDate?: () => Date }).toDate === "function") return (v as { toDate: () => Date }).toDate();
  return null;
};

/** The day of `date` (local) at HH:mm; an all-day order runs from the start of its first day to the end of its last. */
export function combine(date: unknown, time: unknown, allDay: boolean, end: boolean): string | null {
  const d = toDate(date);
  if (!d) return null;
  const out = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  const m = /^(\d{1,2}):(\d{2})/.exec(typeof time === "string" ? time : "");
  if (allDay) out.setHours(end ? 23 : 0, end ? 59 : 0);
  else if (m) out.setHours(Number(m[1]), Number(m[2]));
  return out.toISOString();
}

const pad = (n: number) => String(n).padStart(2, "0");
const timeOf = (d: Date | null) => (d ? `${pad(d.getHours())}:${pad(d.getMinutes())}` : "");
// The screens read the day with Firestore's Timestamp API (.toDate()), so that is the shape they get.
const dayOf = (d: Date | null) => (d ? Timestamp.fromDate(new Date(d.getFullYear(), d.getMonth(), d.getDate())) : (undefined as unknown as Timestamp));

// --- the two shapes ------------------------------------------------------------------------------------

/** The work order keys kept in the ticket's attributes, as they are. */
const ATTRIBUTE_KEYS = [
  "name", "subject", "user", "entityId", "departmentId", "serviced", "equipmentId", "equipment", "photoURL", "active",
  "customerName", "primaryContactName", "branchName", "isAllDay", "location", "eventType", "type", "findings", "results",
  "measurements", "images", "notes", "materials", "signatureProvided", "signatureUrl", "noSignatureReason", "signedByOther", "signedByName", "ownerId", "tags",
] as const;

export function toWorkOrder(t: Ticket, ctx: CompanyContext): WorkOrder {
  const a = t.attributes ?? {};
  const status = workOrderStatus(t, ctx);
  const start = toDate(t.scheduledStart);
  const end = toDate(t.scheduledEnd);
  const allDay = a.isAllDay === true;
  const agents: string[] = Array.isArray(a.agentIds) ? a.agentIds.map(String) : t.assigneeId ? [sid(t.assigneeId)] : [];
  const due = toDate(a.dueDate) ?? toDate(t.dueResolution);

  return {
    id: sid(t.id),
    number: `${ctx.prefix}${t.id ?? ""}`,
    agentId: agents,
    branchId: sid(t.branchId),
    entityId: attr(a, "entityId", ""),
    departmentId: attr(a, "departmentId", ""),
    serviced: attr(a, "serviced", "location"),
    primaryContactId: sid(t.contactId),
    user: attr(a, "user", undefined),
    title: t.title,
    name: attr(a, "name", t.title),
    description: t.description ?? "",
    subject: attr(a, "subject", undefined),
    equipmentId: attr(a, "equipmentId", ""),
    photoURL: attr(a, "photoURL", undefined),
    customerId: sid(t.companyId),
    status,
    active: attr(a, "active", true),
    completed: status === WorkOrderStatus.Completed || status === WorkOrderStatus.Done,
    deleted: false,
    customerName: attr(a, "customerName", ""),
    primaryContactName: attr(a, "primaryContactName", ""),
    branchName: attr(a, "branchName", ""),
    createdAt: toDate(t.created) ?? new Date(0),
    startDate: dayOf(start),
    startTime: allDay ? "" : timeOf(start),
    endDate: dayOf(end ?? start),
    endTime: allDay ? "" : timeOf(end),
    dueDate: due ?? (undefined as unknown as Date),
    isAllDay: allDay,
    location: attr(a, "location", undefined),
    equipment: attr(a, "equipment", undefined),
    eventType: attr(a, "eventType", "Maintenance"),
    type: attr(a, "type", ""),
    priority: t.priorityId ? String(t.priorityId) : "",
    priorityName: ctx.priorities.find((p) => p.id === t.priorityId)?.name ?? "",
    findings: attr(a, "findings", undefined),
    results: attr(a, "results", undefined),
    measurements: attr(a, "measurements", undefined),
    images: attr(a, "images", undefined),
    notes: attr(a, "notes", undefined),
    materials: attr(a, "materials", undefined),
    signatureProvided: attr(a, "signatureProvided", undefined),
    signatureUrl: attr(a, "signatureUrl", undefined),
    noSignatureReason: attr(a, "noSignatureReason", undefined),
    signedByOther: attr(a, "signedByOther", undefined),
    signedByName: attr(a, "signedByName", undefined),
    signedAt: toDate(a.signedAt) ?? undefined,
    ownerId: attr(a, "ownerId", ""),
    tags: attr(a, "tags", []),
  };
}

export type Patch = Partial<WorkOrder> & Record<string, unknown>;
const has = (p: Patch, key: string) => key in p && p[key] !== undefined;

/**
 * Writes the fields of `data` onto a fresh ticket. Only the keys that are present are touched. The status is not
 * part of this: it moves through the transition endpoint.
 */
export function applyWorkOrder(base: Ticket, data: Patch, ctx: CompanyContext): Ticket {
  const ticket: Ticket = { ...base, attributes: { ...(base.attributes ?? {}) } };
  const attributes = ticket.attributes as Record<string, any>;

  if (has(data, "title")) ticket.title = String(data.title);
  if (has(data, "description")) ticket.description = String(data.description ?? "");
  if (has(data, "branchId")) ticket.branchId = nid(data.branchId as string);
  if (has(data, "primaryContactId")) ticket.contactId = nid(data.primaryContactId as string);
  if (has(data, "priority")) {
    const priority = resolvePriority(ctx, String(data.priority));
    if (priority?.id) ticket.priorityId = priority.id;
  }
  if (has(data, "agentId")) {
    const agents = (data.agentId as string[]).filter(Boolean);
    ticket.assigneeId = nid(agents[0]);
    attributes.agentIds = agents;
  }

  const allDay = has(data, "isAllDay") ? data.isAllDay === true : attributes.isAllDay === true;
  if (has(data, "startDate") || has(data, "startTime") || has(data, "isAllDay")) {
    const start = combine(has(data, "startDate") ? data.startDate : base.scheduledStart, data.startTime, allDay, false);
    if (start) ticket.scheduledStart = start;
  }
  if (has(data, "endDate") || has(data, "endTime") || has(data, "isAllDay")) {
    const end = combine(has(data, "endDate") ? data.endDate : base.scheduledEnd, data.endTime, allDay, true);
    if (end) ticket.scheduledEnd = end;
  }

  for (const key of ATTRIBUTE_KEYS) if (has(data, key)) attributes[key] = data[key];
  if (has(data, "dueDate")) attributes.dueDate = toDate(data.dueDate)?.toISOString() ?? null;
  if (has(data, "signedAt")) attributes.signedAt = toDate(data.signedAt)?.toISOString() ?? null;
  if (has(data, "status")) attributes.fieldStatus = data.status;
  return ticket;
}
