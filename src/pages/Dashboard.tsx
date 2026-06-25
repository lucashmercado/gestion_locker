import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Lock, CheckCircle, AlertCircle, XCircle, TrendingUp, Plus, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useLockerStore } from '@/store/lockerStore'
import { useAlquilerStore } from '@/store/rentalStore'
import { useAuthStore } from '@/store/authStore'
import { toastSuccess, toastWarning } from '@/lib/toast'
import { formatMoneda, formatFechaCorta, venceProximamente } from '@/lib/utils'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

// ─── KPI CARD ────────────────────────────────────────────────
function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  delay = 0,
  to,
}: {
  icon: any; label: string; value: string | number; sub?: string
  color: 'blue' | 'green' | 'red' | 'yellow' | 'purple'
  delay?: number; to?: string
}) {
  const colors = {
    blue:   { bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.3)',  icon: 'rgba(59,130,246,0.2)',  text: '#60a5fa'  },
    green:  { bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.3)',  icon: 'rgba(16,185,129,0.2)',  text: '#10b981'  },
    red:    { bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.3)',   icon: 'rgba(239,68,68,0.2)',   text: '#ef4444'  },
    yellow: { bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)',  icon: 'rgba(245,158,11,0.2)',  text: '#f59e0b'  },
    purple: { bg: 'rgba(139,92,246,0.12)',  border: 'rgba(139,92,246,0.3)',  icon: 'rgba(139,92,246,0.2)',  text: '#a78bfa'  },
  }
  const c = colors[color]

  const card = (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="rounded-2xl p-5 relative overflow-hidden cursor-pointer select-none"
      style={{ background: c.bg, border: `1px solid ${c.border}` }}
    >
      {/* Glow */}
      <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full blur-2xl opacity-30"
        style={{ background: c.text }} />

      <div className="relative z-10 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium mb-1" style={{ color: 'rgba(148,163,184,0.9)' }}>{label}</p>
          <p className="text-4xl font-extrabold leading-none" style={{ color: '#f8fafc' }}>{value}</p>
          {sub && <p className="text-xs mt-1.5 font-medium" style={{ color: c.text }}>{sub}</p>}
        </div>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: c.icon, color: c.text }}>
          <Icon size={22} />
        </div>
      </div>
    </motion.div>
  )

  return to ? <Link to={to}>{card}</Link> : card
}

