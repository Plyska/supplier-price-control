import { LanguageTransitionProvider } from '../features/change-language'
import { AppHeader } from '../widgets/app-header'
import { MotionProvider } from './providers/MotionProvider'
import { AppRouter } from './routes/AppRouter'
import { QueryProvider } from './providers/QueryProvider'
import { LoginDraftProvider } from '../features/sign-in'

export function App() {
  return (
    <QueryProvider><LoginDraftProvider><MotionProvider>
      <LanguageTransitionProvider>
        <div className="min-h-screen bg-background text-foreground">
          <AppHeader />
          <main className="mx-auto w-full max-w-6xl px-page py-10 sm:py-12">
            <AppRouter />
          </main>
        </div>
      </LanguageTransitionProvider>
    </MotionProvider></LoginDraftProvider></QueryProvider>
  )
}
