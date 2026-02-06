import { GeoPoint, Timestamp } from "firebase/firestore";

/**
 * Interface for a class FieldOptions
 */
export interface FieldOptionsModel {

    /**
     * Denotes the field name to be mapped from the dataSource for every event fields.
     *
     * @default null
     */
    name?: string;

    /**
     * Assigns the specific default value to the fields, when no values are provided to those fields from dataSource.
     *
     * @default null
     */
    default?: string;

    /**
     * Assigns the label values to be displayed for the event editor fields.
     *
     * @default null
     */
    title?: string;

    /**
     * Defines the validation rules to be applied on the event fields within the event editor.
     * {% codeBlock src="schedule/validation-api/index.ts" %}{% endcodeBlock %}
     *
     * @default {}
     */
    validation?: Record<string, any>;

}

export interface FieldModel {

    photoURL?: string;
    name?: string;
    location?: GeoPoint;
    Location?: string;
    EventType?: string;
    eventType?: string;
    equipmentId: string;
    status?: string;
    dueDate: Timestamp;
    /**
     * The `id` field needs to be defined as mandatory, when the Schedule is bound to remote data and
     *  it is optional, if the same is bound with JSON data. This field usually assigns ID value to each of the events.
     *
     * @default null
     */
    id?: string;

    /**
     * The `isBlock` field allows you to block certain time interval on the Scheduler.
     * It is a boolean type property accepting either true or false values.
     * When set to true, creates a block range for the specified time interval and disables the event scheduling actions on that time range.
     *
     * @default null
     */
    isBlock?: string;

    /**
     * The `subject` field is optional, and usually assigns the subject text to each of the events.
     *
     * @default { name: null, default: null, title: null, validation: {}  }
     */
    Subject?: FieldOptionsModel;

    /**
     * The `startTime` field defines the start time of an event and it is mandatory to provide it for any of the valid event objects.
     *
     * @default { name: null, default: null, title: null, validation: {} }
     */
    StartTime?: Timestamp;
    startTime?: Timestamp;

    /**
     * The `endTime` field defines the end time of an event and it is mandatory to provide the end time for any of the valid event objects.
     *
     * @default { name: null, default: null, title: null, validation: {} }
     */
    EndTime?: Timestamp;
    endTime?: Timestamp;

    /**
     * It maps the `startTimezone` field from the dataSource and usually accepts the valid
     * [`IANA timezone names`](https://docs.actian.com/ingres/11.0/index.html#page/Ing_Install/IANA_World_Regions_and_Time_Zone_Names.htm).
     *  It is assumed that the value provided for this field is taken into consideration while processing
     *  the `startTime` field. When this field is not mapped with any timezone names,
     *  then the events will be processed based on the timezone assigned to the Schedule.
     *
     * @default { name: null, default: null, title: null, validation: {} }
     */
    startTimezone?: FieldOptionsModel;

    /**
     * It maps the `endTimezone` field from the dataSource and usually accepts the valid
     * [`IANA timezone names`](https://docs.actian.com/ingres/11.0/index.html#page/Ing_Install/IANA_World_Regions_and_Time_Zone_Names.htm).
     *  It is assumed that the value provided for this field is taken into consideration while processing the `endTime` field.
     *  When this field is not mapped with any timezone names, then the events will be processed based on the timezone assigned
     *  to the Schedule.
     *
     * @default { name: null, default: null, title: null, validation: {} }
     */
    endTimezone?: FieldOptionsModel;

    /**
     * It maps the `location` field from the dataSource and the location field value will be displayed over
     *  events, while given it for an event object.
     *
     * @default { name: null, default: null, title: null, validation: {} }
     */
    // location?: FieldOptionsModel;

    /**
     * It maps the `description` field from the dataSource and denotes the event description which is optional.
     *
     * @default { name: null, default: null, title: null, validation: {} }
     */
    Description?: FieldOptionsModel;
    description?: FieldOptionsModel;
    subject?: FieldOptionsModel;

    /**
     * The `isAllDay` field is mapped from the dataSource and is used to denote whether an event is created
     * for an entire day or for specific time alone.
     *
     * @default { name: null, default: null, title: null, validation: {} }
     */
    isAllDay?: FieldOptionsModel;

    /**
     * It maps the `recurrenceID` field from dataSource and usually holds the ID value of the parent
     *  recurrence event. It is applicable only for the edited occurrence events.
     *
     * @default { name: null, default: null, title: null, validation: {} }
     */
    recurrenceID?: FieldOptionsModel;

    /**
     * It maps the `recurrenceRule` field from dataSource and is used to uniquely identify whether the
     *  event belongs to a recurring event type or normal ones.
     *
     * @default { name: null, default: null, title: null, validation: {} }
     */
    recurrenceRule?: FieldOptionsModel;

    /**
     * It maps the `recurrenceException` field from dataSource and is used to hold the exception dates
     *  which needs to be excluded from recurring type.
     *
     * @default { name: null, default: null, title: null, validation: {} }
     */
    recurrenceException?: FieldOptionsModel;

    /**
     * The `isReadonly` field is mapped from the dataSource and is used to prevent the CRUD actions on specific events.
     *
     * @default null
     */
    isReadonly?: string;

    /**
     * The `followingID` field is mapped from dataSource and usually holds the ID value of the main parent event.
     *
     * @default null
     */
    followingID?: string;

}

export interface WorkOrder extends FieldModel {
    photoURL?: string;
    findings?: any;
    results?: any;
}

export enum Status {
    OPEN = "open",
    ON_HOLD = "onHold",
    PENDING = "pending",
    IN_PROGRESS = "inProgress",
    COMPLETED = "completed",
    CANCELLED = "cancelled",
    DONE = "done",
}
