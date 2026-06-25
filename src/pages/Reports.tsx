import { motion } from 'framer-motion'
import { TrendingUp, BarChart3, Download } from 'lucide-react'
import { formatMoneda } from '@/lib/utils'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { subMonths, format } from 'date-fns'
import { es } from 'date-fns/locale'

const MONTHS = Array.from({ length: 12 }).map((_, i) => {
  const d = subMonths(new Date(), 11 - i)
  return {
    mes: format(d, 'MMM', { locale: es }),
    ingresos: 100000 + Math.random() * 120000,
    ocupados: 30 + Math.floor(Math.random() * 16),
    nuevos: 1 + Math.floor(Math.random() * 5),
    finalizados: Math.floor(Math.random() * 3),
  }
})

const ZONE_DATA = [
  { zona: 'Zona A', lockers: 20, ocupados: 17, ingresos: 102000 },
  { zona: 'Zona B', lockers: 18, ocupados: 14, ingresos: 84000 },
  { zona: 'Zona C', lockers: 12, ocupados: 5,  ingresos: 40000 },
]

const TOOLTIP_STYLE = {
  contentStyle: { background: '#111827', border: '1px solid #1e293b', borderRadius: 8, color: '#f8fafc' },
}

export default function Reports() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Reportes</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Últimos 12 meses</p>
        </div>
        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className="btn-secondary">
          <Download size={16} /> Exportar CSV
        </motion.button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Ingreso anual estimado', value: formatMoneda(MONTHS.reduce((s, m) => s + m.ingresos, 0)), color: '#60a5fa' },
          { label: 'Promedio mensual', value: formatMoneda(MONTHS.reduce((s, m) => s + m.ingresos, 0) / 12), color: '#a78bfa' },
          { label: 'Tasa ocupación promedio', value: `${Math.round(MONTHS.reduce((s, m) => s + m.ocupados, 0) / 12 / 50 * 100)}%`, color: '#10b981' },
          { label: 'Nuevos alquileres (año)', value: MONTHS.reduce((s, m) => s + m.nuevos, 0), color: '#f59e0b' },
        ].map(({ label, value, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="card"
          >
            <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
            <p className="text-2xl font-bold" style={{ color }}>{value}</p>
          </motion.div>
        ))}
      </div>

      {/* Revenue Chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card">
        <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp size={18} style={{ color: '#60a5fa' }} /> Ingresos mensuales
        </h2>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={MONTHS}>
            <defs>
              <linearGradient id="rev12" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="mes" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [formatMoneda(v), 'Ingresos']} />
            <Area type="monotone" dataKey="ingresos" stroke="#3b82f6" strokeWidth={2.5} fill="url(#rev12)" />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Occupancy + New Rentals */}
      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="card">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 size={18} style={{ color: '#10b981' }} /> Lockers ocupados
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={MONTHS}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="mes" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Bar dataKey="ocupados" fill="#10b981" radius={[4, 4, 0, 0]} name="Ocupados" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 size={18} style={{ color: '#a78bfa' }} /> Altas vs Bajas
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={MONTHS}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="mes" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
              <Bar dataKey="nuevos" name="Nuevos" fill="#a78bfa" radius={[4, 4, 0, 0]} />
              <Bar dataKey="finalizados" name="Finalizados" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Zone breakdown */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="card">
        <h2 className="font-semibold text-white mb-4">Rendimiento por zona</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['Zona', 'Total lockers', 'Ocupados', 'Ocupación', 'Ingresos est.'].map((h) => (
                  <th key={h} className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wide"
                    style={{ color: 'var(--color-text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ZONE_DATA.map((z) => (
                <tr key={z.zona} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td className="py-3 px-3 font-semibold text-white">{z.zona}</td>
                  <td className="py-3 px-3" style={{ color: 'var(--color-text-secondary)' }}>{z.lockers}</td>
                  <td className="py-3 px-3" style={{ color: 'var(--color-text-secondary)' }}>{z.ocupados}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full" style={{ background: 'var(--color-border)' }}>
                        <div className="h-full rounded-full" style={{
                          width: `${Math.round(z.ocupados / z.lockers * 100)}%`,
                          background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                        }} />
                      </div>
                      <span className="text-xs font-semibold" style={{ color: '#60a5fa' }}>
                        {Math.round(z.ocupados / z.lockers * 100)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-semibold" style={{ color: '#60a5fa' }}>
                    {formatMoneda(z.ingresos)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
