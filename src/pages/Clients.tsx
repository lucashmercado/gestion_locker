import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Phone, Mail, Lock, X, Trash2, Edit } from 'lucide-react'
import { useClienteStore } from '@/store/clienteStore'
import { useAuthStore } from '@/store/authStore'
import { useConfirm } from '@/components/ConfirmDialog'
import { toastSuccess, toastError } from '@/lib/toast'
import { formatFechaCorta } from '@/lib/utils'
import type { Cliente } from '@/types'

function ClienteModal({
  cliente, onClose, onSave, gymId,
}: {
  cliente: Partial<Cliente> | null
  onClose: () => void
  onSave: (data: any) => Promise<void>
  gymId: string
}) {
  const [form, setForm] = useState({
    nombre:   cliente?.nombre   || '',
    telefono: cliente?.telefono || '',
    email:    cliente?.email    || '',
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nombre.trim()) { setErr('El nombre es requerido'); return }
    setSaving(true)
    try {
      await onSave({ ...form, gym_id: gymId })
      onClose()
    } catch (e: any) { setErr(e.message) }
    setSaving(false)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)' }} onClick={onClose}>
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
        onClick={(e) => e.stopPropagation()}
        className="glass rounded-2xl p-6 w-full max-w-sm"
        style={{ border: '1px solid rgba(59,130,246,0.25)' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">{cliente?.id ? 'Editar cliente' : 'Nuevo cliente'}</h2>
          <button onClick={onClose} style={{ color: 'var(--color-text-muted)' }}><X size={20} /></button>
        </div>
        {err && <div className="mb-3 p-2 rounded text-sm" style={{ background:'rgba(239,68,68,0.1)',color:'#ef4444' }}>{err}</div>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Nombre *</label>
            <input className="input-field" placeholder="Nombre completo" value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Teléfono</label>
            <input className="input-field" placeholder="11-1234-5678" value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Email</label>
            <input type="email" className="input-field" placeholder="email@ejemplo.com" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default function Clients() {
  const { gym } = useAuthStore()
  const { clientes, fetchClientes, addCliente, updateCliente, deleteCliente } = useClienteStore()
  const [search, setSearch]   = useState('')
  const [modal,  setModal]    = useState<Partial<Cliente> | null | false>(false)
  const { confirm } = useConfirm()

  useEffect(() => { if (gym?.id) fetchClientes(gym.id) }, [gym?.id])

  const displayed = clientes.filter((c: any) => {
    const q = search.toLowerCase()
    return (
      c.nombre?.toLowerCase().includes(q) ||
      c.telefono?.includes(q) ||
      c.email?.toLowerCase().includes(q)
    )
  })

  const handleSave = async (data: any) => {
    if ((modal as Cliente)?.id) {
      const { error } = await updateCliente((modal as Cliente).id, data)
      if (error) { toastError(error.message); throw new Error(error.message) }
      else toastSuccess('Cliente actualizado')
    } else {
      const { error } = await addCliente(data)
      if (error) { toastError(error.message); throw new Error(error.message) }
      else toastSuccess(`Cliente ${data.nombre} agregado`)
    }
  }

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Eliminar cliente',
      description: '¿Eliminás este cliente? Sus alquileres quedarán sin cliente asignado.',
      confirmText: 'Eliminar',
      danger: true,
    })
    if (!ok) return
    const { error } = await deleteCliente(id)
    if (error) toastError(error.message)
    else toastSuccess('Cliente eliminado')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Clientes</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{clientes.length} registros</p>
        </div>
        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
          className="btn-primary" onClick={() => setModal({})}>
          <Plus size={16} /> Nuevo cliente
        </motion.button>
      </div>

      {/* Búsqueda */}
      <div className="relative max-w-md">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
        <input className="input-field pl-9" placeholder="Buscar por nombre, teléfono o email…"
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {displayed.map((c: any, i: number) => (
            <motion.div key={c.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ y: -3 }}
              className="card glass-hover"
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-base font-bold flex-shrink-0"
                  style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)' }}>
                  {(c.nombre || '?')[0].toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-white truncate">{c.nombre}</p>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => setModal(c)}
                        className="p-1.5 rounded-lg transition-all hover:bg-blue-500/10" style={{ color: '#60a5fa' }}>
                        <Edit size={13} />
                      </button>
                      <button onClick={() => handleDelete(c.id)}
                        className="p-1.5 rounded-lg transition-all hover:bg-red-500/10" style={{ color: '#ef4444' }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 space-y-1.5">
                    {c.telefono && (
                      <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        <Phone size={11} />
                        <a href={`tel:${c.telefono}`} className="hover:text-blue-400 transition-colors">{c.telefono}</a>
                      </div>
                    )}
                    {c.email && (
                      <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        <Mail size={11} />
                        <a href={`mailto:${c.email}`} className="hover:text-blue-400 transition-colors truncate">{c.email}</a>
                      </div>
                    )}
                  </div>

                  {c.fecha_creacion && (
                    <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
                      Alta: {formatFechaCorta(c.fecha_creacion)}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {clientes.length === 0 && !search ? (
        <div className="py-16 text-center rounded-2xl col-span-full"
          style={{ border: '2px dashed rgba(59,130,246,0.2)', background: 'rgba(59,130,246,0.03)' }}>
          <div className="text-4xl mb-3">👤</div>
          <p className="text-white font-semibold mb-1">Sin clientes aún</p>
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>Agregá tu primer cliente para asignarlo a un locker</p>
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            className="btn-primary gap-2 mx-auto" onClick={() => setModal({})}>
            <Plus size={16} /> Agregar primer cliente
          </motion.button>
        </div>
      ) : displayed.length === 0 ? (
        <div className="py-16 text-center" style={{ color: 'var(--color-text-muted)' }}>
          No se encontraron clientes
        </div>
      ) : null}

      <AnimatePresence>
        {modal !== false && (
          <ClienteModal
            cliente={modal || null} onClose={() => setModal(false)}
            onSave={handleSave} gymId={gym?.id || ''}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
