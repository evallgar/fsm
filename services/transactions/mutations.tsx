/* eslint-disable no-console */
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCreateHistoryLog } from '@/services/history-logs/mutations'
import { getAuth } from 'firebase/auth'
import { showGregorSays } from '@/utils/show-gregor-says'
import { transactions } from './api'
import { TransactionZodSchema } from './interfaces'

type Transaction = z.infer<ReturnType<typeof TransactionZodSchema>>

/**
 * useCreateTransaction
 *
 * @export
 * @return {*}
 */
export function useCreateTransaction() {
  const queryClient = useQueryClient()
  const user = getAuth().currentUser
  const { mutate: logAction } = useCreateHistoryLog()
  return useMutation({
    mutationFn: (data: Transaction) => transactions.create(data),
    // onMutate: () => {
    //   console.log('mutating...')
    // },
    onSuccess: () => {
      showGregorSays({
        type: 'success',
        content: 'Collection document created successfully',
      })
    },
    onError: () => {
      console.log('mutated failed')
      showGregorSays({ type: 'danger', content: 'Collection document creation failed' })
    },
    onSettled: async (data, error) => {
      if (error) {
        console.log('mutated failed')
        showGregorSays({ type: 'danger', content: 'Collection document creation failed' })
      } else {
        console.log('mutated settled')
        console.log(data)
        console.log(user)
        console.log(data.id)
        await queryClient.invalidateQueries({
          queryKey: ['transactions'],
        })
        if (data && user) {
          console.log('logging action bc data and user')
          const logData = {
            id: data.id,
            notification: {
              date: new Date().toISOString(),
              message: 'Collection document created',
              type: 'create',
              user: user.displayName || user.email || user.uid,
            }
          }
          console.log(logData)
          logAction(logData)
        }
      }
    },
  })
}

/**
 * useUpdateTransaction
 * Updates a collection document
 * @export
 * @param {string} id
 * @return {*}
 */
export function useUpdateTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Transaction) => transactions.update(data.id, data),
    onMutate: () => {
      console.log('mutating...')
    },
    onSuccess: () => {
      console.log('mutated successfully')
      showGregorSays({
        type: 'success',
        content: 'Collection document updated successfully',
      })
    },
    onError: (data, error) => {
      console.log('mutated failed')
      console.log(data)
      console.log(error)
      showGregorSays({ type: 'danger', content: 'Collection document update failed' })
    },
    onSettled: async (_, error, variables) => {
      if (error) {
        console.log('mutated failed')
        showGregorSays({ type: 'danger', content: 'Collection document update failed' })
      } else {
        console.log('mutated settled', variables)
        await queryClient.invalidateQueries({
          queryKey: ['transactions'],
        })
        await queryClient.invalidateQueries({
          queryKey: ['transaction', { id: variables.id }],
        })
      }
    },
  })
}

/**
 * useDeleteTransaction
 * Deletes a collection document
 * @export
 * @return {*}
 */
export function useDeleteTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => transactions.delete(id),
    onMutate: () => {
      console.log('mutating...')
    },
    onSuccess: () => {
      console.log('mutated successfully')
      showGregorSays({
        type: 'success',
        content: 'Collection document deleted successfully',
      })
    },
    onError: () => {
      console.log('mutated failed')
      showGregorSays({ type: 'danger', content: 'Collection document deletion failed' })
    },
    onSettled: async (_, error) => {
      if (error) {
        console.log('mutated failed')
        showGregorSays({ type: 'danger', content: 'Collection document deletion failed' })
      } else {
        await queryClient.invalidateQueries({
          queryKey: ['transactions'],
        })
      }
    },
  })
}

