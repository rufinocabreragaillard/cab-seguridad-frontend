'use client'

import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { tema as temaDefault } from '@/config/tema.config'

interface ThemeContextType {
  tema: Record<string, unknown> | null
  logo: { url: string; alt: string; ancho: number; alto: number }
  appNombre: string
  appNombreCorto: string
}

const ThemeContext = createContext<ThemeContextType>({
  tema: null,
  logo: temaDefault.logo,
  appNombre: temaDefault.app.nombre,
  appNombreCorto: temaDefault.app.nombreCorto,
})

/**
 * Mapeo de claves del JSON de tema a nombres de CSS custom properties.
 * Las claves en la BD usan guion bajo (primario_hover),
 * las CSS variables usan guion medio (--color-primario-hover).
 */
function aplicarColores(colores: Record<string, string>) {
  const root = document.documentElement
  Object.entries(colores).forEach(([key, value]) => {
    const cssVar = `--color-${key.replace(/_/g, '-')}`
    root.style.setProperty(cssVar, value)
  })
}

function limpiarColores(colores: Record<string, string>) {
  const root = document.documentElement
  Object.keys(colores).forEach((key) => {
    const cssVar = `--color-${key.replace(/_/g, '-')}`
    root.style.removeProperty(cssVar)
  })
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { usuario } = useAuth()

  useEffect(() => {
    const colores = (usuario?.tema as { colores?: Record<string, string> })?.colores
    if (!colores) return

    aplicarColores(colores)

    return () => {
      limpiarColores(colores)
    }
  }, [usuario?.tema])

  // Extraer logo y nombre desde el tema del grupo, con fallback al tema por defecto
  const temaGrupo = usuario?.tema as {
    logo?: { url: string; alt: string; ancho: number; alto: number }
    app?: { nombre: string; nombre_corto: string }
  } | null

  const logo = temaGrupo?.logo ?? temaDefault.logo
  const appNombre = temaGrupo?.app?.nombre ?? temaDefault.app.nombre
  const appNombreCorto = temaGrupo?.app?.nombre_corto ?? temaDefault.app.nombreCorto

  return (
    <ThemeContext.Provider value={{ tema: usuario?.tema ?? null, logo, appNombre, appNombreCorto }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTema() {
  return useContext(ThemeContext)
}
