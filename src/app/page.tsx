'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export default function PaginaRaiz() {
  const router = useRouter()
  const { usuario, cargando } = useAuth()

  useEffect(() => {
    if (cargando) return
    if (usuario) {
      router.replace(usuario.url_inicio || '/dashboard')
    } else {
      router.replace('/login')
    }
  }, [usuario, cargando, router])

  // Mostrar pantalla de carga mientras se verifica la sesión
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-500">Iniciando sesión…</p>
    </div>
  )
}
