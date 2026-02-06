import { MarkingProps } from "react-native-calendars/src/calendar/day/marking";

/**
 * CalendarMonth
 * @interface CalendarMonth
 * @property {string} dateString - The date string of the month
 * @property {number} day - The day of the month
 * @property {number} month - The month of the year
 * @property {number} timestamp - The timestamp of the month
 * @property {number} year - The year of the month
 */
export interface CalendarMonth {
    dateString: string;
    day: number;
    month: number;
    timestamp: number;
    year: number;
}

/**
 * MarkedDate
 * @interface MarkedDate
 * @property {string} key - The key of the marked date
 * @property {object} value - The value of the marked date
 * @property {any[]} dots - The dots of the marked date
 * @property {boolean} marked - The marked status of the marked date
 * @property {string} dotColor - The dot color of the marked date
 * @property {number} activeOpacity - The active opacity of the marked date
 * @property {boolean} disabled - The disabled status of the marked date
 * @property {boolean} disableTouchEvent - The disable touch event status of the marked date
 * @property {boolean} selected - The selected status of the marked date
 * @property {string} selectedDotColor - The selected dot color of the marked date
 */
export interface MarkedDate {
    [key: string]: MarkingProps | {
        dots?: Array<{key: string, color: string, selectedDotColor?: string}>;
        marked?: boolean;
        selected?: boolean;
        selectedColor?: string;
        disableTouchEvent?: boolean;
    };
}

export const CalendarEventColor = {
    OPEN: { key: "open", color: "#FF0000", selectedDotColor: "#ffffff", },
    ON_HOLD: { key: "onHold", color: "#0000FF", selectedDotColor: "#ffffff", },
    PENDING: { key: "pending", color: "#00FF00", selectedDotColor: "#ffffff", },
    IN_PROGRESS: { key: "inProgress", color: "#FFFF00", selectedDotColor: "#ffffff", },
    COMPLETED: { key: "completed", color: "#00FF00", selectedDotColor: "#ffffff", },
    CANCELLED: { key: "cancelled", color: "#FF0000", selectedDotColor: "#ffffff", },
    DONE: { key: "done", color: "#00FF00", selectedDotColor: "#ffffff", },
}
