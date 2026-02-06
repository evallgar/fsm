import { customers } from "./api"
import { queryOptions } from "@tanstack/react-query"

/**
 * useCustomerByIdQueryOptions
 * Query options for compounded queries that needs to go together
 * @returns Customer
 */
export function useCustomerByIdQueryOptions(customerId: string) {
    return queryOptions({
        queryKey: ['customer', customerId],
        queryFn: async () => {
            try {
                const response = await customers.get(customerId);
                return response || null
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (error) {
                return null
            }
        },
        refetchOnWindowFocus: true,
    })
}