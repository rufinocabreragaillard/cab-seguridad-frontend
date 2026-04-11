import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Obtiene el token JWT de la sesión activa de Supabase.
 * Usa getUser() en lugar de getSession() para forzar validación con el servidor
 * y renovar el token si está expirado o próximo a expirar.
 * Se deduplica para evitar múltiples llamadas concurrentes (N_CONCURRENTE=6)
 * que causaban deadlocks en el lock de Supabase Auth.
 */
let _tokenPromise: Promise<string | null> | null = null

export async function obtenerToken(): Promise<string | null> {
  if (!_tokenPromise) {
    _tokenPromise = (async () => {
      // getSession() puede devolver token expirado sin renovar.
      // Primero intentar con la sesión local; si el token está por expirar
      // (<5 min), forzar refresh.
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return null
      const expira = session.expires_at ?? 0
      const ahora = Math.floor(Date.now() / 1000)
      const minutosRestantes = (expira - ahora) / 60
      if (minutosRestantes < 5) {
        // Token expirado o próximo a expirar — renovar
        const { data: { session: nueva } } = await supabase.auth.refreshSession()
        return nueva?.access_token ?? null
      }
      return session.access_token
    })().finally(() => { _tokenPromise = null })
  }
  return _tokenPromise
}
