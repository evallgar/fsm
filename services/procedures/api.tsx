import { createFirestoreCRUD } from "@/lib/firestore.factory";
import { db } from "@/lib/firebase-config";
import { Procedure } from "./interfaces";

const proceduresService = createFirestoreCRUD<Procedure>(
  db,
  "procedures",
  ['createdAt', 'updatedAt']
);

export const procedures = {
  ...proceduresService,
};

export type Procedures = typeof procedures;
