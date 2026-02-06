import { WorkOrder } from "./interfaces";
import { CalendarEventColor, MarkedDate } from "@/interfaces/calendar";
import { Status } from "@/interfaces/workorders";

type Appointment = WorkOrder;
// Helper function to check if a status is valid
const isValidStatus = (status: string | undefined): status is Status => {
    return status !== undefined && Object.values(Status).includes(status as Status);
};

// Helper function to parse date from various formats
const parseDateValue = (dateValue: any): Date | null => {
    // Case 1: It's a Firestore Timestamp with toDate() method
    if (dateValue && typeof dateValue.toDate === 'function') {
        return dateValue.toDate();
    }
    
    // Case 2: It's a string (ISO format or other string format)
    if (typeof dateValue === 'string') {
        return new Date(dateValue);
    }
    
    // Case 3: It's already a Date object
    if (dateValue instanceof Date) {
        return dateValue;
    }
    
    // Case 4: It's a number (timestamp)
    if (typeof dateValue === 'number') {
        return new Date(dateValue);
    }
    
    // Unsupported format
    return null;
};

export const appointmentConverterToCalendarMarkedDates = (appointments: Appointment[]): MarkedDate => {
    
    // Debug input data
    if (appointments.length === 0) {
        return {};
    }
    
    const markedDates: MarkedDate = {};
    
    // Group appointments by date
    const appointmentsByDate: Record<string, Appointment[]> = {};
    
    // First pass: group appointments by date
    appointments.forEach((appointment, index) => {
        if (!appointment.startDate) {
            return;
        }
        
        // Parse date from various possible formats
        const date = parseDateValue(appointment.startDate);
        
        if (!date) {
            return;
        }
        
        const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD format
        
        
        if (!appointmentsByDate[dateString]) {
            appointmentsByDate[dateString] = [];
        }
        
        appointmentsByDate[dateString].push(appointment);
    });
    
    // Second pass: create dots for each date
    Object.entries(appointmentsByDate).forEach(([dateString, dateAppointments]) => {
        
        const dots = dateAppointments.map((appointment, index) => {
            // Default color if status is invalid
            let color = '#CCCCCC';
            // Always ensure unique keys by including appointment ID and index
            let key = `${appointment.id || 'appointment'}-${index}`;
            
            // Check if status is valid before accessing CalendarEventColor
            if (isValidStatus(appointment.status)) {
                const statusKey = appointment.status;
                const statusColor = CalendarEventColor[statusKey as keyof typeof CalendarEventColor];
                if (statusColor) {
                    color = statusColor.color;
                    // Use status color key as a prefix but ensure uniqueness with ID
                    key = `${statusColor.key || 'status'}-${appointment.id || index}`;
                }
            }
            
            return {
                key,
                color,
                selectedDotColor: '#ffffff'
            };
        });
        
        markedDates[dateString] = {
            dots,
            marked: true,
            // Use the first dot's color as the selected color (optional)
            selectedColor: dots.length > 0 ? dots[0].color : undefined
        };
    });
    return markedDates;
};