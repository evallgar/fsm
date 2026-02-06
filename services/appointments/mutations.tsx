import { useMutation } from "@tanstack/react-query";
import { WorkOrder } from "./interfaces";
import { appointments } from "@/services/appointments/api";

export function useUpdateAppointmentMutation() {
  return useMutation({
    mutationFn: async (appointment: WorkOrder) => {
      try {
        await appointments.update(appointment.id, appointment);
        return appointment;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        return null;
      }
    },
  });
}