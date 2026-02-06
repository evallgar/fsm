import { useQuery, useSuspenseQueries, useSuspenseQuery } from "@tanstack/react-query"
import { transactions } from "./api"

/**
 * useTransactionsQuery
 *
 * @returns Transaction[]
 */
export function useTransactionsQuery() {
  return useSuspenseQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      try {
        const response = await transactions.list()
        return response
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        return []
      }
    },
    refetchOnWindowFocus: false,
  })
}

/**
 * useTransactionQuery
 *
 * @param ids string[]
 * @returns Transaction[]
 */
export function useTransactionQuery(ids: (string | undefined)[]) {
  return useSuspenseQueries({
    queries: (ids ?? []).map((id) => ({
      queryKey: ['transaction', id],
      queryFn: async () => {
        try {
          if (!id) return null
          const response = await transactions.get(id)
          return response
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
          return null
        }
      },
      refetchOnWindowFocus: false,
    })),
  })
}

/**
 * useLatestTransactionsQuery
 *
 * @param contractId string
 * @param docsLimit number
 * @param docsOrderedBy string
 * @returns Transaction[]
 */
export function useLatestTransactionsQuery({ contractId, docsLimit, docsOrderedBy }: { contractId: string, docsLimit?: number, docsOrderedBy?: string }) {
  return useQuery({
    queryKey: ['latest-transactions', contractId],
    queryFn: async () => {
      try {
        const response = await transactions.getLatestContractTransactions({
          contractId,
          docsLimit,
          docsOrderedBy
        })
        return response
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        return []
      }
    },
    refetchOnWindowFocus: false,
  })
}


/**
 * getLatestTransactionsQueryOptions
 * Query options for compounded queries that needs to go together
 * @param contractId string
 * @param docsLimit number
 * @param docsOrderedBy string
 * @returns Transaction[]
 */
export function getLatestTransactionsQueryOptions({ contractId, docsLimit, docsOrderedBy }: { contractId: string, docsLimit?: number, docsOrderedBy?: string }) {
  return {
    queryKey: ['latest-transactions', contractId],
    queryFn: async () => {
      try {
        if (!contractId) return []
        const response = await transactions.getLatestContractTransactions({
          contractId,
          docsLimit,
          docsOrderedBy
        })
        return response
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        return null
      }
    },
    refetchOnWindowFocus: true,
  }
}

/**
 * getTransactionsByTypeQueryOptions
 * Query options for compounded queries that needs to go together
 * @param type 'income' | 'expense'
 * @param dateFrom Date
 * @param dateTo Date
 * @returns Transaction[]
 */
export function useTransactionsByTypeQueryOptions({ type, dateFrom, dateTo }: { type: 'income' | 'expense', dateFrom: Date, dateTo: Date }) {
  return {
    queryKey: ['transactions', type, dateFrom, dateTo],
    queryFn: async () => {
      try {
        const response = await transactions.getTransactionsByType({ type, dateFrom, dateTo })
        return response
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        return []
      }
    },
    refetchOnWindowFocus: false,
  }
}
  