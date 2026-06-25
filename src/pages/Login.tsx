import { useState, Suspense, lazy } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Lock, Eye, EyeOff, Mail, Building2, ArrowRight, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { toastSuccess, toastError } from '@/lib/toast'

const LockerScene3D = lazy(() =>
  import('@/components/3d/LockerScene3D').then((m) => ({ default: m.LockerScene3D }))
)

type Tab = 'login' | 'register'

function getFriendlyError(error: any): string {
  const msg = (error.json?.error_description || error.json?.error || error.message || String(error)).toLowerCase()
  if (msg.includes('email not confirmed') || msg.includes('email no confirmado')) {
    return 'Debés confirmar tu correo electrónico. Revisá tu bandeja de entrada o Spam.'
  }
  if (msg.includes('invalid_grant') || msg.includes('no user found') || msg.includes('password invalid') || msg.includes('invalid login')) {
    return 'No se pudo iniciar sesión. Verificá tu email y contraseña, o confirmá tu cuenta desde el email que recibiste.'
  }
  if (msg.includes('user already exists') || msg.includes('already registered')) {
    return 'Este correo ya está registrado. Intentá iniciar sesión.'
  }
  if (msg.includes('fetcherror') || msg.includes('network error') || msg.includes('failed to fetch') || error.status === 404) {
    return 'Error de conexión. Si estás en desarrollo local, iniciá la app usando `npm run dev` (Netlify CLI) o usá el "Modo demo".'
  }
  return error.message || String(error)
}

