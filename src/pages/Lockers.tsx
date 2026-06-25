import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, Lock, Edit, Trash2, X, RefreshCw, User,
  Calendar, DollarSign, Clock, CheckCircle,
} from 'lucide-react'
import { useLockerStore } from '@/store/lockerStore'
import { useAlquilerStore } from '@/store/rentalStore'
import { useAuthStore } from '@/store/authStore'
import { useConfirm } from '@/components/ConfirmDialog'
import { toastSuccess, toastError } from '@/lib/toast'
import { formatMoneda, formatFechaCorta, venceProximamente, estaVencido, labelTipoAlquiler, labelMetodoPago, diasRestantes } from '@/lib/utils'
import type { Locker, EstadoLocker, TipoAlquiler, MetodoPago } from '@/types'
import { format, addDays, addWeeks, addMonths } from 'date-fns'

// ─── Colores del semáforo ─────────────────────────────────────
type ColorLocker = 'verde' | 'rojo' | 'amarillo' | 'gris'

function getColorLocker(
  locker: Locker,
  alquilerActivo?: { fecha_vencimiento: string }
): ColorLocker {
  if (locker.estado === 'libre') return 'verde'
  if (locker.estado === 'mantenimiento') return 'gris'
  if (locker.estado === 'vencido') return 'rojo'
  // ocupado — verificar si vence pronto
  if (alquilerActivo && venceProximamente(alquilerActivo.fecha_vencimiento)) return 'amarillo'
  return 'rojo'
}

const COLOR_MAP: Record<ColorLocker, { bg: string; border: string; text: string; label: string }> = {
  verde:   { bg: 'rgba(16,185,129,0.2)',  border: '#10b981', text: '#10b981', label: 'Libre'              },
  rojo:    { bg: 'rgba(239,68,68,0.2)',   border: '#ef4444', text: '#ef4444', label: 'Ocupado'            },
  amarillo:{ bg: 'rgba(245,158,11,0.25)', border: '#f59e0b', text: '#f59e0b', label: 'Próximo a vencer'   },
  gris:    { bg: 'rgba(71,85,105,0.2)',   border: '#475569', text: '#64748b', label: 'Mantenimiento'      },
}

// ─── Modal: Agregar/editar locker ────────────────────────────
function LockerModal({
  locker, onClose, onSave, gymId,
}: { locker: Partial<Locker> | null; onClose: () => void; onSave: (d: any) => Promise<void>; gymId: string }) {
  const [form, setForm] = useState({ numero: String(locker?.numero || ''), estado: locker?.estado || 'libre' as EstadoLocker, observaciones: locker?.observaciones || '' })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.numero.trim()) { setErr('El número es requerido'); return }
    setSaving(true)
    try {
      // numero se guarda como integer en la DB
      await onSave({ ...form, numero: isNaN(Number(form.numero)) ? form.numero : Number(form.numero), gym_id: gymId })
      onClose()
    }
    catch (e: any) { setErr(e.message) }
    setSaving(false)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)' }} onClick={onClose}>
      <motion.div initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 16 }}
        onClick={(e) => e.stopPropagation()}
        className="glass rounded-2xl p-6 w-full max-w-sm"
        style={{ border: '1px solid rgba(59,130,246,0.3)' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">{locker?.id ? 'Editar locker' : 'Agregar locker'}</h2>
          <button onClick={onClose} style={{ color: 'var(--color-text-muted)' }}><X size={20} /></button>
        </div>
        {err && <div className="mb-3 p-2.5 rounded-lg text-sm" style={{ background:'rgba(239,68,68,0.1)',color:'#ef4444' }}>{err}</div>}
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Número del locker</label>
            <input className="input-field text-lg font-bold" placeholder="Ej: 01, A-5, VIP" value={form.numero}
              onChange={(e) => setForm({ ...form, numero: e.target.value })} required />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Estado inicial</label>
            <select className="input-field" value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value as EstadoLocker })}>
              <option value="libre">🟢 Libre</option>
              <option value="ocupado">🔴 Ocupado</option>
              <option value="mantenimiento">⚙️ Mantenimiento</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Observaciones (opcional)</label>
            <textarea className="input-field resize-none" rows={2} placeholder="Notas del locker..."
              value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Guardando…' : 'Guardar'}</button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

