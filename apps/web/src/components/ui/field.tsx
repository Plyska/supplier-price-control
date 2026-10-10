import type { ComponentProps, ReactNode } from 'react'
import type { FieldError as HookFormFieldError } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Label } from '@/components/ui/label'
import {
  isValidationMessageKey,
  type ValidationMessageKey,
} from '@/shared/lib/validation'
import { cn } from '@/shared/lib/utils'

function Field({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'group/field flex w-full flex-col gap-2 data-[invalid=true]:text-destructive',
        className,
      )}
      data-slot="field"
      role="group"
      {...props}
    />
  )
}

function FieldGroup({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('flex w-full flex-col gap-6', className)}
      data-slot="field-group"
      {...props}
    />
  )
}

function FieldLabel({
  className,
  ...props
}: ComponentProps<typeof Label>) {
  return (
    <Label
      className={cn(
        'w-fit leading-snug group-data-[disabled=true]/field:opacity-50',
        className,
      )}
      data-slot="field-label"
      {...props}
    />
  )
}

function FieldDescription({ className, ...props }: ComponentProps<'p'>) {
  return (
    <p
      className={cn('text-sm leading-5 text-muted-foreground', className)}
      data-slot="field-description"
      {...props}
    />
  )
}

type FormError = Pick<HookFormFieldError, 'message'> | undefined

function FieldError({
  children,
  className,
  errors,
  ...props
}: ComponentProps<'div'> & {
  errors?: FormError[]
}) {
  const { t } = useTranslation('validation')
  const uniqueMessages = [
    ...new Set(
      errors
        ?.map((error) => error?.message)
        .filter((message): message is string => Boolean(message)),
    ),
  ]

  const translateMessage = (message: string) =>
    isValidationMessageKey(message)
      ? t(message satisfies ValidationMessageKey)
      : message

  let content: ReactNode = children

  if (!content && uniqueMessages.length === 1) {
    content = translateMessage(uniqueMessages[0])
  }

  if (!content && uniqueMessages.length > 1) {
    content = (
      <ul className="ml-4 list-disc space-y-1">
        {uniqueMessages.map((message) => (
          <li key={message}>{translateMessage(message)}</li>
        ))}
      </ul>
    )
  }

  if (!content) return null

  return (
    <div
      className={cn('text-sm text-destructive', className)}
      data-slot="field-error"
      role="alert"
      {...props}
    >
      {content}
    </div>
  )
}

export { Field, FieldDescription, FieldError, FieldGroup, FieldLabel }
