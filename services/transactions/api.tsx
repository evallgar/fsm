import z from "zod";
import { TransactionZodSchema } from "./interfaces";
import { createFirestoreCRUD } from "@/lib/firestore.factory";
import { db } from "@/lib/firebase-config";
import { where } from "firebase/firestore";
import { startOfToday, endOfToday } from "date-fns";

type Transaction = z.infer<ReturnType<typeof TransactionZodSchema>>

const transactionsService = createFirestoreCRUD<Transaction>(
  db,
  "transactions",
  ['audit_date', 'date']
);

export const transactions = {
  ...transactionsService,

  /**
   * Get transactions by date
   * @param date 
   * @returns 
   */
  getTransactionsByDate: async (date: string) => {
    return transactionsService.list([
      where('date', '==', date),
    ]);
  },

  /**
   * Get latest contract transactions
   * @param contractId 
   * @param limit 
   * By default latest 10 transactions
   * By default ordered by date from latest to oldest (desc)
   * @returns 
   */
  getLatestContractTransactions: async ({ contractId, docsLimit, docsOrderedBy }: { contractId: string, docsLimit?: number, docsOrderedBy?: string }) => {
    return transactionsService.latest([
      where('contract', '==', contractId),
    ], docsLimit || 10, docsOrderedBy || 'date');
  },

  /**
 * Get transactions by type
 * @param type 'income'| 'expense'
 * @param dateFrom
 * @param dateTo
 * @returns 
 */
  getTransactionsByType: async ({ type, dateFrom, dateTo }: { type: 'income' | 'expense', dateFrom?: Date, dateTo?: Date }) => {
    const normalizedType = type === 'income' ? 'Ingreso' : 'Egreso'
    return transactionsService.list([
      where('transaction_type', '==', normalizedType),
      where('date', '>=', dateFrom ?? startOfToday()),
      where('date', '<=', dateTo ?? endOfToday()),
    ]);
  },
};

export type Transactions = typeof transactions;
