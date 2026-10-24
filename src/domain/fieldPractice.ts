import type { Field } from './judgeExam'
import type { Question } from './question'

export const FIELDS: readonly Field[] = ['strategy', 'management', 'technology']

export const pickByField = (
  pool: readonly Question[],
  field: Field,
): Question[] => pool.filter((question) => question.field === field)

export const countByField = (
  pool: readonly Question[],
): Record<Field, number> => ({
  strategy: pickByField(pool, 'strategy').length,
  management: pickByField(pool, 'management').length,
  technology: pickByField(pool, 'technology').length,
})
