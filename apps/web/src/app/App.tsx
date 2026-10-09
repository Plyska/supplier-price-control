import { LanguageTransitionProvider } from '../features/change-language'
import { AppHeader } from '../widgets/app-header'
import { MotionProvider } from './providers/MotionProvider'
import { AppRouter } from './routes/AppRouter'

export function App() {
  return (
    <MotionProvider>
      <LanguageTransitionProvider>
        <div className="min-h-screen bg-slate-50 text-slate-950">
          <AppHeader />
          <main className="mx-auto w-full max-w-6xl px-6 py-10">
            <AppRouter />
          </main>
        </div>
      </LanguageTransitionProvider>
    </MotionProvider>
  )
}