// ─── Panel de detalle del locker ─────────────────────────────
function DetailPanel({
  locker, alquiler, color, onEdit, onDelete, onRenovar, onClose,
}: {
  locker: Locker
  alquiler?: any
  color: ColorLocker
  onEdit: () => void
  onDelete: () => void
  onRenovar: () => void
  onClose: () => void
}) {
  const c = COLOR_MAP[color]
  const venc = alquiler?.fecha_vencimiento || alquiler?.fechaVencimiento
  const dias = venc ? diasRestantes(venc) : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="card relative"
      style={{ border: `1px solid ${c.border}40` }}
    >
      <button onClick={onClose} className="absolute top-4 right-4" style={{ color: 'var(--color-text-muted)' }}>
        <X size={18} />
      </button>

      {/* Header */}
      <div className="flex items-center gap-4 mb-5">
        <div className="w-16 h-16 rounded-2xl flex flex-col items-center justify-center"
          style={{ background: c.bg, border: `2px solid ${c.border}` }}>
          <Lock size={22} style={{ color: c.text }} />
          <span className="text-xs font-extrabold mt-0.5" style={{ color: c.text }}>{locker.numero}</span>
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-white">Locker #{locker.numero}</h2>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mt-1"
            style={{ background: c.bg, border: `1px solid ${c.border}40`, color: c.text }}>
            <span className="w-2 h-2 rounded-full" style={{ background: c.border }} />
            {c.label}
          </span>
        </div>
      </div>

      {/* Info del alquiler */}
      {alquiler ? (
        <div className="space-y-4">
          {/* Datos del cliente */}
          <div className="p-4 rounded-xl space-y-3"
            style={{ background: 'rgba(30,41,59,0.5)', border: '1px solid var(--color-border)' }}>
            <div className="flex items-center gap-2 mb-2">
              <User size={15} style={{ color: '#60a5fa' }} />
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#60a5fa' }}>Cliente</span>
            </div>
            <p className="text-lg font-bold text-white">
              {alquiler.cliente?.nombre || alquiler.cliente_nombre || alquiler.clienteNombre || '—'}
            </p>
            {(alquiler.cliente?.telefono || alquiler.cliente_telefono) && (
              <a href={`tel:${alquiler.cliente?.telefono || alquiler.cliente_telefono}`}
                className="text-sm flex items-center gap-1.5 hover:text-blue-300 transition-colors"
                style={{ color: 'var(--color-text-secondary)' }}>
                📞 {alquiler.cliente?.telefono || alquiler.cliente_telefono}
              </a>
            )}
          </div>

          {/* Fechas y monto */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl text-center"
              style={{ background: 'rgba(30,41,59,0.5)', border: '1px solid var(--color-border)' }}>
              <Calendar size={14} className="mx-auto mb-1" style={{ color: '#60a5fa' }} />
              <p className="text-xs mb-0.5" style={{ color: 'var(--color-text-muted)' }}>Inicio</p>
              <p className="text-xs font-bold text-white">
                {formatFechaCorta(alquiler.fecha_inicio || alquiler.fechaInicio)}
              </p>
            </div>
            <div className="p-3 rounded-xl text-center"
              style={{
                background: color === 'amarillo' ? 'rgba(245,158,11,0.1)' : 'rgba(30,41,59,0.5)',
                border: `1px solid ${color === 'amarillo' ? 'rgba(245,158,11,0.3)' : 'var(--color-border)'}`,
              }}>
              <Clock size={14} className="mx-auto mb-1" style={{ color: color === 'amarillo' ? '#f59e0b' : '#60a5fa' }} />
              <p className="text-xs mb-0.5" style={{ color: 'var(--color-text-muted)' }}>Vence</p>
              <p className="text-xs font-bold" style={{ color: color === 'amarillo' ? '#f59e0b' : 'white' }}>
                {formatFechaCorta(venc)}
              </p>
            </div>
            <div className="p-3 rounded-xl text-center"
              style={{ background: 'rgba(30,41,59,0.5)', border: '1px solid var(--color-border)' }}>
              <DollarSign size={14} className="mx-auto mb-1" style={{ color: '#10b981' }} />
              <p className="text-xs mb-0.5" style={{ color: 'var(--color-text-muted)' }}>Monto</p>
              <p className="text-xs font-bold text-white">
                {formatMoneda(alquiler.monto_pagado || alquiler.monto || 0)}
              </p>
            </div>
          </div>

          {/* Tipo y método */}
          <div className="flex gap-2 flex-wrap">
            <span className="badge badge-blue">{labelTipoAlquiler(alquiler.tipo_alquiler || alquiler.tipo || 'mes')}</span>
            <span className="badge badge-muted">{labelMetodoPago(alquiler.metodo_pago || alquiler.metodo || 'efectivo')}</span>
            {dias !== null && (
              <span className={`badge ${dias <= 0 ? 'badge-danger' : dias <= 7 ? 'badge-warning' : 'badge-success'}`}>
                {dias <= 0 ? `Vencido hace ${Math.abs(dias)}d` : `${dias}d restantes`}
              </span>
            )}
          </div>

          {/* Botón Renovar */}
          {alquiler.estado !== 'finalizado' && (
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(59,130,246,0.3)' }}
              whileTap={{ scale: 0.98 }}
              onClick={onRenovar}
              className="btn-primary w-full py-3 text-base gap-2"
            >
              <RefreshCw size={18} />
              Renovar alquiler
            </motion.button>
          )}
        </div>
      ) : (
        /* Libre */
        <div className="text-center py-6 space-y-4">
          <CheckCircle size={40} className="mx-auto" style={{ color: '#10b981' }} />
          <div>
            <p className="text-lg font-bold text-white">Locker disponible</p>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {locker.observaciones || 'Sin observaciones'}
            </p>
          </div>
          <a href="/app/rentals">
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="btn-primary w-full py-3 gap-2">
              <Plus size={18} /> Crear alquiler
            </motion.button>
          </a>
        </div>
      )}

      {/* Acciones secundarias */}
      <div className="flex gap-2 mt-4 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
        <button onClick={onEdit} className="btn-secondary flex-1 py-2 text-xs gap-1.5">
          <Edit size={13} /> Editar locker
        </button>
        <button onClick={onDelete} className="btn-danger flex-1 py-2 text-xs gap-1.5">
          <Trash2 size={13} /> Eliminar
        </button>
      </div>
    </motion.div>
  )
}

