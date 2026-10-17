import { GeoPoint, Timestamp } from "firebase/firestore"; // types only: the data comes from the OneMap server

export interface Customer {
    id: string;
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
