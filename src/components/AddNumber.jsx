import { useCallback, useEffect, useState } from 'react';

const API_BASE = `${window.location.protocol}//${window.location.hostname}:3001`

export default function AddNumber() {
    const [pedidosPreparando, setPedidosPreparando] = useState([]);
    const [pedidosListos, setPedidosListos] = useState([]);
    const [cargando, setCargando] = useState(false)

    const normalizarEstado = (estado) => (estado || '').toString().toLowerCase()

    const cargarPedidos = useCallback(async () => {
        try {
            setCargando(true)
            const res = await fetch(`${API_BASE}/pedidos`, {
                headers: { 'Accept': 'application/json' },
            })
            if (!res.ok) throw new Error('Respuesta no válida del servidor')
            const datos = await res.json()
            localStorage.setItem('pedidos_cache', JSON.stringify(datos))
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
            setPedidosPreparando(enPreparacion)
            setPedidosListos(enListos)
        } catch (e) {
            console.error('Error cargando pedidos:', e)
            const cache = localStorage.getItem('pedidos_cache')
            if (cache) {
                try {
                    const datos = JSON.parse(cache)
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
                    setPedidosPreparando(enPreparacion)
                    setPedidosListos(enListos)
                } catch (cacheErr) {
                    console.error('Cache parse error', cacheErr)
                }
            }
        } finally {
            setCargando(false)
        }
    }, [])

    useEffect(() => {
        cargarPedidos()
        // Suscribir SSE para reflejar cambios inmediatos
        let es
        if (typeof EventSource !== 'undefined') {
            es = new EventSource(`${API_BASE}/pedidos/stream`)
            es.addEventListener('update', (ev) => {
                try {
                    const datos = JSON.parse(ev.data)
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
                    setPedidosPreparando(enPreparacion)
                    setPedidosListos(enListos)
                    localStorage.setItem('pedidos_cache', JSON.stringify(datos))
                } catch (err) {
                    console.error('SSE parse error', err)
                }
            })
            es.addEventListener('error', () => {
                const cache = localStorage.getItem('pedidos_cache')
                if (!cache) return
                try {
                    const datos = JSON.parse(cache)
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
                    setPedidosPreparando(enPreparacion)
                    setPedidosListos(enListos)
                } catch (cacheErr) {
                    console.error('Cache parse error', cacheErr)
                }
            })
        }
        return () => {
            if (es) es.close()
        }
    }, [cargarPedidos])

    const moverAListos = async (numero) => {
        if (!confirm(`¿Confirmar que el pedido #${numero} está listo?`)) return;
        try {
            setCargando(true)
            const res = await fetch(`${API_BASE}/pedidos/${numero}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: 'listo' })
            })
            if (!res.ok) throw new Error('Error al actualizar')
            await cargarPedidos()
        } catch (e) {
            console.error('Error al marcar como listo:', e)
            alert('No se pudo marcar como listo. Inténtalo de nuevo.')
        } finally {
            setCargando(false)
        }
    };

    const eliminarPedido = async (numero) => {
        if (!confirm(`¿Estás seguro de que quieres eliminar el pedido #${numero}?`)) return;
        try {
            setCargando(true)
            const res = await fetch(`${API_BASE}/pedidos/${numero}`, { method: 'DELETE' })
            if (!(res.ok || res.status === 204)) throw new Error('Error al eliminar')
            await cargarPedidos()
        } catch (e) {
            console.error('Error al eliminar:', e)
            alert('No se pudo eliminar el pedido. Inténtalo de nuevo.')
        } finally {
            setCargando(false)
        }
    };

    return(
        <div style={{ padding: '2rem' }}>
            {/* Formulario para agregar números - ARRIBA */}
            <div style={{ marginBottom: '2rem' }}>
                <h2>Agregar Número de Pedido</h2>
                <form
                    onSubmit={async (e) => {
                        e.preventDefault();
                        const form = e.target;
                        const numero = form.numero.value.trim();

                        if (!numero) {
                            alert("Por favor, ingresa un número de pedido.");
                            return;
                        }

                        // Enviar datos al servidor
                        try {
                            const res = await fetch(`${API_BASE}/pedidos`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    numero: parseInt(numero),
                                    estado: 'preparacion'
                                })
                            });
                            if (res.ok) {
                                alert(`Pedido #${numero} agregado correctamente.`);
                                form.reset();
                                await cargarPedidos();
                            } else {
                                alert("Error al agregar el pedido.");
                            }
                        } catch (error) {
                            console.error("Error al conectar con el servidor:", error);
                            alert("No se pudo conectar con el servidor.");
                        }
                    }}
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "1rem",
                        maxWidth: "400px",
                        background: "#fff",
                        padding: "2rem",
                        borderRadius: "1rem",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
                    }}
                >
                    <label>
                        Número de Pedido*:
                        <input 
                            name="numero" 
                            type="number" 
                            min="1" 
                            required 
                            style={{width: "100%", padding: "0.5rem"}} 
                        />
                    </label>
                    <button type="submit" style={{
                        background: "#4f46e5",
                        color: "#fff",
                        border: "none",
                        borderRadius: "0.5rem",
                        padding: "0.75rem",
                        fontWeight: "bold",
                        cursor: "pointer"
                    }}>
                        Agregar
                    </button>
                </form>
            </div>

            {/* Secciones de Pedidos - ABAJO LADO A LADO */}
            <div style={{ display: 'flex', gap: '2rem' }}>
                {/* Sección de Pedidos en Preparación */}
                <div style={{ flex: 1 }}>
                    <h2>En Preparación</h2>
                    <div style={{
                        background: "#fff",
                        padding: "2rem",
                        borderRadius: "1rem",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                        minHeight: "300px"
                    }}>
                        {pedidosPreparando.length === 0 ? (
                            <p style={{ color: "#666", textAlign: "center" }}>No hay pedidos en preparación</p>
                        ) : (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
                                {pedidosPreparando.map((numero, index) => (
                                    <button
                                        key={index}
                                        onClick={() => moverAListos(numero)}
                                        style={{
                                            background: "#f59e0b",
                                            color: "#fff",
                                            border: "none",
                                            borderRadius: "0.5rem",
                                            padding: "1.5rem",
                                            fontSize: "1.5rem",
                                            fontWeight: "bold",
                                            cursor: "pointer",
                                            minWidth: "100px"
                                        }}
                                        disabled={cargando}
                                        title="Marcar como listo"
                                    >
                                        #{numero}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sección de Pedidos Listos */}
                <div style={{ flex: 1 }}>
                    <h2>Listos</h2>
                    <div style={{
                        background: "#fff",
                        padding: "2rem",
                        borderRadius: "1rem",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                        minHeight: "300px"
                    }}>
                        {pedidosListos.length === 0 ? (
                            <p style={{ color: "#666", textAlign: "center" }}>No hay pedidos listos</p>
                        ) : (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
                                {pedidosListos.map((numero, index) => (
                                    <button
                                        key={index}
                                        onClick={() => eliminarPedido(numero)}
                                        style={{
                                            background: "#10b981",
                                            color: "#fff",
                                            border: "none",
                                            borderRadius: "0.5rem",
                                            padding: "1.5rem",
                                            fontSize: "1.5rem",
                                            fontWeight: "bold",
                                            cursor: "pointer",
                                            minWidth: "100px"
                                        }}
                                        disabled={cargando}
                                        title="Marcar como entregado (ocultar)"
                                    >
                                        #{numero}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}