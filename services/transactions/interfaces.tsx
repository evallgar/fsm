/* eslint-disable @typescript-eslint/no-explicit-any */
import { z, ZodType } from 'zod'

export const TransactionZodSchema = (): ZodType<any> => {

  const zodSchema = z.object({
    account: z.string().optional(),
    accountable_amount: z.coerce.number().optional(),
    active: z.boolean().default(true),
    audit: z.boolean().default(false),
    audit_date: z.coerce.date().optional(),
    audit_branch: z.string().optional(),
    bank_source: z.string().optional(),
    bank_target: z.string().optional(),
    branch: z.string().optional(),
    capital_commissionable_amount: z.coerce.number().optional(),
    capital_commissionable_rate: z.string().optional(),
    concept: z.string().optional(),
    contract: z.string().nullable().optional(),
    created_by: z.string().optional(),
    date: z.coerce.date().optional(),
    deleted: z.boolean().optional().default(false),
    description: z.string().optional(),
    expense_accountable_amount: z.coerce.number().optional(),
    group_id: z.string().optional(),
    grouped_description: z.string().optional(),
    invoiceable: z.boolean().optional().default(false),
    is_accountable: z.boolean().optional().default(true),
    is_grouped: z.boolean().optional().default(false),
    is_settlement_expense: z.boolean().optional().default(false),
    payment_method: z.string().optional(),
    revised: z.boolean().optional().default(false),
    transaction_amount: z.coerce.number().optional(),
    transaction_tax: z.coerce.number().optional(),
    transaction_type: z.enum(['Ingreso', 'Egreso'])
  })

  return zodSchema
}

