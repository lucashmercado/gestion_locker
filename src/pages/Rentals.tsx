import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, X, Lock, RefreshCw, StopCircle, AlertTriangle } from 'lucide-react'
import { useAlquilerStore } from '@/store/rentalStore'
import { useLockerStore } from '@/store/lockerStore'
import { useClienteStore } from '@/store/clienteStore'
import { useAuthStore } from '@/store/authStore'
import { useConfirm } from '@/components/ConfirmDialog'
import { toastSuccess, toastError } from '@/lib/toast'
import {
  formatMoneda, formatFechaCorta, venceProximamente, estaVencido,
  labelEstadoAlquiler, badgeEstadoAlquiler, labelTipoAlquiler, labelMetodoPago,
} from '@/lib/utils'
import type { Alquiler, TipoAlquiler, MetodoPago } from '@/types'
import { format, addDays, addWeeks, addMonths } from 'date-fns'

// ─── MODAL: Nuevo alquiler ───────────────────────────────────
function NuevoAlquilerModal({
  onClose, gymId,
}: { onClose: () => void; gymId: string }) {
  const { crearAlquiler } = useAlquilerStore()
  const { lockers, fetchLockers } = useLockerStore()
  const { clientes, fetchClientes, addCliente } = useClienteStore()

  const today = format(new Date(), 'yyyy-MM-dd')

  const [step, setStep] = useState<'locker' | 'cliente' | 'pago'>('locker')
  const [lockerId, setLockerId] = useState('')
  const [clienteId, setClienteId] = useState('')
  const [nuevoCliente, setNuevoCliente] = useState({ nombre: '', telefono: '', email: '' })
  const [esNuevoCliente, setEsNuevoCliente] = useState(false)
  const [tipo, setTipo] = useState<TipoAlquiler>('mes')
  const [fechaInicio, setFechaInicio] = useState(today)
  const [monto, setMonto] = useState(6000)
  const [metodo, setMetodo] = useState<MetodoPago>('efectivo')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    fetchLockers(gymId)
    fetchClientes(gymId)
  }, [gymId])

  const calcFechaVencimiento = () => {
    const inicio = new Date(fechaInicio)
    if (tipo === 'dia')    return format(addDays(inicio, 1), 'yyyy-MM-dd')
    if (tipo === 'semana') return format(addWeeks(inicio, 1), 'yyyy-MM-dd')
    return format(addMonths(inicio, 1), 'yyyy-MM-dd')
  }

  const lockersLibres = lockers.filter((l) => l.estado === 'libre')
  const clienteSeleccionado = clientes.find((c) => c.id === clienteId)

  const handleSubmit = async () => {
    setErr('')
    setSaving(true)
    try {
      let finalClienteId = clienteId

      // Crear cliente nuevo si corresponde
      if (esNuevoCliente) {
        if (!nuevoCliente.nombre.trim()) throw new Error('El nombre del cliente es requerido')
        const { data, error } = await addCliente({ gym_id: gymId, ...nuevoCliente })
        if (error) throw new Error(error.message)
        finalClienteId = data!.id
      }

      if (!lockerId) throw new Error('Seleccioná un locker')
      if (!finalClienteId) throw new Error('Seleccioná o creá un cliente')

      const { error } = await crearAlquiler({
        gym_id: gymId,
        cliente_id: finalClienteId,
        locker_id: lockerId,
        fecha_inicio: fechaInicio,
        fecha_vencimiento: calcFechaVencimiento(),
        tipo_alquiler: tipo,
        monto_pagado: monto,
        metodo_pago: metodo,
      })

      if (error) throw new Error(error.message)
      onClose()
    } catch (e: any) {
      setErr(e.message)
    }
    setSaving(false)
  }

  const inputClass = "input-field"

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)' }} onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="glass rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
        style={{ border: '1px solid rgba(59,130,246,0.3)' }}>

        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">Nuevo alquiler</h2>
          <button onClick={onClose} style={{ color: 'var(--color-text-muted)' }}><X size={20} /></button>
        </div>

        {err && (
          <div className="mb-4 p-3 rounded-lg flex items-center gap-2 text-sm"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>
            <AlertTriangle size={14} /> {err}
          </div>
        )}

        <div className="space-y-5">
          {/* LOCKER */}
          <div className="p-4 rounded-xl space-y-3"
            style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <p className="text-xs font-bold tracking-widest" style={{ color: '#60a5fa' }}>LOCKER</p>
            {lockersLibres.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                No hay lockers libres disponibles.
              </p>
            ) : (
              <div className="grid grid-cols-6 gap-2">
                {lockersLibres.map((l) => (
                  <button key={l.id} onClick={() => setLockerId(l.id)}
                    className="aspect-square rounded-lg text-xs font-bold transition-all"
                    style={{
                      background: lockerId === l.id ? '#10b981' : 'rgba(16,185,129,0.15)',
                      border: `1px solid ${lockerId === l.id ? '#10b981' : 'rgba(16,185,129,0.4)'}`,
                      color: lockerId === l.id ? 'white' : '#10b981',
                    }}>
                    {l.numero}
                  </button>
                ))}
              </div>
            )}
            {lockerId && (
              <p className="text-xs" style={{ color: '#10b981' }}>
                ✓ Locker #{lockers.find((l) => l.id === lockerId)?.numero} seleccionado
              </p>
            )}
          </div>

          {/* CLIENTE */}
          <div className="p-4 rounded-xl space-y-3"
            style={{ background: 'rgba(30,41,59,0.4)', border: '1px solid var(--color-border)' }}>
            <p className="text-xs font-bold tracking-widest" style={{ color: 'var(--color-text-secondary)' }}>CLIENTE</p>

            <div className="flex gap-2">
              <button onClick={() => setEsNuevoCliente(false)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${!esNuevoCliente ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40' : 'text-[var(--color-text-muted)] border border-[var(--color-border)]'}`}>
                Cliente existente
              </button>
              <button onClick={() => setEsNuevoCliente(true)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${esNuevoCliente ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40' : 'text-[var(--color-text-muted)] border border-[var(--color-border)]'}`}>
                Nuevo cliente
              </button>
            </div>

            {esNuevoCliente ? (
              <div className="space-y-2">
                <input className={inputClass} placeholder="Nombre completo *" value={nuevoCliente.nombre}
                  onChange={(e) => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })} />
                <input className={inputClass} placeholder="Teléfono" value={nuevoCliente.telefono}
                  onChange={(e) => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })} />
                <input className={inputClass} placeholder="Email" type="email" value={nuevoCliente.email}
                  onChange={(e) => setNuevoCliente({ ...nuevoCliente, email: e.target.value })} />
              </div>
            ) : (
              <select className={inputClass} value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
                <option value="">— Seleccioná un cliente —</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre} {c.telefono ? `(${c.telefono})` : ''}</option>
                ))}
              </select>
            )}
          </div>

          {/* PERIODO Y PAGO */}
          <div className="p-4 rounded-xl space-y-3"
            style={{ background: 'rgba(30,41,59,0.4)', border: '1px solid var(--color-border)' }}>
            <p className="text-xs font-bold tracking-widest" style={{ color: 'var(--color-text-secondary)' }}>PERÍODO Y PAGO</p>

            <div className="flex gap-2">
              {(['dia','semana','mes'] as TipoAlquiler[]).map((t) => (
                <button key={t} onClick={() => setTipo(t)}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all capitalize ${tipo === t ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40' : 'text-[var(--color-text-muted)] border border-[var(--color-border)]'}`}>
                  {labelTipoAlquiler(t)}
                </button>
              ))}
            </div>

            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Fecha de inicio</label>
              <input type="date" className={inputClass} value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
            </div>

            <div className="p-2 rounded-lg text-xs" style={{ background: 'rgba(59,130,246,0.08)', color: '#60a5fa' }}>
              Vencimiento calculado: <strong>{format(new Date(calcFechaVencimiento()), 'dd/MM/yyyy')}</strong>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Monto pagado ($)</label>
                <input type="number" min={0} className={inputClass} value={monto}
                  onChange={(e) => setMonto(Number(e.target.value))} />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Método de pago</label>
                <select className={inputClass} value={metodo} onChange={(e) => setMetodo(e.target.value as MetodoPago)}>
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
          <button onClick={handleSubmit} disabled={saving} className="btn-primary flex-1">
            {saving ? 'Creando…' : '✓ Crear alquiler'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── MODAL: Renovar alquiler ─────────────────────────────────
function RenovarModal({
  alquiler, onClose, gymId,
}: { alquiler: Alquiler; onClose: () => void; gymId: string }) {
  const { renovarAlquiler } = useAlquilerStore()
  const [tipo, setTipo] = useState<TipoAlquiler>(alquiler.tipo_alquiler)
  const [monto, setMonto] = useState(alquiler.monto_pagado)
  const [metodo, setMetodo] = useState<MetodoPago>(alquiler.metodo_pago)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const calcNuevaFecha = () => {
    const desde = new Date(alquiler.fecha_vencimiento)
    if (tipo === 'dia')    return format(addDays(desde, 1), 'yyyy-MM-dd')
    if (tipo === 'semana') return format(addWeeks(desde, 1), 'yyyy-MM-dd')
    return format(addMonths(desde, 1), 'yyyy-MM-dd')
  }

  const handleRenovar = async () => {
    setSaving(true)
    setErr('')
    const { error } = await renovarAlquiler({
      alquiler_id: alquiler.id,
      nueva_vencimiento: calcNuevaFecha(),
      monto_pagado: monto,
      metodo_pago: metodo,
    })
    setSaving(false)
    if (error) setErr(error.message)
    else onClose()
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)' }} onClick={onClose}>
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
        onClick={(e) => e.stopPropagation()}
        className="glass rounded-2xl p-6 w-full max-w-sm"
        style={{ border: '1px solid rgba(59,130,246,0.3)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Renovar alquiler</h2>
          <button onClick={onClose} style={{ color: 'var(--color-text-muted)' }}><X size={20} /></button>
        </div>

        <div className="p-3 rounded-xl mb-4 text-xs space-y-1"
          style={{ background: 'rgba(30,41,59,0.5)', border: '1px solid var(--color-border)' }}>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Locker <strong className="text-white">#{alquiler.locker?.numero || alquiler.locker_numero}</strong>
            {' '}· Cliente: <strong className="text-white">{alquiler.cliente?.nombre || alquiler.cliente_nombre}</strong>
          </p>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Vence actualmente: {formatFechaCorta(alquiler.fecha_vencimiento)}
          </p>
        </div>

        {err && <div className="mb-3 p-2 rounded text-sm" style={{ background:'rgba(239,68,68,0.1)',color:'#ef4444'}}>{err}</div>}

        <div className="space-y-3">
          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Extender por</label>
            <div className="flex gap-2">
              {(['dia','semana','mes'] as TipoAlquiler[]).map((t) => (
                <button key={t} onClick={() => setTipo(t)}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${tipo === t ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40' : 'text-[var(--color-text-muted)] border border-[var(--color-border)]'}`}>
                  {labelTipoAlquiler(t)}
                </button>
              ))}
            </div>
          </div>
          <div className="text-xs p-2 rounded" style={{ background: 'rgba(59,130,246,0.08)', color: '#60a5fa' }}>
            Nueva fecha de vencimiento: <strong>{format(new Date(calcNuevaFecha()), 'dd/MM/yyyy')}</strong>
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Monto cobrado ($)</label>
            <input type="number" min={0} className="input-field" value={monto}
              onChange={(e) => setMonto(Number(e.target.value))} />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Método de pago</label>
            <select className="input-field" value={metodo} onChange={(e) => setMetodo(e.target.value as MetodoPago)}>
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="otro">Otro</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
          <button onClick={handleRenovar} disabled={saving} className="btn-primary flex-1">
            <RefreshCw size={15} /> {saving ? 'Renovando…' : 'Renovar'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── PÁGINA PRINCIPAL ────────────────────────────────────────
export default function Rentals() {
  const { gym } = useAuthStore()
  const { alquileres, fetchAlquileres, finalizarAlquiler } = useAlquilerStore()
  const [search, setSearch]   = useState('')
  const [filtro, setFiltro]   = useState<'todos' | 'activo' | 'vencido' | 'finalizado'>('todos')
  const [showNew, setShowNew] = useState(false)
  const [renovando, setRenovando] = useState<Alquiler | null>(null)
  const { confirm } = useConfirm()

  useEffect(() => { if (gym?.id) fetchAlquileres(gym.id) }, [gym?.id])

  const displayed = alquileres.filter((a: any) => {
    const nombre = a.cliente?.nombre || a.cliente_nombre || a.clienteNombre || ''
    const num = a.locker?.numero || a.locker_numero || a.lockerNumero || ''
    const matchSearch = nombre.toLowerCase().includes(search.toLowerCase()) || num.includes(search)
    const matchFiltro = filtro === 'todos' || a.estado === filtro
    return matchSearch && matchFiltro
  })

  const handleFinalizar = async (id: string) => {
    const ok = await confirm({
      title: 'Finalizar alquiler',
      description: 'El locker quedará libre y el alquiler se marcará como finalizado.',
      confirmText: 'Finalizar',
      danger: false,
    })
    if (!ok) return
    const { error } = await finalizarAlquiler(id)
    if (error) toastError(error.message)
    else toastSuccess('Alquiler finalizado. El locker quedó libre.')
  }

  const rowBg = (a: any) => {
    const venc = a.fecha_vencimiento || a.fechaVencimiento
    if (a.estado === 'vencido') return 'rgba(239,68,68,0.04)'
    if (a.estado === 'activo' && venceProximamente(venc)) return 'rgba(245,158,11,0.04)'
    return ''
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Alquileres</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{displayed.length} registros</p>
        </div>
        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
          className="btn-primary" onClick={() => setShowNew(true)}>
          <Plus size={16} /> Nuevo alquiler
        </motion.button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
          <input className="input-field pl-9" placeholder="Buscar por cliente o locker…"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {(['todos','activo','vencido','finalizado'] as const).map((f) => (
            <button key={f} onClick={() => setFiltro(f)}
              className="px-3 py-2 rounded-lg text-xs font-semibold transition-all capitalize"
              style={{
                background: filtro === f ? 'rgba(59,130,246,0.2)' : 'rgba(30,41,59,0.5)',
                border: `1px solid ${filtro === f ? 'rgba(59,130,246,0.5)' : 'var(--color-border)'}`,
                color: filtro === f ? '#60a5fa' : 'var(--color-text-secondary)',
              }}>
              {f === 'todos' ? 'Todos' : f === 'activo' ? 'Activos' : f === 'vencido' ? 'Vencidos' : 'Finalizados'}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'rgba(30,41,59,0.5)' }}>
                {['Locker','Cliente','Período','Tipo','Monto','Método','Estado','Acciones'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide"
                    style={{ color: 'var(--color-text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {displayed.map((a: any, i: number) => {
                  const venc = a.fecha_vencimiento || a.fechaVencimiento
                  const inicio = a.fecha_inicio || a.fechaInicio
                  return (
                    <motion.tr key={a.id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.02 }}
                      style={{ borderBottom: '1px solid var(--color-border)', background: rowBg(a) }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(59,130,246,0.05)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = rowBg(a))}>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                            <Lock size={12} style={{ color: '#60a5fa' }} />
                          </div>
                          <span className="font-bold text-white">#{a.locker?.numero || a.locker_numero || a.lockerNumero}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <p className="font-medium text-white truncate max-w-[140px]">
                          {a.cliente?.nombre || a.cliente_nombre || a.clienteNombre}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          {a.cliente?.telefono || a.cliente_telefono || a.telefono || ''}
                        </p>
                      </td>

                      <td className="px-4 py-3">
                        <p className="text-white text-xs">{formatFechaCorta(inicio)}</p>
                        <p className="text-xs" style={{ color: estaVencido(venc) ? '#ef4444' : 'var(--color-text-muted)' }}>
                          → {formatFechaCorta(venc)}
                        </p>
                      </td>

                      <td className="px-4 py-3">
                        <span className="badge badge-blue">{labelTipoAlquiler(a.tipo_alquiler || a.tipo || 'mes')}</span>
                      </td>

                      <td className="px-4 py-3 font-semibold" style={{ color: '#60a5fa' }}>
                        {formatMoneda(a.monto_pagado || a.monto || 0)}
                      </td>

                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        {labelMetodoPago(a.metodo_pago || a.metodo || 'efectivo')}
                      </td>

                      <td className="px-4 py-3">
                        <span className={`badge ${badgeEstadoAlquiler(a.estado)}`}>
                          {a.estado === 'activo' && venceProximamente(venc) ? '⚠ Por vencer' : labelEstadoAlquiler(a.estado)}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {a.estado !== 'finalizado' && (
                            <button onClick={() => setRenovando(a)}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all"
                              style={{ background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.3)', color:'#60a5fa' }}>
                              <RefreshCw size={12} /> Renovar
                            </button>
                          )}
                          {a.estado === 'activo' && (
                            <button onClick={() => handleFinalizar(a.id)}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all"
                              style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', color:'#ef4444' }}>
                              <StopCircle size={12} /> Finalizar
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  )
                })}
              </AnimatePresence>
            </tbody>
          </table>
          {alquileres.length === 0 && !search && filtro === 'todos' ? (
            <tr>
              <td colSpan={8}>
                <div className="py-16 text-center">
                  <div className="text-4xl mb-3">📋</div>
                  <p className="text-white font-semibold mb-1">Sin alquileres aún</p>
                  <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>Creá tu primer alquiler asignando un locker a un cliente</p>
                  <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                    className="btn-primary gap-2 mx-auto" onClick={() => setShowNew(true)}>
                    <Plus size={16} /> Crear primer alquiler
                  </motion.button>
                </div>
              </td>
            </tr>
          ) : displayed.length === 0 ? (
            <tr>
              <td colSpan={8}>
                <div className="py-16 text-center" style={{ color: 'var(--color-text-muted)' }}>
                  No se encontraron alquileres
                </div>
              </td>
            </tr>
          ) : null}
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showNew && <NuevoAlquilerModal onClose={() => setShowNew(false)} gymId={gym?.id || 'demo'} />}
        {renovando && <RenovarModal alquiler={renovando} onClose={() => setRenovando(null)} gymId={gym?.id || 'demo'} />}
      </AnimatePresence>
    </div>
  )
}


