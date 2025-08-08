import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DATA_DIR = path.join(__dirname)
const DATA_FILE = path.join(DATA_DIR, 'pedidos.json')

export async function ensureStorageReady() {
  try {
    await fs.access(DATA_FILE)
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2), 'utf8')
  }
}

export async function loadPedidos() {
  await ensureStorageReady()
  const raw = await fs.readFile(DATA_FILE, 'utf8')
  try {
    const data = JSON.parse(raw)
    if (!Array.isArray(data)) return []
    return data
  } catch {
    return []
  }
}

export async function savePedidos(pedidos) {
  await fs.writeFile(DATA_FILE, JSON.stringify(pedidos ?? [], null, 2), 'utf8')
}

// Suscripción simple para notificar cambios a los clientes (SSE)
const subscribers = new Set()

export function subscribePedidos(subscriber) {
  subscribers.add(subscriber)
  return () => subscribers.delete(subscriber)
}

function notifySubscribers(pedidos) {
  for (const sub of subscribers) {
    try { sub(pedidos) } catch {}
  }
}

// Envolver savePedidos para notificar
const _savePedidos = savePedidos
export async function savePedidosAndNotify(pedidos) {
  await _savePedidos(pedidos)
  notifySubscribers(pedidos)
}


