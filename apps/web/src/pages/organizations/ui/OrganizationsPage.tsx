import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import * as Dialog from '@radix-ui/react-dialog'
import { AnimatePresence, m } from 'motion/react'
import { X } from 'lucide-react'
import { useSession } from '../../../entities/session'
import { useOrganizations, useOrganization } from '../../../entities/organization'
import { OrganizationForm } from '../../../features/manage-organization'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { LanguageSwitcher } from '../../../features/change-language'
import { backdropVariants, dialogTransition, dialogVariants } from '@/shared/config/motion'

export function OrganizationsPage() {
  const session = useSession()
  return session.data ? <OrganizationList userId={session.data.user.userId} /> : null
}

function OrganizationList({ userId }: { userId: string }) {
  const { t } = useTranslation('auth')
  const list = useOrganizations(userId)
  const navigate = useNavigate()
  const [isCreateOpen, setCreateOpen] = useState(false)

  return <section className="flex min-h-[calc(100dvh-9rem)] items-center justify-center py-6">
    <Card className="w-full max-w-xl gap-0 overflow-hidden">
      <CardHeader className="gap-2 border-b pb-6">
        <h1 className="text-xl font-semibold leading-none">{t('choose')}</h1>
        <CardDescription>{t('organizationListDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="min-h-48 py-6">
        {list.isPending ? <p role="status" className="text-sm text-muted-foreground">{t('loading')}</p> :
          list.isError ? <div role="alert" className="space-y-4"><p className="text-sm text-muted-foreground">{t('unavailable')}</p><Button onClick={() => void list.refetch()}>{t('retry')}</Button></div> :
            list.data.length === 0 ? <p className="text-sm text-muted-foreground">{t('noAccess')}</p> :
              <ul className="space-y-2">{list.data.map((organization) => <li key={organization.id}>
                <Link className="group flex items-center justify-between rounded-lg border px-4 py-3.5 font-medium transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring" to={`/organizations/${organization.id}`}>
                  <span>{organization.name}</span><span aria-hidden="true" className="text-muted-foreground transition-transform group-hover:translate-x-0.5">→</span>
                </Link>
              </li>)}</ul>}
      </CardContent>
      <CardFooter className="border-t bg-muted/30 px-6 py-4">
        <Button className="w-full" onClick={() => setCreateOpen(true)}>{t('createOrganization')}</Button>
      </CardFooter>
    </Card>
    <CreateOrganizationDialog open={isCreateOpen} onOpenChange={setCreateOpen} userId={userId} onSaved={(organizationId) => navigate(`/organizations/${organizationId}`)} />
  </section>
}

function CreateOrganizationDialog({ open, onOpenChange, userId, onSaved }: {
  open: boolean; onOpenChange: (open: boolean) => void; userId: string; onSaved: (organizationId: string) => void
}) {
  const { t } = useTranslation('auth')
  return <Dialog.Root open={open} onOpenChange={onOpenChange}>
    <Dialog.Portal forceMount>
      <AnimatePresence initial={false}>
        {open && <>
          <Dialog.Overlay forceMount asChild>
            <m.div className="fixed inset-0 z-50 bg-foreground/25 backdrop-blur-sm" variants={backdropVariants} initial="hidden" animate="visible" exit="hidden" />
          </Dialog.Overlay>
          <Dialog.Content forceMount asChild>
            <m.div className="fixed inset-x-4 top-1/2 z-50 mx-auto w-auto max-w-md -translate-y-1/2 rounded-card border bg-card p-6 shadow-lg focus:outline-none sm:inset-x-0" variants={dialogVariants} transition={dialogTransition} initial="hidden" animate="visible" exit="hidden">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <Dialog.Title className="text-lg font-semibold">{t('createOrganization')}</Dialog.Title>
                  <Dialog.Description className="text-sm text-muted-foreground">{t('createOrganizationDescription')}</Dialog.Description>
                </div>
                <Dialog.Close asChild><Button variant="ghost" size="icon" aria-label={t('closeDialog')}><X aria-hidden="true" className="size-4" /></Button></Dialog.Close>
              </div>
              <OrganizationForm autoFocus userId={userId} onSaved={(organization) => {
                onOpenChange(false)
                onSaved(organization.id)
              }} />
            </m.div>
          </Dialog.Content>
        </>}
      </AnimatePresence>
    </Dialog.Portal>
  </Dialog.Root>
}

export function OrganizationSettingsPage() {
  const { organizationId = '' } = useParams()
  const session = useSession()
  const organization = useOrganization(session.data?.user.userId ?? '', organizationId)
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  if (!session.data || !organization.data) return null
  if (organization.data.role !== 'owner') return <p role="alert">{t('forbidden')}</p>
  return <section className="mx-auto w-full max-w-xl space-y-6"><div className="space-y-2">
    <h1 className="text-2xl font-semibold">{t('settings')}</h1>
    <p className="text-sm text-muted-foreground">{t('settingsDescription')}</p>
  </div>
    <Card>
      <CardHeader>
        <CardTitle>{t('organizationSection')}</CardTitle>
        <CardDescription>{t('organizationSectionDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <OrganizationForm userId={session.data.user.userId} organization={organization.data} onSaved={() => navigate(`/organizations/${organizationId}`)} />
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle>{t('interfaceSection')}</CardTitle>
        <CardDescription>{t('interfaceSectionDescription')}</CardDescription>
        <CardAction className="self-center"><LanguageSwitcher showFullLabel /></CardAction>
      </CardHeader>
    </Card>
  </section>
}
