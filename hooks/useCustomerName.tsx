import { useQuery } from "@tanstack/react-query";
import { useCustomerByIdQueryOptions } from "@/services/customers/queries";
import { Customer } from "@/services/customers/interfaces";

export default function useCustomerName(customerId: string) {
    const { data, isLoading, isError } = useQuery(
        useCustomerByIdQueryOptions(customerId)
    ) as { data: Customer; isLoading: boolean; isError: boolean };

    if (isError) return "";
    if (isLoading) return "";

    if (!data) return "";
    return data.name;
}