export default function Dashboard() {
  const { gym } = useAuthStore()
  const { lockers, fetchLockers } = useLockerStore()
  const { alquileres, metricas, fetchAlquileres, fetchMetricas, detectarVencimientos } = useAlquilerStore()

  useEffect(() => {
    if (gym?.id) {
      fetchLockers(gym.id)
      fetchAlquileres(gym.id)
      fetchMetricas(gym.id)
    }
  }, [gym?.id])

  // Compute from real data or demo
  const demo = lockers.length === 0
  const lkrs = demo ? DEMO_LOCKERS : lockers
  const alqs = demo ? DEMO_ALQUILERES : alquileres

  const total     = lkrs.length
  const ocupados  = lkrs.filter((l) => l.estado === 'ocupado' || l.estado === 'vencido').length
  const libres    = lkrs.filter((l) => l.estado === 'libre').length
  const vencidos  = alqs.filter((a: any) => a.estado === 'vencido').length
  const proximos  = alqs.filter((a: any) => a.estado === 'activo' && venceProximamente(a.fecha_vencimiento || a.fechaVencimiento)).length
  const ingresos  = metricas?.ingresos_mes_actual ??
    alqs.filter((a: any) => a.estado === 'activo').reduce((s: number, a: any) => s + (a.monto_pagado || a.monto || 0), 0)

  // Alquileres recientes y próximos a vencer
  const activos = alqs.filter((a: any) => a.estado === 'activo').slice(0, 8)
  const proxVencer = alqs.filter((a: any) => a.estado === 'activo' && venceProximamente(a.fecha_vencimiento || a.fechaVencimiento)).slice(0, 5)

  const handleDetectarVencimientos = async () => {
    if (!gym?.id) return
    const v = await detectarVencimientos(gym.id)
    if (v.length > 0) {
      toastWarning(`${v.length} alquiler(es) marcados como vencidos.`)
    } else {
      toastSuccess('No hay vencimientos nuevos.')
    }
  }

  return (
    <div className="space-y-7">

      {/* ── Header ─────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            {gym?.nombre || 'Dashboard'}
          </h1>
          <p className="mt-0.5 text-sm capitalize" style={{ color: 'var(--color-text-secondary)' }}>
            {format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es })}
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleDetectarVencimientos}
            className="btn-secondary text-sm gap-2">
            <RefreshCw size={14} /> Detectar vencimientos
          </button>
          <Link to="/app/rentals">
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              className="btn-primary gap-2">
              <Plus size={16} /> Nuevo alquiler
            </motion.button>
          </Link>
        </div>
      </div>

      {/* ── Alerta vencimientos ─────────────────── */}
      {proximos > 0 && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold"
          style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.35)', color: '#f59e0b' }}>
          <AlertCircle size={18} />
          {proximos} alquiler{proximos > 1 ? 'es' : ''} vence{proximos > 1 ? 'n' : ''} esta semana —{' '}
          <Link to="/app/rentals" className="underline underline-offset-2">ver alquileres</Link>
        </motion.div>
      )}

      {/* ── KPIs ───────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard icon={Lock}        label="Total lockers"   value={total}               color="blue"   delay={0}    to="/app/lockers"  />
        <KpiCard icon={CheckCircle} label="Disponibles"     value={libres}              color="green"  delay={0.05} to="/app/lockers"  />
        <KpiCard icon={XCircle}     label="Ocupados"        value={ocupados}            color="red"    delay={0.1}  to="/app/lockers"  />
        <KpiCard icon={AlertCircle} label="Alquileres vencidos" value={vencidos}        color="yellow" delay={0.15} to="/app/rentals"  />
        <KpiCard icon={TrendingUp}  label="Ingresos del mes" value={formatMoneda(ingresos)} sub="este mes" color="purple" delay={0.2} />
      </div>

      {/* ── Tablas ─────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Alquileres activos recientes */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-white text-lg">Alquileres activos</h2>
            <Link to="/app/rentals" className="text-xs font-semibold hover:text-blue-300 transition-colors"
              style={{ color: '#60a5fa' }}>Ver todos →</Link>
          </div>
          <div className="space-y-2">
            {activos.length === 0 ? (
              <p className="text-sm py-8 text-center" style={{ color: 'var(--color-text-muted)' }}>Sin alquileres activos</p>
            ) : activos.map((a: any) => {
              const venc = a.fecha_vencimiento || a.fechaVencimiento
              const prox = venceProximamente(venc)
              return (
                <div key={a.id}
                  className="flex items-center justify-between p-3 rounded-xl transition-all"
                  style={{
                    background: prox ? 'rgba(245,158,11,0.07)' : 'rgba(30,41,59,0.5)',
                    border: `1px solid ${prox ? 'rgba(245,158,11,0.25)' : 'var(--color-border)'}`,
                  }}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0"
                      style={{ background: prox ? 'rgba(245,158,11,0.2)' : 'rgba(59,130,246,0.2)', color: prox ? '#f59e0b' : '#60a5fa' }}>
                      {a.locker?.numero || a.locker_numero || a.lockerNumero}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white truncate max-w-[160px]">
                        {a.cliente?.nombre || a.cliente_nombre || a.clienteNombre}
                      </p>
                      <p className="text-xs" style={{ color: prox ? '#f59e0b' : 'var(--color-text-muted)' }}>
                        {prox ? '⚠ Vence ' : 'Vence '}{formatFechaCorta(venc)}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-bold flex-shrink-0" style={{ color: '#60a5fa' }}>
                    {formatMoneda(a.monto_pagado || a.monto || 0)}
                  </p>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* Próximos a vencer */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-white text-lg">⚠ Próximos a vencer</h2>
            <span className="badge badge-warning">{proxVencer.length} esta semana</span>
          </div>
          {proxVencer.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <CheckCircle size={36} style={{ color: '#10b981' }} />
              <p className="text-sm font-semibold" style={{ color: '#10b981' }}>¡Todo al día!</p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>No hay vencimientos en los próximos 7 días</p>
            </div>
          ) : proxVencer.map((a: any) => {
            const venc = a.fecha_vencimiento || a.fechaVencimiento
            return (
              <div key={a.id} className="flex items-center justify-between p-3 rounded-xl mb-2"
                style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-yellow-500/20 flex items-center justify-center font-bold text-xs"
                    style={{ color: '#f59e0b' }}>
                    {a.locker?.numero || a.locker_numero || a.lockerNumero}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {a.cliente?.nombre || a.cliente_nombre || a.clienteNombre}
                    </p>
                    <p className="text-xs" style={{ color: '#f59e0b' }}>Vence el {formatFechaCorta(venc)}</p>
                  </div>
                </div>
                <Link to="/app/rentals">
                  <button className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                    style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b' }}>
                    Renovar
                  </button>
                </Link>
              </div>
            )
          })}
        </motion.div>
      </div>
    </div>
  )
}

// ─── Demo fallback data ───────────────────────────────────────
const DEMO_LOCKERS = Array.from({ length: 50 }).map((_, i) => ({
  id: `d-${i}`, estado: (['ocupado','ocupado','libre','libre','ocupado','vencido'] as const)[i % 6],
}))
const DEMO_ALQUILERES = [
  { id:'1', lockerNumero:'01', clienteNombre:'Juan García',   monto:6000, fechaVencimiento:'2026-06-30', estado:'activo',    monto_pagado:6000 },
  { id:'2', lockerNumero:'07', clienteNombre:'María López',   monto:6000, fechaVencimiento:'2026-06-28', estado:'activo',    monto_pagado:6000 },
  { id:'3', lockerNumero:'12', clienteNombre:'Carlos Ruiz',   monto:8000, fechaVencimiento:'2026-08-01', estado:'activo',    monto_pagado:8000 },
  { id:'4', lockerNumero:'23', clienteNombre:'Ana Torres',    monto:6000, fechaVencimiento:'2026-06-20', estado:'vencido',   monto_pagado:6000 },
  { id:'5', lockerNumero:'31', clienteNombre:'Pedro Díaz',    monto:8000, fechaVencimiento:'2026-07-15', estado:'activo',    monto_pagado:8000 },
  { id:'6', lockerNumero:'45', clienteNombre:'Laura Sánchez', monto:6000, fechaVencimiento:'2026-06-29', estado:'activo',    monto_pagado:6000 },
]
