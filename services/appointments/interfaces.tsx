import { GeoPoint, Timestamp } from "firebase/firestore";

export interface Equipment {
    active: boolean;
    arrivalDate: any;
    category: string;
    code: string;
    cost: number;
    deleted: boolean;
    department: string;
    id: string;
    inspections: string;
    installationDate: any;
    location: any;
    locationName: string;
    manufacturer: string;
    model: string;
    name: string;
    notes: string;
    operationalStatus: boolean;
    photoURL: string;
    pmInterval: string;
    serialNumber: string;
    supplierId: string;
    tags: string[];
    warrantyDate: any;
}

export interface Location {
    active: boolean;
    deleted: boolean;
    id: string;
    location: GeoPoint;
    name: string;
    notes: string;
    photoURL: string;
    tags: string[];
}

export interface Measurement {
    dataType: string;
    label: string;
    measureUnit: string;
    metric: string;
    value: string;
}

export interface Material {
    id: string;
    name?: string;
    notes?: string;
    quantity: number;
    unit?: string;
    providedByUser?: boolean;
    providedByCustomer?: boolean;
}

export interface Findings {
    images: string[];
    measurements: any[];
    notes: string;
}

export enum WorkOrderStatus {
    New = 'new',
    Open = 'open',
    OnHold = 'onHold',
    InProgress = 'inProgress',
    Completed = 'completed',
    Done = 'done',
}

export interface Results {
    images: string[];
    measurements: any[];
    notes: string;
}

export interface FirestoreTimestamp {
    nanoseconds: number;
    seconds: number;
    type: string;
}

// WorkOrder interface based on the actual data structure used in the application
export interface WorkOrder {
    // Base fields
    id: string;
    agentId: string[];
    branchId: string;
    entityId: string;
    departmentId: string;
    serviced: 'location' | 'onsite' | 'remote';
    primaryContactId: string;
    user?: string;
    title: string;
    name: string;
    description: string;
    subject?: string;
    equipmentId: string;
    photoURL?: string;
    customerId: string;
    
    // Status fields
    status: WorkOrderStatus;
    active: boolean;
    completed: boolean;
    deleted: boolean;

    // Names
    customerName: string;
    primaryContactName: string;
    branchName: string;
    
    // Time fields
    createdAt: Date | string | Timestamp;
    startTime: Date | string | Timestamp;
    startDate: Timestamp;
    endTime: Date | string | Timestamp;
    endDate: Timestamp;
    dueDate: Date | string | Timestamp;
    StartTime?: Date | string | Timestamp | null;
    EndTime?: Date | string | Timestamp | null;
    isAllDay: boolean;
    
    // Location
    location?: Location;
    
    // Equipment
    equipment?: Equipment;
    
    // Type information
    eventType: string;
    type: string;
    priority: string;
    
    // Findings and results
    findings?: Findings;
    results?: Results;
    measurements?: Measurement[];
    images?: string[];
    notes?: string;
    materials?: Material[];
    
    // Signature related
    signatureProvided?: boolean;
    signatureUrl?: string;
    noSignatureReason?: string;
    signedAt?: FirestoreTimestamp | Date;
    
    // Other fields
    ownerId: string;
    tags: string[];
}
