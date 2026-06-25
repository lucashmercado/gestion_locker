import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// @ts-ignore
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { createRequire } from 'node:module'

// Resuelve rutas de módulos de manera portable (local + Netlify CI)
const require = createRequire(import.meta.url)

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // Alias explícito de react-is para solucionar el bug de Rolldown (Vite 8)
      // donde no puede resolver peer deps desde dentro de node_modules/recharts/es6/
      'react-is': require.resolve('react-is'),
    },
  },

  build: {
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          if (id.includes('node_modules/three') || id.includes('@react-three')) return 'vendor-three'
          if (id.includes('node_modules/framer-motion'))                        return 'vendor-motion'
          if (
            id.includes('node_modules/recharts') ||
            id.includes('node_modules/react-is') ||
            id.includes('node_modules/d3-')
          ) return 'vendor-charts'
          if (id.includes('node_modules/react-router'))    return 'vendor-react'
          if (id.includes('node_modules/react-dom'))       return 'vendor-react'
          if (id.includes('node_modules/react-hot-toast')) return 'vendor-utils'
          if (id.includes('node_modules/zustand'))         return 'vendor-utils'
          if (id.includes('node_modules/date-fns'))        return 'vendor-utils'
          if (id.includes('node_modules/react'))           return 'vendor-react'
        },
      },
    },
    chunkSizeWarningLimit: 1100,
    target: 'esnext',
    sourcemap: false,
  },

  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-is',
      'react-router-dom',
      'framer-motion',
      'zustand',
      'zustand/middleware',
      'react-hot-toast',
      'date-fns',
      'recharts',
    ],
    exclude: ['@react-three/fiber', '@react-three/drei', 'three'],
  },
})
