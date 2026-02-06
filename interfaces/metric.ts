export interface Metric {
    id?: string;
    name: string;
    label: string;
    measureUnit: string;
    dataType: 'text' | 'number';
    minValue?: number;
    maxValue?: number;
    value?: string | number;
}