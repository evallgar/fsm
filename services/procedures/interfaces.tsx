export interface Procedure {
    id: string;
    active: boolean;
    deleted: boolean;
    type: string;
    severity: string;
    equipmentId: string;
    name: string;
    description: string;
    createdAt: Date;
    updatedAt: Date;
    procedure: string;
    tags: [];
}