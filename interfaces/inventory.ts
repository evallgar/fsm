import { GeoPoint, Timestamp } from "firebase/firestore";

export interface InventoryEquipment {
    active: boolean;
    deleted: boolean;
    id?: string;
    code: string;
    name: string;
    model: string;
    serialNumber: string;
    manufacturer: string;
    photoURL?: string;
    location?: GeoPoint;
    locationName: string;
    cost?: number;
    arrivalDate: Timestamp | any;
    installationDate: Timestamp | any;
    warrantyDate: Timestamp | any;
    supplierId?: string;
    pmInterval?: PMInterval;
    inspections?: PMInterval;
    operationalStatus?: boolean;
    department?: string;
    category?: string;
    tags: string[] | null;
    equipmentId: string;
}

export interface Location {
    id?: string;
    active: boolean;
    deleted: boolean;
    name: string;
    location: {
        latitude: number;
        longitude: number;
    }
}

export enum PMInterval {
    DAILY = 'daily',
    WEEKLY = 'weekly',
    BIWEEKLY = 'biweekly',
    MONTHLY = 'monthly',
    QUARTERLY = 'quarterly',
    BIANNUAL = 'biannual',
    ANNUAL = 'annual'
}

export interface InventoryProduct {
    id?: string;
    active: boolean;
    deleted: boolean;
    description: string | null;
    measureUnit: string | null;
    measureUnitInv: string | null;
    tags: string[] | null;
    name: string | null;
    preferred_vendor_id: string | null;
    price: number | null;
    sku: string | null;
    stock: number;
    reserved: number;
    cost: number;
    basePrice: number;
    taxPercent: number;
    weight: number;
}

export interface InventoryPagination {
    length?: number;
    size?: number;
    page?: number;
    lastPage?: number;
    startIndex?: number;
    endIndex?: number;
}

export interface InventoryCategory {
    id?: string;
    active: boolean;
    deleted: boolean;
    parentId?: string;
    name: string;
    slug: string;
}

export interface InventoryDepartment {
    id?: string;
    active: boolean;
    deleted: boolean;
    parentId?: string;
    name: string;
    slug: string;
}

export interface InventoryManufacturer {
    id: string;
    active: boolean;
    deleted: boolean;
    name: string;
    slug: string;
}

export interface InventoryTag {
    id?: string;
    active: boolean;
    deleted: boolean;
    title?: string;
    slug?: string;
}

export interface InventorySupplier {
    id: string;
    name: string;
    slug: string;
}
