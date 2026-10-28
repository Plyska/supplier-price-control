import { useId, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import {
  supplierInputSchema,
  supplierSchema,
  type Supplier,
  type SupplierInput,
} from '@supplier-price-control/contracts'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { supplierKeys } from '@/entities/supplier'
import { apiClient, isApiError } from '@/shared/api/client'
import { useZodForm } from '@/shared/lib/form'

const supplierFormSchema = z.object({
  name: z.string().trim().min(1, 'required').max(200, 'tooLong'),
  notes: z.string().trim().max(1000, 'tooLong'),
}).transform((value): SupplierInput => supplierInputSchema.parse({
  name: value.name,
  notes: value.notes || null,
}))

type SupplierFormValues = z.input<typeof supplierFormSchema>

export function SupplierForm({
  onSaved,
  organizationId,
  supplier,
  userId,
}: {
  onSaved: (supplier: Supplier) => void
  organizationId: string
  supplier?: Supplier
  userId: string
}) {
  const { t } = useTranslation('suppliers')
  const queryClient = useQueryClient()
  const fieldId = useId().replaceAll(':', '')
  const [result, setResult] = useState<'success' | 'invalid' | 'forbidden' | 'unavailable' | null>(null)
  const form = useZodForm<SupplierFormValues, SupplierInput>({
    defaultValues: { name: supplier?.name ?? '', notes: supplier?.notes ?? '' },
    schema: supplierFormSchema,
  })
  const mutation = useMutation({
    mutationFn: async (input: SupplierInput) => {
      const path = `/organizations/${organizationId}/suppliers${supplier ? `/${supplier.id}` : ''}`
      const response = supplier
        ? await apiClient.patch(path, input)
        : await apiClient.post(path, input)
      return supplierSchema.parse(response.data.data)
    },
    onSuccess: async (saved) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: supplierKeys.all(userId, organizationId) }),
        queryClient.invalidateQueries({
          queryKey: supplierKeys.detail(userId, organizationId, saved.id),
        }),
      ])
      setResult('success')
      if (!supplier) form.reset({ name: '', notes: '' })
      onSaved(saved)
    },
  })
  const submit = form.handleSubmit(async (input) => {
    setResult(null)
    try {
      await mutation.mutateAsync(input)
    } catch (error) {
      const status = isApiError(error) ? error.response?.status : undefined
      setResult(status === 400
        ? 'invalid'
        : status === 403 || status === 404
          ? 'forbidden'
          : 'unavailable')
    }
  })

  return (
    <form className="max-w-xl space-y-5" noValidate onSubmit={submit}>
      <Field data-invalid={Boolean(form.formState.errors.name)}>
        <FieldLabel htmlFor={`${fieldId}-name`}>{t('form.name')}</FieldLabel>
        <Input
          aria-describedby={`${fieldId}-name-error`}
          aria-invalid={Boolean(form.formState.errors.name)}
          autoComplete="organization"
          id={`${fieldId}-name`}
          {...form.register('name')}
        />
        <FieldError id={`${fieldId}-name-error`} errors={[form.formState.errors.name]} />
      </Field>
      <Field data-invalid={Boolean(form.formState.errors.notes)}>
        <FieldLabel htmlFor={`${fieldId}-notes`}>{t('form.notes')}</FieldLabel>
        <Textarea
          aria-describedby={`${fieldId}-notes-description ${fieldId}-notes-error`}
          aria-invalid={Boolean(form.formState.errors.notes)}
          id={`${fieldId}-notes`}
          {...form.register('notes')}
        />
        <FieldDescription id={`${fieldId}-notes-description`}>{t('form.notesDescription')}</FieldDescription>
        <FieldError id={`${fieldId}-notes-error`} errors={[form.formState.errors.notes]} />
      </Field>
      {result && (
        <p className={result === 'success' ? 'text-sm text-foreground' : 'text-sm text-destructive'} role="status">
          {t(`form.result.${result}`)}
        </p>
      )}
      <Button disabled={mutation.isPending} type="submit">
        {t(mutation.isPending ? 'form.saving' : supplier ? 'form.save' : 'form.create')}
      </Button>
    </form>
  )
}
