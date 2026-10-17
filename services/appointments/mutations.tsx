import { useMutation } from "@tanstack/react-query";
import { WorkOrder } from "./interfaces";
import { appointments } from "@/services/appointments/api";

/**
 * Saves a work order. The server's refusal (a status the workflow does not allow, an unknown assignee...) is thrown,
 * so the screen that asked can show it instead of believing the save worked.
 */
export function useUpdateAppointmentMutation() {
  return useMutation({
    mutationFn: async (appointment: WorkOrder) => {
      await appointments.update(appointment.id, appointment);
      return appointment;
    },
  });
}
