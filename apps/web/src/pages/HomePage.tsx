import { useEffect, useState } from 'react'
import AppLayout from '../App'

type Welcome = { gymName: string; message: string }

type Plan = { id: string; name: string; tier: 'VIP' | 'NORMAL'; pricePerMonth: number; access: string[] }

type Coach = { id: string; name: string; specialty: string }

export default function HomePage() {
  const [welcome, setWelcome] = useState<Welcome | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [coaches, setCoaches] = useState<Coach[]>([])

  useEffect(() => {
    fetch('/api/welcome').then(r => r.json()).then(setWelcome)
    fetch('/api/plans').then(r => r.json()).then(setPlans)
    fetch('/api/coaches').then(r => r.json()).then(setCoaches)
  }, [])

  return (
    <AppLayout>
      <section className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{welcome?.gymName ?? 'Titan Gym'}</h1>
          <p className="text-neutral-300 text-lg max-w-2xl">{welcome?.message ?? 'Entrena mejor, vive mejor.'}</p>
          <div className="mt-8 flex gap-4">
            <a href="#planes" className="px-5 py-3 rounded-md bg-emerald-500 text-black font-semibold">Ver planes</a>
            <a href="#coaches" className="px-5 py-3 rounded-md border border-neutral-700">Conoce a los coaches</a>
          </div>
        </div>
      </section>

      <section id="planes" className="border-t border-neutral-800 bg-neutral-900/40">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-semibold mb-6">Planes</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {plans.map(p => (
              <div key={p.id} className="rounded-lg border border-neutral-800 p-6 bg-neutral-950/60">
                <div className="flex items-baseline justify-between">
                  <div className="text-lg font-medium">{p.name}</div>
                  <span className="text-xs px-2 py-1 rounded bg-neutral-800">{p.tier}</span>
                </div>
                <div className="mt-2 text-3xl font-bold">€{p.pricePerMonth.toFixed(2)}<span className="text-sm font-normal text-neutral-400">/mes</span></div>
                <div className="mt-4 text-sm text-neutral-300">Acceso a: {p.access.join(', ') || '—'}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="coaches" className="border-t border-neutral-800">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-semibold mb-6">Coaches</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {coaches.map(c => (
              <div key={c.id} className="rounded-lg border border-neutral-800 p-6 bg-neutral-950/60">
                <div className="text-lg font-medium">{c.name}</div>
                <div className="text-sm text-neutral-400">{c.specialty}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </AppLayout>
  )
}