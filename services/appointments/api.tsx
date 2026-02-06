import { createFirestoreCRUD } from "@/lib/firestore.factory";
import { db } from "@/lib/firebase-config";
import { WorkOrder } from "./interfaces";

type Appointment = WorkOrder;

const appointmentsService = createFirestoreCRUD<Appointment>(
  db,
  "tasks",
  []
);

export const appointments = {
  ...appointmentsService,
};

export type Appointments = typeof appointments;
