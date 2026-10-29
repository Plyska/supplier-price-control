import { LanguageTransitionProvider } from '../features/change-language'
import { AppHeader } from '../widgets/app-header'
import { MotionProvider } from './providers/MotionProvider'
import { AppRouter } from './routes/AppRouter'
import { QueryProvider } from './providers/QueryProvider'
import { LoginDraftProvider } from '../features/sign-in'
import { useMatch } from 'react-router'

export function App() {
  const workspaceMatch = useMatch('/organizations/:organizationId/*')
  return (
    <QueryProvider><LoginDraftProvider><MotionProvider>
      <LanguageTransitionProvider>
        <div className="min-h-screen bg-background text-foreground">
          {!workspaceMatch && <AppHeader />}
          <main className={workspaceMatch ? 'min-w-0' : 'mx-auto w-full max-w-6xl px-page py-10 sm:py-12'}>
            <AppRouter />
          </main>
        </div>
      </LanguageTransitionProvider>
    </MotionProvider></LoginDraftProvider></QueryProvider>
  )
}
