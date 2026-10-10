import { z } from 'zod'
import { parseDateOnly } from '@/shared/lib/date'

const validationMessageKeys = {
  invalid: 'invalid',
  invalidDate: 'invalidDate',
  invalidEmail: 'invalidEmail',
  required: 'required',
  tooLong: 'tooLong',
  tooShort: 'tooShort',
} as const

type ValidationMessageKey =
  (typeof validationMessageKeys)[keyof typeof validationMessageKeys]

const validationMessageKeySet = new Set<string>(
  Object.values(validationMessageKeys),
)

function isValidationMessageKey(
  value: string,
): value is ValidationMessageKey {
  return validationMessageKeySet.has(value)
}

const requiredTextSchema = z
  .string()
  .trim()
  .min(1, { error: validationMessageKeys.required })

const dateOnlySchema = z.string().refine(
  (value) => parseDateOnly(value) !== null,
  { error: validationMessageKeys.invalidDate },
)

export {
  dateOnlySchema,
  isValidationMessageKey,
  requiredTextSchema,
  validationMessageKeys,
  type ValidationMessageKey,
}
