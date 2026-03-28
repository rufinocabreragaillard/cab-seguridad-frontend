'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { authApi } from '@/lib/api'
import type { UsuarioContexto } from '@/lib/tipos'

// Default 90 minutos — se sobreescribe con el parámetro del backend
const DEFAULT_INACTIVITY_TIMEOUT_MS = 90 * 60 * 1000

// Rutas que no requieren autenticación
const PUBLIC_ROUTES = ['/login', '/auth/callback']

interface AuthContextType {
  usuario: UsuarioContexto | null
  cargando: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  loginConGoogle: () => Promise<void>
  logout: () => Promise<void>
  cambiarEntidad: (codigoEntidad: string) => Promise<void>
  cambiarGrupo: (codigoGrupo: string) => Promise<void>
  tieneFuncion: (codigoFuncion: string) => boolean
  esAdmin: () => boolean
  esSuperAdmin: () => boolean
  entidadActiva: string | null
  grupoActivo: string | null
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioContexto | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  const cargarContexto = useCallback(async () => {
    try {
      const ctx = await authApi.yo()
      setUsuario(ctx)
      return ctx
    } catch {
      setUsuario(null)
      return null
    }
  }, [])

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname)

  // Escucha cambios de sesión de Supabase (login, logout, OAuth callback, token refresh)
  useEffect(() => {
    let isMounted = true

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return

        if (session) {
          // Hay sesión válida — cargar contexto del backend
          const ctx = await cargarContexto()
          if (isMounted) {
            setCargando(false)
            // Solo redirigir al dashboard en login explícito, no en refresh/token_refresh
            if (ctx && event === 'SIGNED_IN') {
              router.push(ctx.url_inicio || '/dashboard')
            }
          }
        } else {
          // No hay sesión
          setUsuario(null)
          if (isMounted) {
            setCargando(false)
            if (!isPublicRoute) {
              router.push('/login')
            }
          }
        }
      }
    )

    // Carga inicial: verificar si hay sesión existente (persiste en localStorage)
    supabase.auth.getSession().then(async ({ data }) => {
      if (!isMounted) return

      if (data.session) {
        // Sesión existente (refresh de página) — cargar contexto
        await cargarContexto()
      } else {
        // Sin sesión — redirigir a login si está en ruta protegida
        setUsuario(null)
        if (!isPublicRoute) {
          router.push('/login')
        }
      }
      if (isMounted) setCargando(false)
    }).catch(() => {
      if (isMounted) {
        setCargando(false)
        if (!isPublicRoute) router.push('/login')
      }
    })

    return () => {
      isMounted = false
      listener.subscription.unsubscribe()
    }
  }, [cargarContexto, router, isPublicRoute])

  // Timeout de inactividad: usa la duración configurada desde el backend
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!usuario) return

    const timeoutMs = (usuario.sesion_duracion_minutos ?? 90) * 60 * 1000

    const resetTimer = () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
      inactivityTimer.current = setTimeout(() => {
        logout()
      }, timeoutMs)
    }

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
    events.forEach((e) => window.addEventListener(e, resetTimer))
    resetTimer()

    return () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
      events.forEach((e) => window.removeEventListener(e, resetTimer))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario])

  const login = async (email: string, password: string) => {
    setError(null)
    setCargando(true)
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) throw new Error(err.message)
      // onAuthStateChange maneja la redirección
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al iniciar sesión')
      setCargando(false)
      throw e
    }
  }

  const loginConGoogle = async () => {
    setError(null)
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (err) {
      setError(err.message)
      throw new Error(err.message)
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUsuario(null)
    router.push('/login')
  }

  const cambiarEntidad = async (codigoEntidad: string) => {
    try {
      const ctx = await authApi.cambiarEntidad(codigoEntidad)
      setUsuario(ctx)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cambiar entidad')
      throw e
    }
  }

  const cambiarGrupo = async (codigoGrupo: string) => {
    try {
      const ctx = await authApi.cambiarGrupo(codigoGrupo)
      setUsuario(ctx)
      // Refrescar la página actual para que los datos se recarguen con el nuevo grupo
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cambiar grupo')
      throw e
    }
  }

  const tieneFuncion = (codigoFuncion: string) =>
    usuario?.funciones?.includes(codigoFuncion) ?? false

  const esAdmin = () =>
    usuario?.roles?.includes('ADMIN') || usuario?.rol_principal === 'ADMIN' ? true : false

  const esSuperAdmin = () =>
    usuario?.grupos?.some((g) => g.codigo_grupo === 'ADMIN') ?? false

  const entidadActiva = usuario?.entidad_activa ?? null
  const grupoActivo = usuario?.grupo_activo ?? null

  return (
    <AuthContext.Provider
      value={{
        usuario, cargando, error, login, loginConGoogle, logout,
        cambiarEntidad, cambiarGrupo, tieneFuncion, esAdmin, esSuperAdmin,
        entidadActiva, grupoActivo,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
