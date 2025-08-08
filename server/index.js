import express from 'express'
import cors from 'cors'
import os from 'os'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  ensureStorageReady,
  loadPedidos,
  savePedidosAndNotify,
  subscribePedidos,
} from './storage.js'

const app = express()
const PORT = process.env.PORT || 3001
const HOST = process.env.HOST || '0.0.0.0'

app.use(cors())
app.use(express.json())
// Servir estáticos de la app vanilla
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const STATIC_DIR = path.join(__dirname, '..', 'vanilla')
app.use('/', express.static(STATIC_DIR, { extensions: ['html'] }))

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

app.get('/pedidos', async (_req, res) => {
  const pedidos = await loadPedidos()
  res.json(pedidos)
})

app.get('/pedidos/stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  // Para CORS en SSE
  res.setHeader('Access-Control-Allow-Origin', '*')

  const enviar = (pedidos) => {
    res.write(`event: update\n`)
    res.write(`data: ${JSON.stringify(pedidos)}\n\n`)
  }

  // Enviar estado inicial
  try {
    const actuales = await loadPedidos()
    enviar(actuales)
  } catch {}

  // Suscribir a cambios
  const unsubscribe = subscribePedidos(enviar)

  // Heartbeat para mantener viva la conexión
  const heartbeat = setInterval(() => {
    res.write(`event: ping\n`)
    res.write(`data: 1\n\n`)
  }, 25000)

  req.on('close', () => {
    clearInterval(heartbeat)
    unsubscribe()
  })
})

app.post('/pedidos', async (req, res) => {
  const { numero, estado = 'nuevo' } = req.body || {}
  const num = Number(numero)
  if (!Number.isFinite(num) || num <= 0) {
    return res.status(400).json({ error: 'Número inválido' })
  }

  const pedidos = await loadPedidos()
  if (pedidos.some((p) => p.numero === num)) {
    return res.status(409).json({ error: 'El pedido ya existe' })
  }
  const nuevo = { numero: num, estado }
  pedidos.push(nuevo)
  await savePedidosAndNotify(pedidos)
  res.status(201).json(nuevo)
})

app.patch('/pedidos/:numero', async (req, res) => {
  const num = Number(req.params.numero)
  const { estado } = req.body || {}
  if (!Number.isFinite(num)) {
    return res.status(400).json({ error: 'Número inválido' })
  }
  if (!estado || typeof estado !== 'string') {
    return res.status(400).json({ error: 'Estado inválido' })
  }

  const pedidos = await loadPedidos()
  const idx = pedidos.findIndex((p) => p.numero === num)
  if (idx === -1) {
    return res.status(404).json({ error: 'Pedido no encontrado' })
  }
  pedidos[idx] = { ...pedidos[idx], estado }
  await savePedidosAndNotify(pedidos)
  res.json(pedidos[idx])
})

app.delete('/pedidos/:numero', async (req, res) => {
  const num = Number(req.params.numero)
  if (!Number.isFinite(num)) {
    return res.status(400).json({ error: 'Número inválido' })
  }
  const pedidos = await loadPedidos()
  const next = pedidos.filter((p) => p.numero !== num)
  if (next.length === pedidos.length) {
    return res.status(404).json({ error: 'Pedido no encontrado' })
  }
  await savePedidosAndNotify(next)
  res.status(204).end()
})

await ensureStorageReady()

function obtenerIPsLocales() {
  const nets = os.networkInterfaces()
  const results = []
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) results.push(net.address)
    }
  }
  return results
}

app.listen(PORT, HOST, () => {
  const ips = obtenerIPsLocales()
  const urls = ips.map((ip) => `http://${ip}:${PORT}`).join(', ')
  console.log(`Servidor escuchando en: ${urls || `http://${HOST}:${PORT}`}`)
})


