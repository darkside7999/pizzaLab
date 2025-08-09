import { useEffect, useMemo, useState } from 'react'
import AppLayout from '../App'

export default function AdminPage() {
  const [settings, setSettings] = useState<{ gymName: string; welcomeMessage: string } | null>(null)
  const [plans, setPlans] = useState<any[]>([])
  const [coaches, setCoaches] = useState<any[]>([])
  const [machines, setMachines] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/settings').then(r => r.json()),
      fetch('/api/plans').then(r => r.json()),
      fetch('/api/coaches').then(r => r.json()),
      fetch('/api/machines').then(r => r.json()),
      fetch('/api/users').then(r => r.json()),
    ]).then(([s, p, c, m, u]) => {
      setSettings(s); setPlans(p); setCoaches(c); setMachines(m); setUsers(u)
    })
  }, [])

  const customers = useMemo(() => users.filter((u: any) => u.role === 'CLIENTE'), [users])
  const employees = useMemo(() => users.filter((u: any) => u.role !== 'CLIENTE'), [users])

  function onSaveSettings(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    fetch('/api/admin/settings', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gymName: form.get('gymName'), welcomeMessage: form.get('welcomeMessage') })
    }).then(r => r.json()).then(setSettings)
  }

  function createPlan() {
    fetch('/api/plans', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Plan Personalizado', tier: 'NORMAL', pricePerMonth: 39.9, access: ['ENTRENAMIENTO_FISICO'] })
    }).then(r => r.json()).then(p => setPlans(prev => [p, ...prev]))
  }

  function createCoach() {
    fetch('/api/coaches', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Nuevo Coach', specialty: 'YOGA' })
    }).then(r => r.json()).then(c => setCoaches(prev => [c, ...prev]))
  }

  function createMachine() {
    fetch('/api/machines', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Nueva Máquina', quantity: 1 })
    }).then(r => r.json()).then(m => setMachines(prev => [m, ...prev]))
  }

  function createEmployee() {
    fetch('/api/users', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Nuevo Empleado', role: 'EMPLEADO' })
    }).then(r => r.json()).then(u => setUsers(prev => [u, ...prev]))
  }

  function createCustomer() {
    fetch('/api/users', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Nuevo Cliente', role: 'CLIENTE' })
    }).then(r => r.json()).then(u => setUsers(prev => [u, ...prev]))
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-6">Administración</h1>

        <section className="border border-neutral-800 rounded-lg overflow-hidden mb-8">
          <div className="px-4 py-3 bg-neutral-900 border-b border-neutral-800 font-medium">Ajustes</div>
          <div className="p-4">
            <form className="grid gap-4 md:grid-cols-2" onSubmit={onSaveSettings}>
              <label className="grid gap-1">
                <span className="text-sm text-neutral-400">Nombre del gimnasio</span>
                <input name="gymName" defaultValue={settings?.gymName} className="bg-neutral-900 border border-neutral-800 rounded px-3 py-2" />
              </label>
              <label className="grid gap-1 md:col-span-2">
                <span className="text-sm text-neutral-400">Mensaje de bienvenida</span>
                <input name="welcomeMessage" defaultValue={settings?.welcomeMessage} className="bg-neutral-900 border border-neutral-800 rounded px-3 py-2" />
              </label>
              <div>
                <button className="px-4 py-2 bg-emerald-500 text-black rounded font-semibold">Guardar</button>
              </div>
            </form>
          </div>
        </section>

        <div className="grid md:grid-cols-2 gap-8">
          <section className="border border-neutral-800 rounded-lg">
            <div className="px-4 py-3 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between">
              <span className="font-medium">Planes</span>
              <button onClick={createPlan} className="text-sm px-3 py-1.5 rounded bg-neutral-800">Añadir</button>
            </div>
            <ul className="divide-y divide-neutral-800">
              {plans.map(p => (
                <li key={p.id} className="px-4 py-3 text-sm flex items-center justify-between">
                  <span>{p.name} — €{p.pricePerMonth}/mes</span>
                  <span className="text-xs text-neutral-400">{p.tier}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="border border-neutral-800 rounded-lg">
            <div className="px-4 py-3 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between">
              <span className="font-medium">Coaches</span>
              <button onClick={createCoach} className="text-sm px-3 py-1.5 rounded bg-neutral-800">Añadir</button>
            </div>
            <ul className="divide-y divide-neutral-800">
              {coaches.map(c => (
                <li key={c.id} className="px-4 py-3 text-sm flex items-center justify-between">
                  <span>{c.name}</span>
                  <span className="text-xs text-neutral-400">{c.specialty}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="border border-neutral-800 rounded-lg">
            <div className="px-4 py-3 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between">
              <span className="font-medium">Máquinas</span>
              <button onClick={createMachine} className="text-sm px-3 py-1.5 rounded bg-neutral-800">Añadir</button>
            </div>
            <ul className="divide-y divide-neutral-800">
              {machines.map(m => (
                <li key={m.id} className="px-4 py-3 text-sm flex items-center justify-between">
                  <span>{m.name}</span>
                  <span className="text-xs text-neutral-400">{m.quantity} uds</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="border border-neutral-800 rounded-lg">
            <div className="px-4 py-3 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between">
              <span className="font-medium">Usuarios</span>
              <div className="flex gap-2">
                <button onClick={createEmployee} className="text-sm px-3 py-1.5 rounded bg-neutral-800">+ Empleado</button>
                <button onClick={createCustomer} className="text-sm px-3 py-1.5 rounded bg-neutral-800">+ Cliente</button>
              </div>
            </div>
            <ul className="divide-y divide-neutral-800">
              {employees.map(u => (
                <li key={u.id} className="px-4 py-3 text-sm flex items-center justify-between">
                  <span>{u.name}</span>
                  <span className="text-xs text-neutral-400">{u.role}</span>
                </li>
              ))}
              {customers.map(u => (
                <li key={u.id} className="px-4 py-3 text-sm flex items-center justify-between">
                  <span>{u.name}</span>
                  <span className="text-xs text-neutral-400">Cliente</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </AppLayout>
  )
}