import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import { apiClient, isApiError } from '@/shared/api/client'
import { useZodForm } from '@/shared/lib/form'
import { organizationSchema, type Organization } from '../../../entities/organization'

const schema = z.object({
  name: z.string().trim().min(1, 'required').max(200, 'tooLong'),
  timeZone: z.string().trim().max(100, 'tooLong').refine((value) => {
    try { if (value) new Intl.DateTimeFormat('en', { timeZone: value }); return true } catch { return false }
  }, 'invalid'),
})

export function OrganizationForm({ userId, organization, onSaved, autoFocus = false }: {
  userId: string; organization?: Organization; onSaved: (organization: Organization) => void; autoFocus?: boolean
}) {
  const { t } = useTranslation('auth')
  const client = useQueryClient()
  const [error, setError] = useState<'invalidOrganization' | 'forbidden' | 'unavailable' | null>(null)
  const [attempt, setAttempt] = useState<{ payload: string; key: string } | null>(null)
  const form = useZodForm({ schema, defaultValues: { name: organization?.name ?? '', timeZone: organization?.timeZone ?? '' } })
  const submit = form.handleSubmit(async (values) => {
    setError(null)
    const data = { ...values, timeZone: values.timeZone || null }
    const payload = JSON.stringify(data)
    const operation = attempt?.payload === payload ? attempt : { payload, key: crypto.randomUUID() }
    setAttempt(operation)
    try {
      const response = organization
        ? await apiClient.patch(`/organizations/${organization.id}`, data)
        : await apiClient.post('/organizations', data, { headers: { 'Idempotency-Key': operation.key } })
      const saved = organizationSchema.parse(response.data.data)
      await client.invalidateQueries({ queryKey: ['organizations', userId] })
      await client.invalidateQueries({ queryKey: ['organization', userId, saved.id] })
      onSaved(saved)
    } catch (cause) {
      const status = isApiError(cause) ? cause.response?.status : undefined
      setError(status === 400 ? 'invalidOrganization' : status === 403 || status === 404 ? 'forbidden' : 'unavailable')
    }
  })
  return <form onSubmit={submit} noValidate className="max-w-md space-y-4">
    <Field><FieldLabel htmlFor="organization-name">{t('name')}</FieldLabel>
      <Input id="organization-name" autoFocus={autoFocus} {...form.register('name')} aria-invalid={Boolean(form.formState.errors.name)} aria-describedby="organization-name-error" />
      <FieldError id="organization-name-error" errors={[form.formState.errors.name]} /></Field>
    <Field><FieldLabel htmlFor="organization-timezone">{t('timeZone')}</FieldLabel>
      <Input id="organization-timezone" placeholder="Europe/Prague" {...form.register('timeZone')} aria-invalid={Boolean(form.formState.errors.timeZone)} aria-describedby="organization-timezone-error" />
      <FieldError id="organization-timezone-error" errors={[form.formState.errors.timeZone]} /></Field>
    {error && <p role="alert" className="text-sm text-destructive">{t(error)}</p>}
    <Button disabled={form.formState.isSubmitting}>{t(form.formState.isSubmitting ? 'working' : organization ? 'save' : 'createOrganization')}</Button>
  </form>
}
