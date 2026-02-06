import { GeoPoint, Timestamp } from "firebase/firestore";

export interface Customer {
    active: boolean;
    address: {
        city: string;
        state: string;
        street: string;
        zip: string;
    };
    branches: string[];
    contacts: string[];
    createdAt: Date | Timestamp;
    deleted: boolean;
    legal: {
        vatId: string;
    };
    location: GeoPoint;
    name: string;
    notes: string;
    photoURL: string;
    serviceEntity: string;
    serviceEntityId: string;
    tags: string[];
}
