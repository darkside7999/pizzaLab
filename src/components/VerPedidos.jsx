import { useEffect, useMemo, useState } from 'react'

const API_BASE = `${window.location.protocol}//${window.location.hostname}:3001`

export default function VerPedidos() {
    const [preparando, setPreparando] = useState([])
    const [listos, setListos] = useState([])
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState(null)

    const cargarPedidos = async () => {
        try {
            setError(null)
            setCargando(true)
            const res = await fetch(`${API_BASE}/pedidos`, {
                headers: { 'Accept': 'application/json' },
            })

            if (!res.ok) throw new Error('Respuesta no válida del servidor')

            const datos = await res.json()
            localStorage.setItem('pedidos_cache', JSON.stringify(datos))

            const normalizarEstado = (estado) => (estado || '').toString().toLowerCase()

            const enPreparacion = datos
                .filter((p) => normalizarEstado(p.estado).includes('prepar'))
                .map((p) => p.numero)
                .filter((n) => Number.isFinite(n))
                .sort((a, b) => a - b)

            const enListos = datos
                .filter((p) => normalizarEstado(p.estado).includes('list'))
                .map((p) => p.numero)
                .filter((n) => Number.isFinite(n))
                .sort((a, b) => a - b)

            setPreparando(enPreparacion)
            setListos(enListos)
        } catch (e) {
            console.error('Error cargando pedidos:', e)
            setError('No se pudo conectar con el servidor. Mostrando datos guardados.')
            const cache = localStorage.getItem('pedidos_cache')
            if (cache) {
                try {
                    const datos = JSON.parse(cache)
                    const normalizarEstado = (estado) => (estado || '').toString().toLowerCase()
                    const enPreparacion = datos
                        .filter((p) => normalizarEstado(p.estado).includes('prepar'))
                        .map((p) => p.numero)
                        .filter((n) => Number.isFinite(n))
                        .sort((a, b) => a - b)
                    const enListos = datos
                        .filter((p) => normalizarEstado(p.estado).includes('list'))
                        .map((p) => p.numero)
                        .filter((n) => Number.isFinite(n))
                        .sort((a, b) => a - b)
                    setPreparando(enPreparacion)
                    setListos(enListos)
                } catch (parseErr) {
                    console.error('SSE parse error', parseErr)
                }
            }
        } finally {
            setCargando(false)
        }
    }

    const marcarComoListo = async (numero) => {
        if (!confirm(`¿Confirmar que el pedido #${numero} está listo?`)) return
        try {
            setCargando(true)
            const res = await fetch(`${API_BASE}/pedidos/${numero}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: 'listo' }),
            })
            if (!res.ok) throw new Error('Error al actualizar pedido')
            await cargarPedidos()
        } catch (e) {
            console.error('Error PATCH /pedidos/:numero', e)
            alert('No se pudo marcar como listo. Intenta de nuevo.')
        } finally {
            setCargando(false)
        }
    }

    const eliminarPedido = async (numero) => {
        if (!confirm(`¿Confirmar que el pedido #${numero} fue entregado?`)) return
        try {
            setCargando(true)
            const res = await fetch(`${API_BASE}/pedidos/${numero}`, {
                method: 'DELETE',
            })
            if (!res.ok && res.status !== 204) throw new Error('Error al eliminar pedido')
            await cargarPedidos()
        } catch (e) {
            console.error('Error DELETE /pedidos/:numero', e)
            alert('No se pudo eliminar el pedido. Intenta de nuevo.')
        } finally {
            setCargando(false)
        }
    }

    useEffect(() => {
        cargarPedidos()
        const id = setInterval(cargarPedidos, 10000)
        // Suscribir SSE para actualizaciones inmediatas
        let es = null
        if (typeof EventSource !== 'undefined') {
            try {
                es = new EventSource(`${API_BASE}/pedidos/stream`)
                es.addEventListener('update', (ev) => {
                    try {
                        const datos = JSON.parse(ev.data)
                        const normalizarEstado = (estado) => (estado || '').toString().toLowerCase()
                        const enPreparacion = datos
                            .filter((p) => normalizarEstado(p.estado).includes('prepar'))
                            .map((p) => p.numero)
                            .filter((n) => Number.isFinite(n))
                            .sort((a, b) => a - b)
                        const enListos = datos
                            .filter((p) => normalizarEstado(p.estado).includes('list'))
                            .map((p) => p.numero)
                            .filter((n) => Number.isFinite(n))
                            .sort((a, b) => a - b)
                        setPreparando(enPreparacion)
                        setListos(enListos)
                } catch (err) {
                        console.error('SSE parse error', err)
                    }
                })
            es.addEventListener('error', () => {
                // Intentar rehidratar desde cache si se pierde la conexión
                const cache = localStorage.getItem('pedidos_cache')
                if (cache) {
                    try {
                        const datos = JSON.parse(cache)
                        const normalizarEstado = (estado) => (estado || '').toString().toLowerCase()
                        const enPreparacion = datos
                            .filter((p) => normalizarEstado(p.estado).includes('prepar'))
                            .map((p) => p.numero)
                            .filter((n) => Number.isFinite(n))
                            .sort((a, b) => a - b)
                        const enListos = datos
                            .filter((p) => normalizarEstado(p.estado).includes('list'))
                            .map((p) => p.numero)
                            .filter((n) => Number.isFinite(n))
                            .sort((a, b) => a - b)
                        setPreparando(enPreparacion)
                        setListos(enListos)
                    } catch (cacheErr) {
                        console.error('Cache parse error', cacheErr)
                    }
                }
            })
            } catch (err) {
                console.error('SSE connection error', err)
            }
        }
        return () => {
            clearInterval(id)
            if (es) es.close()
        }
    }, [])

    const tarjetas = useMemo(() => ({
        contenedor: {
            display: 'flex',
            gap: '2rem',
            marginBottom: '2rem',
            flexWrap: 'wrap',
        },
        card: {
            flex: '1 1 260px',
            background: '#fff',
            padding: '1.25rem 1.5rem',
            borderRadius: '1rem',
            boxShadow: '0 6px 24px rgba(0,0,0,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            minWidth: '240px',
        },
        titulo: { color: '#111827', margin: 0, fontSize: '1rem' },
        sub: { color: '#6b7280', marginTop: '0.25rem', fontSize: '0.9rem' },
        badge: (bg) => ({
            background: bg,
            color: '#fff',
            borderRadius: '0.75rem',
            padding: '0.5rem 0.75rem',
            fontWeight: 'bold',
            minWidth: '3rem',
            textAlign: 'center',
        }),
    }), [])

    const estilos = useMemo(() => {
        const vw = typeof window !== 'undefined' ? window.innerWidth : 1024
        const isTV = vw >= 1600
        const gridMin = isTV ? 120 : 96
        const chipFont = isTV ? '2rem' : '1.625rem'
        const titleFont = isTV ? '5rem' : '4rem'
        return ({
        pagina: {
            padding: '5rem 2rem 3rem',
            width: 'min(1100px, 92vw)',
        },
        titulo: {
            textAlign: 'center',
            fontSize: titleFont,
            fontWeight: 900,
            margin: '0 0 1.5rem',
            color: '#111827',
            letterSpacing: '0.5px',
            fontStyle: 'italic',
        },
        subtitulo: { textAlign: 'center', color: '#6b7280', marginTop: '-1rem', fontStyle: 'italic' },
        secciones: {
            display: 'flex',
            gap: '2rem',
            alignItems: 'stretch',
            flexWrap: 'wrap',
        },
        columna: { flex: '1 1 460px' },
        panel: {
            background: '#fff',
            padding: '1.5rem',
            borderRadius: '1rem',
            boxShadow: '0 6px 24px rgba(0,0,0,0.08)',
            minHeight: '320px',
        },
        h2: { margin: '0 0 1rem', color: '#111827' },
        vacio: { color: '#6b7280', textAlign: 'center', marginTop: '2rem' },
        grid: {
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fill, minmax(${gridMin}px, 1fr))`,
            gap: '1rem',
        },
        chip: (bg) => ({
            background: bg,
            color: '#fff',
            border: 'none',
            borderRadius: '0.85rem',
            padding: '1.25rem 0.5rem',
            fontSize: chipFont,
            fontWeight: '800',
            letterSpacing: '0.5px',
            cursor: 'pointer',
            minWidth: '96px',
            textAlign: 'center',
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
        }),
        toolbar: {
            display: 'flex',
            justifyContent: 'flex-end',
            marginBottom: '0.75rem',
        },
        boton: {
            background: '#111827',
            color: '#fff',
            border: 'none',
            borderRadius: '0.5rem',
            padding: '0.5rem 0.75rem',
            fontWeight: '600',
            cursor: 'pointer',
        },
        aviso: { color: '#b45309', margin: '0.5rem 0 0' },
    })
    }, [])

    return (
        <div style={estilos.pagina}>
            <h1 style={estilos.titulo}>Pizza Lab</h1>
            <div style={estilos.subtitulo}>Pedidos en tiempo real</div>
            <div style={tarjetas.contenedor}>
                <div style={tarjetas.card}>
                    <div>
                        <h3 style={tarjetas.titulo}>En preparación</h3>
                        <div style={tarjetas.sub}>Pedidos actualmente en cocina</div>
                    </div>
                    <div style={tarjetas.badge('#f59e0b')}>{preparando.length}</div>
                </div>
                <div style={tarjetas.card}>
                    <div>
                        <h3 style={tarjetas.titulo}>Listos</h3>
                        <div style={tarjetas.sub}>Pedidos listos para entregar</div>
                    </div>
                    <div style={tarjetas.badge('#10b981')}>{listos.length}</div>
                </div>
            </div>

            <div style={estilos.toolbar}>
                <button onClick={cargarPedidos} style={estilos.boton} disabled={cargando}>
                    {cargando ? 'Actualizando…' : 'Refrescar'}
                </button>
            </div>
            {error && <div style={estilos.aviso}>{error}</div>}

            <div style={estilos.secciones}>
                <section style={estilos.columna}>
                    <h2 style={estilos.h2}>En preparación</h2>
                    <div style={estilos.panel}>
                        {preparando.length === 0 ? (
                            <p style={estilos.vacio}>No hay pedidos en preparación</p>
                        ) : (
                            <div style={estilos.grid}>
                                {preparando.map((n) => (
                                    <button
                                        key={`prep-${n}`}
                                        onClick={() => marcarComoListo(n)}
                                        style={estilos.chip('#f59e0b')}
                                        disabled={cargando}
                                        title="Marcar como listo"
                                    >
                                        #{n}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                <section style={estilos.columna}>
                    <h2 style={estilos.h2}>Listos</h2>
                    <div style={estilos.panel}>
                        {listos.length === 0 ? (
                            <p style={estilos.vacio}>No hay pedidos listos</p>
                        ) : (
                            <div style={estilos.grid}>
                                {listos.map((n) => (
                                    <button
                                        key={`listo-${n}`}
                                        onClick={() => eliminarPedido(n)}
                                        style={estilos.chip('#10b981')}
                                        disabled={cargando}
                                        title="Marcar como entregado (ocultar)"
                                    >
                                        #{n}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    )
}