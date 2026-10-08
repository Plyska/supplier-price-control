import { AppHeader } from '../widgets/app-header'
import { AppRouter } from './routes/AppRouter'

export function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <AppRouter />
      </main>
    </div>
  )
}
