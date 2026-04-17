'use client'

import { MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BotonChatProps {
  className?: string
  titulo?: string
}

/**
 * Botón de Chat deshabilitado para la esquina superior derecha de las páginas.
 * Queda visible pero no interactivo (se habilitará cuando esté la funcionalidad).
 */
export function BotonChat({ className, titulo = 'Chat (próximamente)' }: BotonChatProps) {
  return (
    <button
      type="button"
      disabled
      title={titulo}
      aria-label={titulo}
      className={cn(
        'absolute top-0 right-0 z-10 inline-flex items-center gap-2 rounded-lg border border-borde bg-surface px-3 py-2 text-sm font-medium text-texto-muted opacity-60 cursor-not-allowed',
        className,
      )}
    >
      <MessageSquare size={16} />
      <span>Chat</span>
    </button>
  )
}
