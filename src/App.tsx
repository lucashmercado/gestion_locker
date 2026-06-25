import { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuthStore, type UserRol } from '@/store/authStore'
import { AppLayout } from '@/components/layout/AppLayout'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ConfirmProvider } from '@/components/ConfirmDialog'
import { Loader2 } from 'lucide-react'

// ── Lazy-loaded pages (code splitting) ──────────────────────
const Landing   = lazy(() => import('@/pages/Landing'))
const Login     = lazy(() => import('@/pages/Login'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Lockers   = lazy(() => import('@/pages/Lockers'))
const Rentals   = lazy(() => import('@/pages/Rentals'))
const Clients   = lazy(() => import('@/pages/Clients'))
const Reports   = lazy(() => import('@/pages/Reports'))
const Settings  = lazy(() => import('@/pages/Settings'))

// ── Pantalla de carga ────────────────────────────────────────
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center flex-col gap-4"
      style={{ background: 'var(--color-bg-primary)' }}>
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)', boxShadow: '0 0 24px rgba(99,102,241,0.4)' }}>
        <Loader2 size={26} color="white" className="animate-spin" />
      </div>
      <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Cargando…</p>
    </div>
  )
}

// ── Transición de página ─────────────────────────────────────
function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

// ── Ruta protegida ───────────────────────────────────────────
function ProtectedRoute({
  children, requiredRol,
}: { children: React.ReactNode; requiredRol?: UserRol }) {
  const { user, rol, loading } = useAuthStore()

  if (loading) return <PageLoader />

  if (!user) return <Navigate to="/login" replace />

  // Verificar rol requerido
  if (requiredRol && rol && rol !== requiredRol) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] flex-col gap-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)' }}>
          <span style={{ fontSize: 28 }}>🔒</span>
        </div>
        <h2 className="text-xl font-bold text-white">Acceso restringido</h2>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Necesitás rol de <strong className="text-white">{requiredRol}</strong> para ver esta sección.
        </p>
        <Navigate to="/app/dashboard" replace />
      </div>
    )
  }

  return <>{children}</>
}

// ── Router interno ───────────────────────────────────────────
function AppRoutes() {
  return (
    <PageTransition>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Públicas */}
          <Route path="/"      element={<Landing />} />
          <Route path="/login" element={<Login />}   />

          {/* Protegidas */}
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="lockers"   element={<Lockers />}   />
            <Route path="rentals"   element={<Rentals />}   />
            <Route path="clients"   element={<Clients />}   />

            {/* Solo admin */}
            <Route path="reports"  element={<ProtectedRoute requiredRol="admin"><Reports /></ProtectedRoute>} />
            <Route path="settings" element={<ProtectedRoute requiredRol="admin"><Settings /></ProtectedRoute>} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </PageTransition>
  )
}

// ── App raíz ─────────────────────────────────────────────────
export default function App() {
  const { initialize } = useAuthStore()

  useEffect(() => { initialize() }, [])

  return (
    <ErrorBoundary>
      <ConfirmProvider>
        <BrowserRouter>
          {/* Toast container — posicionado arriba a la derecha */}
          <Toaster
            position="top-right"
            gutter={8}
            toastOptions={{ duration: 4000 }}
          />
          <AppRoutes />
        </BrowserRouter>
      </ConfirmProvider>
    </ErrorBoundary>
  )
}
