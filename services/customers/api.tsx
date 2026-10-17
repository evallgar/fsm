import { ApiError, request } from "@/lib/onemap-api";
import { Customer } from "./interfaces";

interface Company {
  id: number;
  name: string;
  disabled?: boolean;
  attributes?: Record<string, any>;
}

const a = <T,>(attrs: Record<string, any> | undefined, key: string, fallback: T): T => (attrs?.[key] ?? fallback) as T;

/** A customer is a company of the platform (the role "customer"). Only what an engineer needs is read. */
const toCustomer = (c: Company): Customer => ({
  id: String(c.id),
  name: c.name,
  active: !c.disabled,
  deleted: false,
  createdAt: new Date(0),
  address: a(c.attributes, "address", { city: "", state: "", street: "", zip: "" }),
  branches: [],
  contacts: [],
  legal: a(c.attributes, "legal", { vatId: "" }),
  location: { latitude: 0, longitude: 0 } as Customer["location"],
  notes: a(c.attributes, "notes", ""),
  photoURL: a(c.attributes, "photoURL", ""),
  serviceEntity: a(c.attributes, "serviceEntity", ""),
  serviceEntityId: a(c.attributes, "serviceEntityId", ""),
  tags: a(c.attributes, "tags", []),
});

export const customers = {
  get: async (id: string): Promise<Customer | undefined> => {
    const n = Number(id);
    if (!n) return undefined;
    try {
      return toCustomer(await request<Company>("GET", `/companies/${n}`));
    } catch (e) {
      if (e instanceof ApiError && (e.status === 404 || e.status === 400)) return undefined;
      throw e;
    }
  },
};

export type Customers = typeof customers;