// ─── Modal: Renovar ──────────────────────────────────────────
function RenovarModal({ alquiler, onClose }: { alquiler: any; onClose: () => void }) {
  const { renovarAlquiler } = useAlquilerStore()
  const [tipo, setTipo]   = useState<TipoAlquiler>(alquiler.tipo_alquiler || 'mes')
  const [monto, setMonto] = useState(alquiler.monto_pagado || alquiler.monto || 0)
  const [metodo, setMetodo] = useState<MetodoPago>(alquiler.metodo_pago || 'efectivo')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const calcNuevaFecha = () => {
    const desde = new Date(alquiler.fecha_vencimiento || alquiler.fechaVencimiento)
    if (tipo === 'dia')    return format(addDays(desde, 1), 'yyyy-MM-dd')
    if (tipo === 'semana') return format(addWeeks(desde, 1), 'yyyy-MM-dd')
    return format(addMonths(desde, 1), 'yyyy-MM-dd')
  }

  const handleRenovar = async () => {
    setSaving(true); setErr('')
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
      style={{ background: 'rgba(0,0,0,0.85)' }} onClick={onClose}>
      <motion.div initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 16 }}
        onClick={(e) => e.stopPropagation()}
        className="glass rounded-2xl p-6 w-full max-w-sm"
        style={{ border: '1px solid rgba(59,130,246,0.4)' }}>

        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <RefreshCw size={20} style={{ color: '#60a5fa' }} /> Renovar alquiler
          </h2>
          <button onClick={onClose} style={{ color: 'var(--color-text-muted)' }}><X size={20} /></button>
        </div>

        {/* Info actual */}
        <div className="p-3 rounded-xl mb-4"
          style={{ background: 'rgba(30,41,59,0.5)', border: '1px solid var(--color-border)' }}>
          <p className="text-sm text-white font-semibold">
            Locker #{alquiler.locker?.numero || alquiler.locker_numero || alquiler.lockerNumero}
          </p>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {alquiler.cliente?.nombre || alquiler.cliente_nombre || alquiler.clienteNombre}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Vence actualmente: {formatFechaCorta(alquiler.fecha_vencimiento || alquiler.fechaVencimiento)}
          </p>
        </div>

        {err && <div className="mb-3 p-2.5 rounded-lg text-sm" style={{ background:'rgba(239,68,68,0.1)',color:'#ef4444' }}>{err}</div>}

        <div className="space-y-4">
          {/* Tipo */}
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--color-text-secondary)' }}>Extender por</label>
            <div className="grid grid-cols-3 gap-2">
              {(['dia','semana','mes'] as TipoAlquiler[]).map((t) => (
                <button key={t} onClick={() => setTipo(t)}
                  className="py-3 rounded-xl text-sm font-bold transition-all"
                  style={{
                    background: tipo === t ? 'rgba(59,130,246,0.25)' : 'rgba(30,41,59,0.5)',
                    border: `1px solid ${tipo === t ? '#3b82f6' : 'var(--color-border)'}`,
                    color: tipo === t ? '#60a5fa' : 'var(--color-text-secondary)',
                  }}>
                  {t === 'dia' ? '1 Día' : t === 'semana' ? '1 Semana' : '1 Mes'}
                </button>
              ))}
            </div>
          </div>

          {/* Nueva fecha */}
          <div className="p-3 rounded-xl flex items-center justify-between"
            style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Nueva fecha de vencimiento</span>
            <span className="text-sm font-bold" style={{ color: '#60a5fa' }}>
              {format(new Date(calcNuevaFecha()), 'dd/MM/yyyy')}
            </span>
          </div>

          {/* Monto */}
          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--color-text-secondary)' }}>Monto a cobrar ($)</label>
            <input type="number" min={0} className="input-field text-lg font-bold" value={monto}
              onChange={(e) => setMonto(Number(e.target.value))} />
          </div>

          {/* Método */}
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--color-text-secondary)' }}>Método de pago</label>
            <div className="grid grid-cols-2 gap-2">
              {(['efectivo','transferencia','tarjeta','otro'] as MetodoPago[]).map((m) => (
                <button key={m} onClick={() => setMetodo(m)}
                  className="py-2.5 rounded-xl text-sm font-semibold transition-all capitalize"
                  style={{
                    background: metodo === m ? 'rgba(16,185,129,0.2)' : 'rgba(30,41,59,0.5)',
                    border: `1px solid ${metodo === m ? '#10b981' : 'var(--color-border)'}`,
                    color: metodo === m ? '#10b981' : 'var(--color-text-secondary)',
                  }}>
                  {m === 'efectivo' ? '💵 Efectivo' : m === 'transferencia' ? '🏦 Transferencia' : m === 'tarjeta' ? '💳 Tarjeta' : '📦 Otro'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={handleRenovar} disabled={saving}
          className="btn-primary w-full py-4 text-base mt-5 gap-2">
          <RefreshCw size={18} />
          {saving ? 'Renovando…' : `Renovar por $${monto.toLocaleString('es-AR')}`}
        </motion.button>
      </motion.div>
    </motion.div>
  )
}

// ─── PÁGINA PRINCIPAL ────────────────────────────────────────
type FiltroColor = 'todos' | 'verde' | 'rojo' | 'amarillo' | 'gris'

export default function Lockers() {
  const { gym } = useAuthStore()
  const { lockers, fetchLockers, addLocker, updateLocker, deleteLocker } = useLockerStore()
  const { alquileres, fetchAlquileres } = useAlquilerStore()
  const { confirm } = useConfirm()

  const [search,   setSearch]   = useState('')
  const [filtro,   setFiltro]   = useState<FiltroColor>('todos')
  const [selected, setSelected] = useState<Locker | null>(null)
  const [modal,    setModal]    = useState<Partial<Locker> | null | false>(false)
  const [renovando, setRenovando] = useState<any | null>(null)

  useEffect(() => {
    if (gym?.id) {
      fetchLockers(gym.id)
      fetchAlquileres(gym.id)
    }
  }, [gym?.id])

  // Map locker_id → alquiler activo (solo datos reales)
  const alquilerPorLocker = useMemo(() => {
    const map: Record<string, any> = {}
    for (const a of alquileres) {
      const lid = (a as any).locker_id || (a as any).lockerId
      if (lid && (a as any).estado === 'activo') map[lid] = a
    }
    return map
  }, [alquileres])

  // Colores calculados — siempre datos reales
  const withColor = useMemo(() =>
    lockers.map((l) => ({ locker: l, color: getColorLocker(l, alquilerPorLocker[l.id]) })),
    [lockers, alquilerPorLocker]
  )

  const counts = {
    total:    withColor.length,
    verde:    withColor.filter((x) => x.color === 'verde').length,
    rojo:     withColor.filter((x) => x.color === 'rojo').length,
    amarillo: withColor.filter((x) => x.color === 'amarillo').length,
    gris:     withColor.filter((x) => x.color === 'gris').length,
  }

  const displayed = withColor.filter(({ locker, color }) => {
    const matchSearch = String(locker.numero).toLowerCase().includes(search.toLowerCase())
    const matchFiltro = filtro === 'todos' || color === filtro
    return matchSearch && matchFiltro
  })

  const selectedAlquiler = selected ? alquilerPorLocker[selected.id] : null

  const handleSave = async (data: any) => {
    if ((modal as Locker)?.id) {
      const { error } = await updateLocker((modal as Locker).id, data)
      if (error) { toastError(error.message); throw new Error(error.message) }
      else toastSuccess('Locker actualizado')
    } else {
      const { error } = await addLocker(data)
      if (error) { toastError(error.message); throw new Error(error.message) }
      else toastSuccess(`Locker #${data.numero} agregado`)
    }
  }

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Eliminar locker',
      description: '¿Eliminás este locker? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      danger: true,
    })
    if (!ok) return
    const { error } = await deleteLocker(id)
    if (error) toastError(error.message)
    else { toastSuccess('Locker eliminado'); setSelected(null) }
  }

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Lockers</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {counts.total} lockers · {counts.verde} libres · {counts.rojo} ocupados · {counts.amarillo} por vencer
          </p>
        </div>
        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
          className="btn-primary" onClick={() => setModal({})}>
          <Plus size={16} /> Agregar locker
        </motion.button>
      </div>

      {/* ── Leyenda visual ──────────────────────── */}
      <div className="flex flex-wrap gap-3">
        {([
          { key: 'todos',    label: `Todos (${counts.total})`,          dot: 'linear-gradient(135deg,#10b981,#ef4444)' },
          { key: 'verde',    label: `🟢 Libres (${counts.verde})`,      dot: '#10b981' },
          { key: 'rojo',     label: `🔴 Ocupados (${counts.rojo})`,     dot: '#ef4444' },
          { key: 'amarillo', label: `🟡 Por vencer (${counts.amarillo})`,dot: '#f59e0b' },
          { key: 'gris',     label: `⚙ Mantenimiento (${counts.gris})`, dot: '#64748b' },
        ] as const).map(({ key, label, dot }) => (
          <button key={key} onClick={() => setFiltro(key as FiltroColor)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: filtro === key ? 'rgba(59,130,246,0.2)' : 'rgba(30,41,59,0.5)',
              border: `1px solid ${filtro === key ? 'rgba(59,130,246,0.5)' : 'var(--color-border)'}`,
              color: filtro === key ? '#60a5fa' : 'var(--color-text-secondary)',
            }}>
            {label}
          </button>
        ))}

        {/* Search */}
        <div className="relative ml-auto">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
          <input className="input-field pl-9 py-2 text-sm w-44" placeholder="Buscar #..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {/* ── Grid + Detail ───────────────────────── */}
      <div className={`grid gap-6 ${selected ? 'lg:grid-cols-[1fr_380px]' : ''}`}>

        {/* GRID DE LOCKERS */}
        <div>
          <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-9 lg:grid-cols-10 xl:grid-cols-12 gap-2.5">
            <AnimatePresence mode="popLayout">
              {displayed.map(({ locker, color }) => {
                const c = COLOR_MAP[color]
                const isSelected = selected?.id === locker.id
                return (
                  <motion.button
                    key={locker.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    whileHover={{ scale: 1.12, y: -4 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => setSelected(isSelected ? null : locker)}
                    title={`#${locker.numero} — ${c.label}`}
                    className="aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 relative transition-all"
                    style={{
                      background: c.bg,
                      border: `2px solid ${isSelected ? 'white' : c.border}`,
                      boxShadow: isSelected
                        ? `0 0 0 3px ${c.border}60, 0 0 20px ${c.border}40`
                        : color === 'amarillo' ? `0 0 12px ${c.border}40` : 'none',
                    }}
                  >
                    {/* Pulsing dot para amarillo */}
                    {color === 'amarillo' && (
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full animate-pulse"
                        style={{ background: '#f59e0b' }} />
                    )}
                    <Lock size={13} style={{ color: c.text }} />
                    <span className="text-[11px] font-extrabold leading-none" style={{ color: c.text }}>
                      {locker.numero}
                    </span>
                  </motion.button>
                )
              })}
            </AnimatePresence>

            {/* Botón agregar rápido */}
            {filtro === 'todos' && !search && (
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => setModal({})}
                className="aspect-square rounded-xl flex items-center justify-center border-2 border-dashed transition-all"
                style={{ borderColor: 'rgba(59,130,246,0.3)', color: 'rgba(59,130,246,0.4)' }}>
                <Plus size={20} />
              </motion.button>
            )}
          </div>

          {lockers.length === 0 && !search && filtro === 'todos' ? (
            <div className="py-16 text-center rounded-2xl col-span-full"
              style={{ border: '2px dashed rgba(59,130,246,0.2)', background: 'rgba(59,130,246,0.03)' }}>
              <Lock size={40} className="mx-auto mb-3" style={{ color: 'rgba(59,130,246,0.3)' }} />
              <p className="text-white font-semibold mb-1">Sin lockers aún</p>
              <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>Agrega tu primer locker para empezar</p>
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                className="btn-primary gap-2 mx-auto" onClick={() => setModal({})}>
                <Plus size={16} /> Agregar primer locker
              </motion.button>
            </div>
          ) : displayed.length === 0 ? (
            <div className="py-16 text-center rounded-xl col-span-full" style={{ color: 'var(--color-text-muted)' }}>
              No se encontraron lockers con ese filtro
            </div>
          ) : null}
        </div>

        {/* PANEL DE DETALLE */}
        <AnimatePresence>
          {selected && (
            <DetailPanel
              key={selected.id}
              locker={selected}
              alquiler={selectedAlquiler}
              color={getColorLocker(selected, alquilerPorLocker[selected.id])}
              onEdit={() => setModal(selected)}
              onDelete={() => handleDelete(selected.id)}
              onRenovar={() => setRenovando(selectedAlquiler)}
              onClose={() => setSelected(null)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* ── Modals ─────────────────────────────── */}
      <AnimatePresence>
        {modal !== false && (
          <LockerModal locker={modal || null} onClose={() => setModal(false)}
            onSave={handleSave} gymId={gym?.id || 'demo'} />
        )}
        {renovando && (
          <RenovarModal alquiler={renovando} onClose={() => setRenovando(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
