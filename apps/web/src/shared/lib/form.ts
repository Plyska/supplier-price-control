import { zodResolver } from '@hookform/resolvers/zod'
import {
  useForm,
  type FieldValues,
  type UseFormProps,
  type UseFormReturn,
} from 'react-hook-form'
import type { ZodType } from 'zod'

type UseZodFormProps<
  TInput extends FieldValues,
  TOutput extends FieldValues = TInput,
  TContext = unknown,
> = Omit<UseFormProps<TInput, TContext, TOutput>, 'resolver'> & {
  schema: ZodType<TOutput, TInput>
}

function useZodForm<
  TInput extends FieldValues,
  TOutput extends FieldValues = TInput,
  TContext = unknown,
>({
  schema,
  ...props
}: UseZodFormProps<TInput, TOutput, TContext>): UseFormReturn<
  TInput,
  TContext,
  TOutput
> {
  return useForm<TInput, TContext, TOutput>({
    ...props,
    resolver: zodResolver(schema),
  })
}

export { useZodForm, type UseZodFormProps }