export default function Login() {
  const { signIn, signUp, signInDemo } = useAuthStore()
  const navigate = useNavigate()

  const [tab,        setTab]        = useState<Tab>('login')
  const [email,      setEmail]      = useState('')
  const [password,   setPassword]   = useState('')
  const [gymName,    setGymName]    = useState('')
  const [showPwd,    setShowPwd]    = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [registered, setRegistered] = useState(false) // true cuando signup ok pero necesita confirmar email

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (tab === 'login') {
        const { error } = await signIn(email, password)
        if (error) {
          console.error(error)
          toastError(getFriendlyError(error))
        } else {
          toastSuccess('¡Bienvenido!')
          navigate('/app/dashboard')
        }
      } else {
        if (!gymName.trim()) { toastError('Ingresá el nombre del gimnasio'); return }
        const { error } = await signUp(email, password, gymName)
        if (error) {
          console.error(error)
          toastError(getFriendlyError(error))
          return
        }
        // Verificar si el auto-login funcionó (sin confirmación de email)
        const { user } = useAuthStore.getState()
        if (user) {
          toastSuccess('¡Cuenta creada! Bienvenido.')
          navigate('/app/dashboard')
        } else {
          // Necesita confirmar email antes de poder ingresar
          setRegistered(true)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  // Demo: entrar sin base de datos
  const handleDemo = async () => {
    signInDemo()
    toastSuccess('Modo demo — sin conexión a base de datos')
    navigate('/app/dashboard')
  }

  // ── Pantalla: cuenta creada, revisar email ──────────────────
  if (registered) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--color-bg-primary)' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-8 max-w-md w-full text-center"
          style={{ border: '1px solid rgba(59,130,246,0.3)' }}>
          <div className="text-5xl mb-4">📧</div>
          <h1 className="text-2xl font-bold text-white mb-2">¡Cuenta creada!</h1>
          <p className="mb-1" style={{ color: 'var(--color-text-secondary)' }}>
            Te enviamos un email de confirmación a:
          </p>
          <p className="font-semibold text-blue-400 mb-4">{email}</p>
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
            Revisá tu bandeja de entrada (y la carpeta Spam) y hacé clic en el link para activar tu cuenta.
            Luego podés iniciar sesión normalmente.
          </p>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="btn-primary w-full mb-3"
            onClick={() => { setRegistered(false); setTab('login') }}>
            Ir al inicio de sesión
          </motion.button>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            ¿No recibiste el email? Esperá unos minutos o revisá en Spam.
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--color-bg-primary)' }}>

      {/* ── Left panel: 3D Scene ─────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden">
        <Suspense fallback={
          <div className="w-full h-full flex items-center justify-center"
            style={{ background: 'rgba(59,130,246,0.04)' }}>
            <Loader2 size={32} className="animate-spin" style={{ color: '#3b82f6' }} />
          </div>
        }>
          <LockerScene3D className="w-full h-full" />
        </Suspense>

        {/* Overlay text */}
        <div className="absolute inset-0 flex flex-col justify-end p-10"
          style={{ background: 'linear-gradient(to top, rgba(8,12,20,0.85) 0%, transparent 50%)' }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7 }}
          >
            <h2 className="text-4xl font-extrabold text-white mb-3 leading-tight">
              Gestión de lockers<br />
              <span style={{ color: '#60a5fa' }}>profesional</span>
            </h2>
            <p style={{ color: 'rgba(148,163,184,0.85)', fontSize: '1.05rem' }}>
              Control total de alquileres, vencimientos y cobros desde un solo lugar.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2 mt-5">
              {['✓ Multi-gimnasio', '✓ Roles admin/empleado', '✓ Alertas automáticas', '✓ Reportes en tiempo real'].map((f) => (
                <span key={f} className="text-xs font-semibold px-3 py-1.5 rounded-full"
                  style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa' }}>
                  {f}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Right panel: Form ────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)', boxShadow: '0 0 24px rgba(99,102,241,0.4)' }}>
              <Lock size={22} color="white" />
            </div>
            <div>
              <p className="text-xl font-extrabold text-white">Locker Manager</p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Sistema de gestión</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 p-1 rounded-xl mb-6"
            style={{ background: 'rgba(30,41,59,0.5)', border: '1px solid var(--color-border)' }}>
            {(['login', 'register'] as Tab[]).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className="flex-1 py-2.5 rounded-lg text-sm font-bold transition-all"
                style={{
                  background: tab === t ? 'rgba(59,130,246,0.25)' : 'transparent',
                  color: tab === t ? '#60a5fa' : 'var(--color-text-secondary)',
                  border: tab === t ? '1px solid rgba(59,130,246,0.4)' : '1px solid transparent',
                }}>
                {t === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
              </button>
            ))}
          </div>

          {/* Form */}
          <AnimatePresence mode="wait">
            <motion.form
              key={tab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {/* Gym name (solo en registro) */}
              {tab === 'register' && (
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                    Nombre del gimnasio
                  </label>
                  <div className="relative">
                    <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
                    <input className="input-field pl-10" placeholder="Mi Gimnasio" value={gymName}
                      onChange={(e) => setGymName(e.target.value)} required />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
                  <input type="email" className="input-field pl-10" placeholder="admin@gimnasio.com"
                    value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Contraseña</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
                  <input type={showPwd ? 'text' : 'password'} className="input-field pl-10 pr-10"
                    placeholder="••••••••" value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6} required />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: 'var(--color-text-muted)' }}>
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {tab === 'register' && (
                <p className="text-xs p-3 rounded-lg" style={{ background: 'rgba(59,130,246,0.08)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)' }}>
                  Al registrarte, serás el <strong>administrador</strong> del gimnasio con acceso completo.
                </p>
              )}

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02, boxShadow: '0 0 24px rgba(59,130,246,0.35)' }}
                whileTap={{ scale: 0.98 }}
                className="btn-primary w-full py-3.5 text-base mt-2 gap-2"
              >
                {loading
                  ? <><Loader2 size={18} className="animate-spin" /> Procesando…</>
                  : <>{tab === 'login' ? 'Ingresar' : 'Crear cuenta'} <ArrowRight size={18} /></>
                }
              </motion.button>
            </motion.form>
          </AnimatePresence>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>o</span>
            <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
          </div>

          {/* Demo */}
          <button onClick={handleDemo}
            className="w-full py-3 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: 'rgba(30,41,59,0.5)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-secondary)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(59,130,246,0.08)'
              e.currentTarget.style.color = '#60a5fa'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(30,41,59,0.5)'
              e.currentTarget.style.color = 'var(--color-text-secondary)'
            }}>
            🎯 Ver demo sin cuenta
          </button>

          {/* Rol info */}
          <div className="mt-6 p-4 rounded-xl space-y-2" style={{ background: 'rgba(30,41,59,0.3)', border: '1px solid var(--color-border)' }}>
            <p className="text-xs font-bold" style={{ color: 'var(--color-text-secondary)' }}>Roles disponibles</p>
            <div className="flex gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span style={{ color: 'var(--color-text-secondary)' }}><strong className="text-white">Admin</strong> — acceso total</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span style={{ color: 'var(--color-text-secondary)' }}><strong className="text-white">Empleado</strong> — operaciones</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
