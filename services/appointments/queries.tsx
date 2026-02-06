import { queryOptions, useQuery, useSuspenseQueries, useSuspenseQuery } from "@tanstack/react-query"
import { appointments } from "./api"
import { WorkOrder } from "./interfaces"
import { limit, where } from "firebase/firestore"
import { endOfDay, endOfMonth, startOfDay, startOfMonth } from "date-fns"
import { CalendarMonth } from "@/interfaces/calendar"
import { appointmentConverterToCalendarMarkedDates } from "./converter"
import { auth } from "@/lib/firebase-config"

type Appointment = WorkOrder
/**
 * getLatestAppointmentsQueryOptions
 * Query options for compounded queries that needs to go together
 * @param userId string
 * @param docsLimit number
 * @param docsOrderedBy string
 * @returns Appointment[]
 */
export function getLatestAppointmentsQueryOptions({ userId, docsLimit, docsOrderedBy }: { userId: string, docsLimit?: number, docsOrderedBy?: string }) {
  return {
    queryKey: ['latest-appointments', userId],
    queryFn: async () => {
      try {
        if (!userId) return []
        const response = await appointments.latest([
          where('userId', '==', userId),
        ], docsLimit || 10, docsOrderedBy || 'date');
        return response
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        return []
      }
    },
    refetchOnWindowFocus: true,
  }
}

/**
 * useLatestAppointmentsQueryOptions
 * Query options for compounded queries that needs to go together
 * @returns Appointment[]
 */
export function useLatestAppointmentsQueryOptions() {
  const currentUser = auth.currentUser;
  return {
    queryKey: ['latest-appointments'],
    queryFn: async () => {
      try {
        const response = await appointments.list([
          where('agentId', 'array-contains', currentUser?.uid),
          where('status', '!=', 'new')
        ]);
        console.log('Latest appointments:', response);
        return response
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        console.error('Failed to fetch latest appointments:', error);
        return []
      }
    },
    refetchOnWindowFocus: true,
  }
}

export function useNewAppointmentsQueryOptions() {
  const currentUser = auth.currentUser;
  return {
    queryKey: ['new-appointments'],
    queryFn: async () => {
      try {
        const response = await appointments.list([
          where('agentId', 'array-contains', currentUser?.uid),
          where('status', '==', 'new')
        ]);
        return response
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        console.error('Failed to fetch new engineer appointments:', error);
        return []
      }
    },
    refetchOnWindowFocus: true,
  }
}

/**
 * useAppointmentByIdQueryOptions
 * Query options for compounded queries that needs to go together
 * @returns Appointment
 */
export function useAppointmentByIdQueryOptions(id: string) {
  return {
    queryKey: ['appointment', id],
    queryFn: async (): Promise<Appointment | null> => {
      try {
        const response = await appointments.get(id);
        return response || null
      } catch (error) {
        return null
      }
    },
    refetchOnWindowFocus: true,
  }
}

/**
 * useAppointmentByDateQueryOptions
 * Query options for compounded queries that needs to go together
 * @returns Appointment[]
 */
export function useAppointmentByDateQueryOptions(date: string, enabled?: boolean) {
  const currentUser = auth.currentUser;
  console.log('Current date object is:', date);
  return {
    queryKey: ['appointments', date],
    queryFn: async () => {
      try {
        // // Parse date parts to ensure correct date regardless of timezone
        const [year, month, day] = date.split('-').map(Number);
        
        // // Create date with explicit year, month (0-indexed), and day
        // // Set hours to ensure we're working with local midnight
        const dateObj = new Date(year, month - 1, day, 0, 0, 0, 0);
        
        const startDate = startOfDay(dateObj);
        const endDate = endOfDay(dateObj);
        console.log('By Date Start date:', startDate);
        console.log('By Date End date:', endDate);
        
        const response = await appointments.list([
          where('agentId', 'array-contains', currentUser?.uid),
          where('startDate', '>=', startDate),
          where('startDate', '<=', endDate)
        ]);
        return response
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        console.error('Failed to fetch appointments by date:', error);
        return []
      }
    },
    enabled: enabled || false,
    refetchOnWindowFocus: true,
  }
}

/**
 * useAppointmentByMonthQueryOptions
 * Query options for compounded queries that needs to go together
 * @returns Appointment[]
 */
export function useAppointmentByMonthQueryOptions(calendarMonth: CalendarMonth, enabled?: boolean) {
  const currentUser = auth.currentUser;
  const startOfTheMonth = startOfMonth(calendarMonth.timestamp);
  const endOfTheMonth = endOfMonth(calendarMonth.timestamp);
  console.log('Start of the month:', startOfTheMonth);
  console.log('End of the month:', endOfTheMonth);
  return {
    queryKey: ['appointments', 'month', calendarMonth.month],
    queryFn: async () => {
      try {
        const response = await appointments.list([
          where('agentId', 'array-contains', currentUser?.uid),
          where('startDate', '>=', startOfTheMonth),
          where('startDate', '<=', endOfTheMonth)
        ]);
        return appointmentConverterToCalendarMarkedDates(response);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        console.error('Failed to fetch appointments by month:', error);
        return []
      }
    },
    enabled: enabled || false,
    refetchOnWindowFocus: true,
  }
}

/**
 * useCompletedAppointmentsQueryOptions
 * Query options for fetching completed work orders
 * @returns Appointment[]
 */
export function useCompletedAppointmentsQueryOptions() {
  const currentUser = auth.currentUser;
  return {
    queryKey: ['completed-appointments'],
    queryFn: async () => {
      try {
        const response = await appointments.list([
          where('agentId', 'array-contains', currentUser?.uid),
          where('status', 'in', ['completed', 'done'])
        ]);
        return response;
      } catch (error) {
        console.error('Failed to fetch completed appointments:', error);
        return []
      }
    },
    refetchOnWindowFocus: true,
  }
}
