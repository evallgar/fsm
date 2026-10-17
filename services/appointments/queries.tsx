import { WorkOrder } from "./interfaces";
import { appointments } from "./api";
import { endOfDay, endOfMonth, startOfDay, startOfMonth } from "date-fns";
import { CalendarMonth } from "@/interfaces/calendar";
import { appointmentConverterToCalendarMarkedDates } from "./converter";
import { getCurrentUser } from "@/lib/onemap-api";

type Appointment = WorkOrder;

const userKey = () => getCurrentUser()?.id ?? 0;

/** The day an order starts on, as a Date (the screens receive a Firestore-style Timestamp). */
const startOf = (a: Appointment): Date | null => {
  const d = (a.startDate as unknown as { toDate?: () => Date } | undefined)?.toDate?.();
  return d ?? null;
};

const between = (a: Appointment, from: Date, to: Date) => {
  const d = startOf(a);
  return !!d && d >= from && d <= to;
};

/**
 * getLatestAppointmentsQueryOptions
 * The engineer's latest work orders, newest start first.
 * @param userId string
 * @param docsLimit number
 */
export function getLatestAppointmentsQueryOptions({ userId, docsLimit }: { userId: string; docsLimit?: number; docsOrderedBy?: string }) {
  return {
    queryKey: ["latest-appointments", userId],
    queryFn: async () => {
      try {
        if (!userId) return [];
        const list = await appointments.mine();
        return list.sort((a, b) => (startOf(b)?.getTime() ?? 0) - (startOf(a)?.getTime() ?? 0)).slice(0, docsLimit || 10);
      } catch (error) {
        console.error("Failed to fetch latest appointments:", error);
        return [];
      }
    },
    refetchOnWindowFocus: true,
  };
}

/** Work orders the engineer has already taken up (any status but new). */
export function useLatestAppointmentsQueryOptions() {
  return {
    queryKey: ["latest-appointments", userKey()],
    queryFn: async () => {
      try {
        return (await appointments.mine()).filter((a) => a.status !== "new");
      } catch (error) {
        console.error("Failed to fetch latest appointments:", error);
        return [];
      }
    },
    refetchOnWindowFocus: true,
  };
}

/** Work orders assigned to the engineer that nobody has started. */
export function useNewAppointmentsQueryOptions() {
  return {
    queryKey: ["new-appointments", userKey()],
    queryFn: async () => {
      try {
        return (await appointments.mine()).filter((a) => a.status === "new");
      } catch (error) {
        console.error("Failed to fetch new engineer appointments:", error);
        return [];
      }
    },
    refetchOnWindowFocus: true,
  };
}

/** One work order. */
export function useAppointmentByIdQueryOptions(id: string) {
  return {
    queryKey: ["appointment", id],
    queryFn: async (): Promise<Appointment | null> => {
      try {
        return (await appointments.get(id)) || null;
      } catch (error) {
        return null;
      }
    },
    refetchOnWindowFocus: true,
  };
}

/** The engineer's work orders that start on a day ("yyyy-MM-dd"). */
export function useAppointmentByDateQueryOptions(date: string, enabled?: boolean) {
  return {
    queryKey: ["appointments", userKey(), date],
    queryFn: async () => {
      try {
        const [year, month, day] = date.split("-").map(Number);
        const dateObj = new Date(year, month - 1, day, 0, 0, 0, 0);
        const from = startOfDay(dateObj);
        const to = endOfDay(dateObj);
        return (await appointments.mine()).filter((a) => between(a, from, to));
      } catch (error) {
        console.error("Failed to fetch appointments by date:", error);
        return [];
      }
    },
    enabled: enabled || false,
    refetchOnWindowFocus: true,
  };
}

/** The days of a month that have work orders, marked for the calendar. */
export function useAppointmentByMonthQueryOptions(calendarMonth: CalendarMonth, enabled?: boolean) {
  const from = startOfMonth(calendarMonth.timestamp);
  const to = endOfMonth(calendarMonth.timestamp);
  return {
    queryKey: ["appointments", "month", userKey(), calendarMonth.month],
    queryFn: async () => {
      try {
        return appointmentConverterToCalendarMarkedDates((await appointments.mine()).filter((a) => between(a, from, to)));
      } catch (error) {
        console.error("Failed to fetch appointments by month:", error);
        return [];
      }
    },
    enabled: enabled || false,
    refetchOnWindowFocus: true,
  };
}

/** Work orders the engineer has finished (completed or done). */
export function useCompletedAppointmentsQueryOptions() {
  return {
    queryKey: ["completed-appointments", userKey()],
    queryFn: async () => {
      try {
        return (await appointments.mine()).filter((a) => a.status === "completed" || a.status === "done");
      } catch (error) {
        console.error("Failed to fetch completed appointments:", error);
        return [];
      }
    },
    refetchOnWindowFocus: true,
  };
}
