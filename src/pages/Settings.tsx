import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2, Bell, Shield, Save, Check,
  Users, UserPlus, Trash2, Mail,
  Loader2, AlertCircle, UserCheck,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/api'
import { toastSuccess, toastError } from '@/lib/toast'

// ─── Types ───────────────────────────────────────────────────
interface Empleado {
  id:     string
  email:  string
  nombre: string
  rol:    string
  creado: string
}

// ─── Section wrapper ─────────────────────────────────────────
function Section({
  icon: Icon, title, subtitle, children,
}: {
  icon: any; title: string; subtitle?: string; children: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card space-y-5"
    >
      <div className="flex items-start gap-3 pb-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa' }}>
          <Icon size={18} />
        </div>
        <div>
          <h2 className="font-semibold text-white">{title}</h2>
          {subtitle && <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{subtitle}</p>}
        </div>
      </div>
      {children}
    </motion.div>
  )
}

// ─── Tarjeta de empleado ─────────────────────────────────────
function EmpleadoCard({ emp, onDelete }: { emp: Empleado; onDelete: (id: string) => void }) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`¿Eliminar la cuenta de ${emp.email}?`)) return
    setDeleting(true)
    onDelete(emp.id)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex items-center gap-3 p-3 rounded-xl"
      style={{ background: 'rgba(30,41,59,0.5)', border: '1px solid var(--color-border)' }}
    >
      <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80' }}>
        <UserCheck size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{emp.nombre || emp.email}</p>
        <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>{emp.email}</p>
      </div>
      <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
        style={{ background: 'rgba(34,197,94,0.12)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.25)' }}>
        Empleado
      </span>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="p-1.5 rounded-lg transition-colors flex-shrink-0"
        style={{ color: 'var(--color-text-muted)' }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#f87171')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
        title="Eliminar empleado"
      >
        {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
      </button>
    </motion.div>
  )
}

