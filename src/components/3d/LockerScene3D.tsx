import { useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame, type ThreeElements } from '@react-three/fiber'
import { Float, MeshTransmissionMaterial, Environment, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'

// ─── Locker 3D individual ─────────────────────────────────────
function Locker3D({
  position,
  color,
  delay = 0,
  occupied = false,
}: {
  position: [number, number, number]
  color: string
  delay?: number
  occupied?: boolean
}) {
  const meshRef  = useRef<THREE.Mesh>(null!)
  const doorRef  = useRef<THREE.Mesh>(null!)
  const glowRef  = useRef<THREE.PointLight>(null!)
  const t        = useRef(delay)

  const col = useMemo(() => new THREE.Color(color), [color])

  useFrame((_, delta) => {
    t.current += delta
    // Respiración suave
    const breath = Math.sin(t.current * 0.8 + delay) * 0.015
    if (meshRef.current) {
      meshRef.current.scale.y = 1 + breath
    }
    // Glow pulsante
    if (glowRef.current) {
      glowRef.current.intensity = 0.6 + Math.sin(t.current * 1.2 + delay) * 0.3
    }
    // Puerta ligeramente abierta para lockers libres
    if (doorRef.current && !occupied) {
      doorRef.current.rotation.y = Math.sin(t.current * 0.5 + delay) * 0.08 - 0.05
    }
  })

  return (
    <group position={position}>
      {/* Cuerpo del locker */}
      <mesh ref={meshRef}>
        <boxGeometry args={[0.7, 1.1, 0.5]} />
        <meshStandardMaterial
          color={col}
          metalness={0.7}
          roughness={0.25}
          emissive={col}
          emissiveIntensity={occupied ? 0.05 : 0.12}
        />
      </mesh>

      {/* Puerta */}
      <mesh ref={doorRef} position={[0, 0, 0.26]}>
        <boxGeometry args={[0.65, 1.04, 0.04]} />
        <meshStandardMaterial
          color={col}
          metalness={0.85}
          roughness={0.15}
          emissive={col}
          emissiveIntensity={0.08}
        />
      </mesh>

      {/* Handle */}
      <mesh position={[0.18, 0.05, 0.3]}>
        <cylinderGeometry args={[0.02, 0.02, 0.18, 8]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.95} roughness={0.05} />
      </mesh>

      {/* Ventilación — ranuras */}
      {[-0.3, -0.1, 0.1, 0.3].map((y, i) => (
        <mesh key={i} position={[0, y, 0.285]}>
          <boxGeometry args={[0.4, 0.02, 0.01]} />
          <meshStandardMaterial color="#000" opacity={0.6} transparent />
        </mesh>
      ))}

      {/* Número */}
      <mesh position={[0, 0.38, 0.3]}>
        <planeGeometry args={[0.22, 0.14]} />
        <meshStandardMaterial color="#111" metalness={0.5} />
      </mesh>

      {/* Glow light */}
      <pointLight ref={glowRef} color={col} intensity={0.7} distance={1.4} />
    </group>
  )
}

// ─── Grid de lockers ──────────────────────────────────────────
function LockerGrid() {
  const groupRef = useRef<THREE.Group>(null!)

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.15) * 0.15
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.08) * 0.04
    }
  })

  const lockers = useMemo(() => {
    const items = []
    const cols = 5, rows = 3
    const COLORS = ['#10b981', '#10b981', '#3b82f6', '#f59e0b', '#10b981', '#3b82f6']
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c
        items.push({
          position: [(c - (cols - 1) / 2) * 0.95, (r - (rows - 1) / 2) * 1.3, 0] as [number, number, number],
          color: COLORS[idx % COLORS.length],
          delay: idx * 0.3,
          occupied: COLORS[idx % COLORS.length] !== '#10b981',
        })
      }
    }
    return items
  }, [])

  return (
    <group ref={groupRef}>
      {lockers.map((l, i) => (
        <Float key={i} speed={1.2} rotationIntensity={0.04} floatIntensity={0.08} floatingRange={[-0.02, 0.02]}>
          <Locker3D {...l} />
        </Float>
      ))}
    </group>
  )
}

// ─── Partículas de fondo ──────────────────────────────────────
function Particles({ count = 80 }) {
  const mesh = useRef<THREE.InstancedMesh>(null!)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const speeds = useMemo(() => Float32Array.from({ length: count }, () => 0.2 + Math.random() * 0.6), [count])
  const positions = useMemo(() =>
    Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 14,
      y: (Math.random() - 0.5) * 8,
      z: (Math.random() - 0.5) * 8 - 3,
      phase: Math.random() * Math.PI * 2,
    })), [count])

  useFrame((state) => {
    positions.forEach((p, i) => {
      dummy.position.set(
        p.x + Math.sin(state.clock.elapsedTime * speeds[i] + p.phase) * 0.3,
        p.y + Math.cos(state.clock.elapsedTime * speeds[i] * 0.7 + p.phase) * 0.2,
        p.z,
      )
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)
    })
    mesh.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.025, 4, 4]} />
      <meshBasicMaterial color="#3b82f6" opacity={0.4} transparent />
    </instancedMesh>
  )
}

// ─── Plano de suelo con reflejo ───────────────────────────────
function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.2, 0]} receiveShadow>
      <planeGeometry args={[20, 20]} />
      <meshStandardMaterial color="#080c14" metalness={0.8} roughness={0.2} />
    </mesh>
  )
}

// ─── Escena principal exportada ───────────────────────────────
export function LockerScene3D({ className = '' }: { className?: string }) {
  return (
    <div className={className} style={{ touchAction: 'none' }}>
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <PerspectiveCamera makeDefault position={[0, 0.5, 7]} fov={42} />

        {/* Ambiente */}
        <color attach="background" args={['#080c14']} />
        <fog attach="fog" args={['#080c14', 8, 18]} />
        <ambientLight intensity={0.3} />

        {/* Luces direccionales */}
        <directionalLight position={[4, 6, 3]}  intensity={1.2} color="#60a5fa" />
        <directionalLight position={[-4, 2, -2]} intensity={0.5} color="#a78bfa" />
        <pointLight       position={[0, 4, 2]}   intensity={0.8} color="#3b82f6" distance={10} />

        {/* Contenido */}
        <Suspense fallback={null}>
          <LockerGrid />
          <Particles count={60} />
          <Floor />
          <Environment preset="city" />
        </Suspense>
      </Canvas>
    </div>
  )
}
