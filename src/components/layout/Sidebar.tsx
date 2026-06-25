import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Lock, Users, FileText, BarChart3,
  Settings, LogOut, Menu, X, ChevronRight, ShieldCheck,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

const NAV_ALL = [
  { to: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard',     adminOnly: false },
  { to: '/app/lockers',   icon: Lock,             label: 'Lockers',       adminOnly: false },
  { to: '/app/clients',   icon: Users,            label: 'Clientes',      adminOnly: false },
  { to: '/app/rentals',   icon: FileText,         label: 'Alquileres',    adminOnly: false },
  { to: '/app/reports',   icon: BarChart3,        label: 'Reportes',      adminOnly: true  },
  { to: '/app/settings',  icon: Settings,         label: 'Configuración', adminOnly: true  },
]

export function Sidebar() {
  const { gym, rol, signOut } = useAuthStore()
  const navigate = useNavigate()
  const [collapsed,   setCollapsed]   = useState(false)
  const [mobileOpen,  setMobileOpen]  = useState(false)

  const isAdmin = rol === 'admin'
  const nav = NAV_ALL.filter((n) => !n.adminOnly || isAdmin)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => {
    const show = !collapsed || mobile
    return (
      <div className="flex flex-col h-full">

        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5"
          style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)', boxShadow: '0 0 16px rgba(99,102,241,0.35)' }}>
            <Lock size={17} color="white" />
          </div>
          <AnimatePresence>
            {show && (
              <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.15 }} className="min-w-0">
                <p className="text-sm font-extrabold text-white leading-tight">Locker Manager</p>
                <p className="text-xs truncate max-w-[130px]" style={{ color: 'var(--color-text-muted)' }}>
                  {gym?.nombre || 'Mi Gimnasio'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Badge de rol */}
        <AnimatePresence>
          {show && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="mx-3 mt-3 mb-1 px-3 py-2 rounded-xl flex items-center gap-2"
              style={{
                background: isAdmin ? 'rgba(59,130,246,0.1)' : 'rgba(16,185,129,0.1)',
                border: `1px solid ${isAdmin ? 'rgba(59,130,246,0.25)' : 'rgba(16,185,129,0.25)'}`,
              }}>
              <ShieldCheck size={14} style={{ color: isAdmin ? '#60a5fa' : '#10b981', flexShrink: 0 }} />
              <span className="text-xs font-bold" style={{ color: isAdmin ? '#60a5fa' : '#10b981' }}>
                {isAdmin ? 'Administrador' : 'Empleado'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Nav */}
        <nav className="flex-1 p-2.5 space-y-0.5 overflow-y-auto">
          {nav.map(({ to, icon: Icon, label, adminOnly }) => (
            <NavLink key={to} to={to} onClick={() => setMobileOpen(false)}>
              {({ isActive }) => (
                <motion.div
                  whileHover={{ x: collapsed && !mobile ? 0 : 4 }}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all relative overflow-hidden"
                  style={{
                    background: isActive ? 'rgba(59,130,246,0.16)' : 'transparent',
                    color: isActive ? '#60a5fa' : 'var(--color-text-secondary)',
                  }}
                  title={collapsed && !mobile ? label : undefined}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <motion.div layoutId="activeBar"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 rounded-r-full"
                      style={{ background: '#3b82f6' }}
                    />
                  )}

                  <Icon size={19} className="flex-shrink-0" />

                  <AnimatePresence>
                    {show && (
                      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }} className="text-sm font-semibold flex-1">
                        {label}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {/* Admin badge pequeño */}
                  {adminOnly && show && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}>
                      Admin
                    </span>
                  )}
                </motion.div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-2.5" style={{ borderTop: '1px solid var(--color-border)' }}>
          <button onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all group"
            style={{ color: 'var(--color-text-muted)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.1)'
              e.currentTarget.style.color = '#ef4444'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--color-text-muted)'
            }}
            title={collapsed && !mobile ? 'Cerrar sesión' : undefined}
          >
            <LogOut size={18} className="flex-shrink-0" />
            <AnimatePresence>
              {show && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-sm font-semibold">
                  Cerrar sesión
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Desktop */}
      <motion.aside
        animate={{ width: collapsed ? 68 : 236 }}
        transition={{ duration: 0.22, ease: 'easeInOut' }}
        className="hidden lg:flex flex-col flex-shrink-0 h-screen sticky top-0 overflow-hidden relative"
        style={{ background: 'var(--color-bg-secondary)', borderRight: '1px solid var(--color-border)' }}
      >
        <button onClick={() => setCollapsed(!collapsed)}
          className="absolute top-[18px] right-2.5 z-10 w-6 h-6 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(30,41,59,0.8)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
          <ChevronRight size={12} style={{
            transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)',
            transition: 'transform 0.22s ease',
          }} />
        </button>
        <SidebarContent />
      </motion.aside>

      {/* Mobile toggle */}
      <button onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
        style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
        <Menu size={20} style={{ color: 'var(--color-text-secondary)' }} />
      </button>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 lg:hidden" style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
              onClick={() => setMobileOpen(false)} />
            <motion.aside
              initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              className="fixed top-0 left-0 h-full w-60 z-50 lg:hidden"
              style={{ background: 'var(--color-bg-secondary)', borderRight: '1px solid var(--color-border)' }}>
              <button onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4" style={{ color: 'var(--color-text-muted)' }}>
                <X size={20} />
              </button>
              <SidebarContent mobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
