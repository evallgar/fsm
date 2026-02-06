import { createFirestoreCRUD } from "@/lib/firestore.factory";
import { db } from "@/lib/firebase-config";
import { Customer } from "./interfaces";

const customersService = createFirestoreCRUD<Customer>(
  db,
  "customers",
  ['createdAt']
);

export const customers = {
  ...customersService,
};

export type Customers = typeof customers;
