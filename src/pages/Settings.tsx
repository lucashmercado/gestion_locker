import { useState } from 'react'
import { motion } from 'framer-motion'
import { Building2, Bell, Lock, DollarSign, Shield, Save, Check } from 'lucide-react'

export default function Settings() {
  const [gymName, setGymName] = useState('Mi Gimnasio')
  const [gymAddress, setGymAddress] = useState('')
  const [gymPhone, setGymPhone] = useState('')
  const [priceSmall, setPriceSmall] = useState(5000)
  const [priceMedium, setPriceMedium] = useState(6000)
  const [priceLarge, setPriceLarge] = useState(8000)
  const [alertDays, setAlertDays] = useState(7)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const Section = ({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card space-y-4"
    >
      <div className="flex items-center gap-3 pb-2" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa' }}>
          <Icon size={18} />
        </div>
        <h2 className="font-semibold text-white">{title}</h2>
      </div>
      {children}
    </motion.div>
  )

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Configuración</h1>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Personalizá tu gimnasio y preferencias</p>
      </div>

      <Section icon={Building2} title="Información del gimnasio">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Nombre del gimnasio</label>
            <input className="input-field" value={gymName} onChange={(e) => setGymName(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Dirección</label>
            <input className="input-field" placeholder="Av. Ejemplo 1234" value={gymAddress}
              onChange={(e) => setGymAddress(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Teléfono</label>
            <input className="input-field" placeholder="11-1234-5678" value={gymPhone}
              onChange={(e) => setGymPhone(e.target.value)} />
          </div>
        </div>
      </Section>

      <Section icon={DollarSign} title="Precios base de alquiler">
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Estos precios se usan como sugerencia al crear nuevos alquileres.
        </p>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Locker pequeño', value: priceSmall, setter: setPriceSmall },
            { label: 'Locker mediano', value: priceMedium, setter: setPriceMedium },
            { label: 'Locker grande', value: priceLarge, setter: setPriceLarge },
          ].map(({ label, value, setter }) => (
            <div key={label}>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>{label}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--color-text-muted)' }}>$</span>
                <input type="number" min={0} className="input-field pl-7" value={value}
                  onChange={(e) => setter(Number(e.target.value))} />
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section icon={Bell} title="Alertas de vencimiento">
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
            Alertar cuando faltan (días)
          </label>
          <input type="number" min={1} max={30} className="input-field w-32" value={alertDays}
            onChange={(e) => setAlertDays(Number(e.target.value))} />
          <p className="text-xs mt-1.5" style={{ color: 'var(--color-text-muted)' }}>
            Recibirás alertas de vencimiento {alertDays} días antes.
          </p>
        </div>
      </Section>

      <Section icon={Shield} title="Seguridad">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Nueva contraseña</label>
            <input type="password" className="input-field" placeholder="••••••••" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Confirmar contraseña</label>
            <input type="password" className="input-field" placeholder="••••••••" />
          </div>
        </div>
      </Section>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleSave}
        className={`btn-primary px-8 py-3 ${saved ? 'bg-green-600' : ''}`}
        style={saved ? { background: 'linear-gradient(135deg, #059669, #047857)' } : {}}
      >
        {saved ? <Check size={18} /> : <Save size={18} />}
        {saved ? '¡Guardado!' : 'Guardar cambios'}
      </motion.button>
    </div>
  )
}
