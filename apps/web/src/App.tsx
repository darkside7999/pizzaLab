import { Link } from 'react-router-dom'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-neutral-800 bg-neutral-900/60 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-xl font-semibold text-white">Titan Gym</Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link to="/" className="hover:text-white">Inicio</Link>
            <Link to="/admin" className="hover:text-white">Administración</Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
      <footer className="border-t border-neutral-800 bg-neutral-900/60">
        <div className="max-w-6xl mx-auto px-4 py-4 text-xs text-neutral-400">© {new Date().getFullYear()} Titan Gym</div>
      </footer>
    </div>
  )
}
