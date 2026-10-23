import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import { useZodForm } from '@/shared/lib/form'
import { apiClient, isApiError } from '@/shared/api/client'
import { useLoginDraft } from '../model/use-login-draft'
import { notifySessionChange } from '../../../entities/session'

const schema = z.object({ email: z.string().trim().pipe(z.email({ error: 'invalidEmail' })) })

export function LoginForm() {
  const { t } = useTranslation('auth')
  const { draft, setDraft } = useLoginDraft()
  const form = useZodForm({ schema, defaultValues: { email: draft.email } })
  const [error, setError] = useState<'unavailable' | 'invalidLink' | 'rateLimited' | null>(null)
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const client = useQueryClient()
  const verifying = location.pathname === '/login/verify'
  const report = (cause: unknown) => {
    setError(isApiError(cause) && cause.response?.status === 429 ? 'rateLimited'
      : isApiError(cause) && cause.response?.status === 400 ? 'invalidLink' : 'unavailable')
  }
  const requestLink = form.handleSubmit(async ({ email }) => {
    setError(null)
    try {
      await apiClient.post('/auth/login', { email })
      setDraft((previous) => ({ ...previous, email, sent: true }))
    } catch (cause) { report(cause) }
  })
  const verify = async () => {
    setBusy(true)
    setError(null)
    try {
      await apiClient.post('/auth/verify', { token: draft.token })
      await client.cancelQueries()
      client.clear()
      notifySessionChange()
      setDraft({ email: '', sent: false, token: null })
      navigate('/', { replace: true })
    } catch (cause) { report(cause) } finally { setBusy(false) }
  }
  return <div className="mx-auto max-w-md rounded-xl border bg-card p-6 sm:p-8">
    <h1 className="text-2xl font-semibold tracking-tight">{t(verifying ? 'confirmTitle' : 'title')}</h1>
    <p className="mt-3 text-sm text-muted-foreground">{t(verifying ? 'confirmDescription' : 'description')}</p>
    {location.state?.expired && <p role="status" className="mt-3 text-sm">{t('expiredSession')}</p>}
    {verifying ? <div className="mt-6 space-y-4">
      {!draft.token ? <p role="alert">{t('invalidLink')}</p> :
        <Button className="w-full" disabled={busy} onClick={() => void verify()}>{t(busy ? 'working' : 'confirm')}</Button>}
      <Button variant="ghost" onClick={() => { setDraft((old) => ({ ...old, sent: false, token: null })); navigate('/login', { replace: true }) }}>{t('requestAnother')}</Button>
    </div> : draft.sent ? <div className="mt-6 space-y-4">
      <p role="status" className="text-sm">{t('sent')}</p>
      <Button variant="outline" onClick={() => setDraft((old) => ({ ...old, sent: false }))}>{t('requestAnother')}</Button>
    </div> : <form className="mt-6 space-y-5" onSubmit={requestLink} noValidate>
      <Field>
        <FieldLabel htmlFor="login-email">{t('email')}</FieldLabel>
        <Input id="login-email" type="email" autoComplete="email" autoFocus aria-invalid={Boolean(form.formState.errors.email)} aria-describedby="email-error"
          {...form.register('email', { onChange: (event) => setDraft((old) => ({ ...old, email: event.target.value })) })} />
        <FieldError id="email-error" errors={[form.formState.errors.email]} />
      </Field>
      <Button className="w-full" disabled={form.formState.isSubmitting}>{t(form.formState.isSubmitting ? 'working' : 'send')}</Button>
    </form>}
    {error && <p role="alert" className="mt-4 text-sm text-destructive">{t(error)}</p>}
  </div>
}
