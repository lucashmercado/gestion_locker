import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import { Lock, Shield, BarChart3, Smartphone, ChevronRight, CheckCircle, Zap, Users, Clock } from 'lucide-react'
import { LockerScene3D } from '@/components/3d/LockerScene3D'

const features = [
  { icon: Lock, title: 'Control Total de Lockers', desc: 'Mapa visual interactivo con estado en tiempo real de cada casillero.' },
  { icon: Users, title: 'Gestión de Clientes', desc: 'Directorio completo con historial de alquileres por cliente.' },
  { icon: BarChart3, title: 'Reportes y Analytics', desc: 'Ingresos, ocupación y vencimientos en dashboards visuales.' },
  { icon: Clock, title: 'Alertas Automáticas', desc: 'Notificaciones de vencimientos próximos para actuar a tiempo.' },
  { icon: Shield, title: 'Multi-Gimnasio', desc: 'Gestiona múltiples sucursales desde una sola plataforma.' },
  { icon: Smartphone, title: '100% Responsive', desc: 'Funciona perfecto en celular, tablet y computadora.' },
]

const benefits = [
  'Eliminá planillas de Excel',
  'Reducí tiempo de administración',
  'Cero lockers perdidos o vencidos',
  'Ingreso mensual predecible',
  'Acceso desde cualquier dispositivo',
  'Datos en la nube, seguros siempre',
]

function AnimatedSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export default function Landing() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg-primary)' }}>
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center glow-blue-sm">
              <Lock size={16} className="text-white" />
            </div>
            <span className="font-bold text-white text-lg">Locker Manager</span>
          </div>
          <Link to="/login">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className="btn-primary"
            >
              Ingresar al sistema
              <ChevronRight size={16} />
            </motion.button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
        {/* Background grid */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(rgba(59,130,246,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.4) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />
        {/* Glow blobs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl" style={{ background: '#3b82f6' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-8 blur-3xl" style={{ background: '#8b5cf6' }} />

        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center relative z-10 w-full">
          {/* Left */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
              style={{
                background: 'rgba(59,130,246,0.15)',
                border: '1px solid rgba(59,130,246,0.3)',
                color: '#60a5fa',
              }}
            >
              <Zap size={12} />
              Software de gestión para gimnasios
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="text-5xl lg:text-6xl font-extrabold leading-tight mb-6"
            >
              Administrá tus{' '}
              <span className="text-gradient">lockers</span>
              {' '}de forma inteligente
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-lg mb-8 leading-relaxed"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Locker Manager es la plataforma SaaS diseñada para gimnasios que quieren
              profesionalizar la administración de sus casilleros. Alquileres, pagos,
              vencimientos y más — todo en un solo lugar.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link to="/login">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(59,130,246,0.5)' }}
                  whileTap={{ scale: 0.97 }}
                  className="btn-primary text-base px-8 py-3 w-full sm:w-auto"
                >
                  Ingresar al sistema
                  <ChevronRight size={18} />
                </motion.button>
              </Link>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="btn-secondary text-base px-8 py-3"
              >
                Ver demo
              </motion.button>
            </motion.div>
          </div>

          {/* Right — 3D Scene */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="relative h-[420px] lg:h-[520px]"
          >
            <div
              className="absolute inset-0 rounded-2xl overflow-hidden"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(59,130,246,0.08) 0%, transparent 70%)',
                border: '1px solid rgba(59,130,246,0.15)',
              }}
            >
              <LockerScene3D className="w-full h-full" />
            </div>
            {/* Floating badges */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-6 -left-4 glass rounded-xl px-3 py-2 text-xs font-semibold"
              style={{ border: '1px solid rgba(16,185,129,0.3)', color: '#10b981' }}
            >
              ✓ 24 lockers disponibles
            </motion.div>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              className="absolute bottom-8 -right-4 glass rounded-xl px-3 py-2 text-xs font-semibold"
              style={{ border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa' }}
            >
              💰 $180.000 / mes
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Todo lo que tu gimnasio <span className="text-gradient">necesita</span>
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
              Una plataforma completa pensada para las necesidades reales de los administradores de gimnasios.
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc }, i) => (
              <AnimatedSection key={title}>
                <motion.div
                  whileHover={{ y: -5, borderColor: 'rgba(59,130,246,0.4)' }}
                  transition={{ duration: 0.2 }}
                  className="card glass-hover h-full"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa' }}
                  >
                    <Icon size={24} />
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-white">{title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                    {desc}
                  </p>
                </motion.div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-6" style={{ background: 'var(--color-bg-secondary)' }}>
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <AnimatedSection>
            <h2 className="text-4xl font-bold mb-6">
              Dejá de perder tiempo con <span className="text-gradient">planillas</span>
            </h2>
            <p className="text-lg mb-8 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              Locker Manager reemplaza Excel, cuadernos y WhatsApps. Todo centralizado, accesible y automatizado.
            </p>
            <div className="space-y-3">
              {benefits.map((b) => (
                <div key={b} className="flex items-center gap-3">
                  <CheckCircle size={18} className="flex-shrink-0" style={{ color: '#10b981' }} />
                  <span style={{ color: 'var(--color-text-secondary)' }}>{b}</span>
                </div>
              ))}
            </div>
            <Link to="/login" className="inline-block mt-8">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="btn-primary text-base px-8 py-3"
              >
                Empezar ahora
                <ChevronRight size={18} />
              </motion.button>
            </Link>
          </AnimatedSection>

          <AnimatedSection>
            {/* Mock Dashboard Preview */}
            <div className="glass rounded-2xl p-5 space-y-4" style={{ border: '1px solid rgba(59,130,246,0.2)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-white">Estado de lockers</span>
                <span className="badge badge-success">En vivo</span>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Total', value: 48, color: '#60a5fa' },
                  { label: 'Alquilados', value: 36, color: '#3b82f6' },
                  { label: 'Libres', value: 10, color: '#10b981' },
                  { label: 'Vencidos', value: 2, color: '#ef4444' },
                ].map(({ label, value, color }) => (
                  <div
                    key={label}
                    className="rounded-xl p-3 text-center"
                    style={{ background: 'rgba(30,41,59,0.5)', border: '1px solid var(--color-border)' }}
                  >
                    <p className="text-2xl font-bold" style={{ color }}>{value}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
                  </div>
                ))}
              </div>
              {/* Locker grid preview */}
              <div className="grid grid-cols-8 gap-1.5 mt-2">
                {Array.from({ length: 32 }).map((_, i) => {
                  const colors = ['#10b981', '#10b981', '#10b981', '#3b82f6', '#3b82f6', '#3b82f6', '#3b82f6', '#ef4444']
                  const c = colors[i % colors.length]
                  return (
                    <motion.div
                      key={i}
                      whileHover={{ scale: 1.2 }}
                      className="aspect-square rounded"
                      style={{ background: c, opacity: 0.7 }}
                    />
                  )
                })}
              </div>
              <div
                className="rounded-xl p-3 mt-2"
                style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}
              >
                <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Ingreso estimado mes</p>
                <p className="text-2xl font-bold" style={{ color: '#60a5fa' }}>$216.000</p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ background: 'radial-gradient(ellipse at center, #3b82f6, transparent 70%)' }} />
        <AnimatedSection className="relative z-10 max-w-2xl mx-auto">
          <h2 className="text-4xl lg:text-5xl font-extrabold mb-6">
            ¿Listo para <span className="text-gradient">modernizar</span> tu gimnasio?
          </h2>
          <p className="text-lg mb-8" style={{ color: 'var(--color-text-secondary)' }}>
            Sumate a los gimnasios que ya gestionan sus lockers de forma profesional.
          </p>
          <Link to="/login">
            <motion.button
              whileHover={{ scale: 1.07, boxShadow: '0 0 40px rgba(59,130,246,0.5)' }}
              whileTap={{ scale: 0.97 }}
              className="btn-primary text-lg px-10 py-4 glow-blue"
            >
              Ingresar al sistema
              <ChevronRight size={20} />
            </motion.button>
          </Link>
        </AnimatedSection>
      </section>

      {/* Footer */}
      <footer
        className="py-8 px-6 border-t text-center text-sm"
        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <Lock size={14} style={{ color: '#3b82f6' }} />
          <span className="font-semibold text-white">Locker Manager</span>
        </div>
        <p>© {new Date().getFullYear()} — Sistema de gestión de lockers para gimnasios</p>
      </footer>
    </div>
  )
}