// ─── Página principal ─────────────────────────────────────────
export default function Settings() {
  const { gym, setGym } = useAuthStore()

  // Gym data
  const [gymName,    setGymName]    = useState('')
  const [gymAddress, setGymAddress] = useState('')
  const [gymPhone,   setGymPhone]   = useState('')
  const [savingGym,  setSavingGym]  = useState(false)
  const [savedGym,   setSavedGym]   = useState(false)

  // Employees
  const [empleados,     setEmpleados]     = useState<Empleado[]>([])
  const [loadingEmps,   setLoadingEmps]   = useState(true)
  const [showNewEmp,    setShowNewEmp]    = useState(false)
  const [empEmail,      setEmpEmail]      = useState('')
  const [empNombre,     setEmpNombre]     = useState('')
  const [creatingEmp,   setCreatingEmp]   = useState(false)

  // ── Cargar datos del gym ─────────────────────────────────
  useEffect(() => {
    if (gym) {
      setGymName(gym.nombre || '')
      setGymAddress(gym.direccion || '')
      setGymPhone(gym.telefono || '')
    }
  }, [gym])

  // ── Cargar empleados ─────────────────────────────────────
  useEffect(() => {
    loadEmpleados()
  }, [])

  async function loadEmpleados() {
    setLoadingEmps(true)
    try {
      const data = await api.get('/empleados')
      setEmpleados(Array.isArray(data) ? data : [])
    } catch (e: any) {
      console.error('Error loading employees:', e)
      setEmpleados([])
    } finally {
      setLoadingEmps(false)
    }
  }

  // ── Guardar gym ──────────────────────────────────────────
  const handleSaveGym = async () => {
    if (!gymName.trim()) { toastError('El nombre es requerido'); return }
    setSavingGym(true)
    try {
      const updated = await api.put('/gyms', { nombre: gymName, direccion: gymAddress, telefono: gymPhone })
      setGym(updated)
      setSavedGym(true)
      toastSuccess('Datos del gimnasio actualizados')
      setTimeout(() => setSavedGym(false), 2500)
    } catch (e: any) {
      toastError('Error al guardar: ' + e.message)
    } finally {
      setSavingGym(false)
    }
  }

  // ── Crear empleado ───────────────────────────────────────
  const handleCreateEmpleado = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!empEmail.trim() || !empPassword.trim()) return
    setCreatingEmp(true)
    try {
      const created = await api.post('/empleados', {
        email: empEmail.trim(),
        nombre: empNombre.trim(),
      })
      setEmpleados((prev) => [...prev, created])
      setEmpEmail(''); setEmpNombre('')
      setShowNewEmp(false)
      toastSuccess(`Empleado ${empEmail} registrado. Deberá crear su cuenta en el sitio con ese email.`)
    } catch (e: any) {
      toastError(e.message || 'Error al crear empleado')
    } finally {
      setCreatingEmp(false)
    }
  }

  // ── Eliminar empleado ────────────────────────────────────
  const handleDeleteEmpleado = async (id: string) => {
    try {
      await api.delete(`/empleados?id=${id}`)
      setEmpleados((prev) => prev.filter((e) => e.id !== id))
      toastSuccess('Empleado eliminado')
    } catch (e: any) {
      toastError('Error al eliminar: ' + e.message)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Configuración</h1>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Personalizá tu gimnasio y gestioná tu equipo
        </p>
      </div>

      {/* ── Información del gimnasio ────────────────────── */}
      <Section icon={Building2} title="Información del gimnasio" subtitle="Datos que se muestran en reportes y recibos">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              Nombre del gimnasio *
            </label>
            <input
              className="input-field"
              placeholder="Mi Gimnasio"
              value={gymName}
              onChange={(e) => setGymName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              Dirección
            </label>
            <input
              className="input-field"
              placeholder="Av. Ejemplo 1234"
              value={gymAddress}
              onChange={(e) => setGymAddress(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              Teléfono
            </label>
            <input
              className="input-field"
              placeholder="11-1234-5678"
              value={gymPhone}
              onChange={(e) => setGymPhone(e.target.value)}
            />
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSaveGym}
          disabled={savingGym}
          className="btn-primary px-6 py-2.5 gap-2"
          style={savedGym ? { background: 'linear-gradient(135deg, #059669, #047857)' } : {}}
        >
          {savingGym
            ? <><Loader2 size={16} className="animate-spin" /> Guardando…</>
            : savedGym
              ? <><Check size={16} /> ¡Guardado!</>
              : <><Save size={16} /> Guardar cambios</>
          }
        </motion.button>
      </Section>

      {/* ── Gestión de empleados ────────────────────────── */}
      <Section
        icon={Users}
        title="Empleados"
        subtitle="Creá cuentas para tu equipo. Los empleados pueden operar el sistema pero no acceder a configuración ni reportes."
      >
        {/* Lista de empleados */}
        {loadingEmps ? (
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            <Loader2 size={16} className="animate-spin" /> Cargando empleados…
          </div>
        ) : empleados.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(30,41,59,0.6)', border: '1px solid var(--color-border)' }}>
              <Users size={22} style={{ color: 'var(--color-text-muted)' }} />
            </div>
            <p className="text-sm font-medium text-white">Sin empleados aún</p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Creá la primera cuenta para tu equipo
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {empleados.map((emp) => (
                <EmpleadoCard key={emp.id} emp={emp} onDelete={handleDeleteEmpleado} />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Botón / Formulario nuevo empleado */}
        <AnimatePresence>
          {showNewEmp ? (
            <motion.form
              key="form"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleCreateEmpleado}
              className="space-y-3 overflow-hidden"
            >
              <div className="h-px" style={{ background: 'var(--color-border)' }} />
              <p className="text-sm font-semibold text-white">Nueva cuenta de empleado</p>

              <div className="p-3 rounded-xl text-xs flex gap-2"
                style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', color: '#60a5fa' }}>
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                <span>
                  Registrá el email del empleado. Luego él deberá <strong>crear su cuenta</strong> en el sitio con ese mismo email.
                  El sistema le asignará automáticamente el rol de empleado.
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                  Nombre completo
                </label>
                <input
                  className="input-field"
                  placeholder="Juan Pérez"
                  value={empNombre}
                  onChange={(e) => setEmpNombre(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                  Email *
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
                  <input
                    type="email"
                    className="input-field pl-9"
                    placeholder="empleado@gmail.com"
                    value={empEmail}
                    onChange={(e) => setEmpEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <motion.button
                  type="submit"
                  disabled={creatingEmp}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-primary flex-1 py-2.5 gap-2"
                >
                  {creatingEmp
                    ? <><Loader2 size={15} className="animate-spin" /> Registrando…</>
                    : <><UserPlus size={15} /> Registrar empleado</>
                  }
                </motion.button>
                <button
                  type="button"
                  onClick={() => { setShowNewEmp(false); setEmpEmail(''); setEmpNombre('') }}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                  style={{ background: 'rgba(30,41,59,0.6)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
                >
                  Cancelar
                </button>
              </div>
            </motion.form>
          ) : (
            <motion.button
              key="btn"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setShowNewEmp(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all w-full justify-center"
              style={{
                background: 'rgba(59,130,246,0.08)',
                border: '1px dashed rgba(59,130,246,0.35)',
                color: '#60a5fa',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(59,130,246,0.14)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(59,130,246,0.08)')}
            >
              <UserPlus size={16} />
              Agregar empleado
            </motion.button>
          )}
        </AnimatePresence>
      </Section>

      {/* ── Seguridad ────────────────────────────────────── */}
      <Section icon={Shield} title="Seguridad" subtitle="Cambio de contraseña del administrador">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              Nueva contraseña
            </label>
            <input type="password" className="input-field" placeholder="••••••••" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              Confirmar contraseña
            </label>
            <input type="password" className="input-field" placeholder="••••••••" />
          </div>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Próximamente: cambio de contraseña integrado.
          </p>
        </div>
      </Section>

      {/* ── Alertas ──────────────────────────────────────── */}
      <Section icon={Bell} title="Alertas de vencimiento" subtitle="Configurá cuándo querés ser notificado">
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
            Alertar cuando faltan (días)
          </label>
          <input type="number" min={1} max={30} className="input-field w-32" defaultValue={7} />
          <p className="text-xs mt-1.5" style={{ color: 'var(--color-text-muted)' }}>
            Los lockers aparecerán marcados en el dashboard cuando su vencimiento esté próximo.
          </p>
        </div>
      </Section>
    </div>
  )
}
