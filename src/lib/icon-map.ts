/**
 * Mapeo dinámico de nombres de icono (string almacenado en BD) a componentes Lucide React.
 *
 * Usa el catálogo completo de lucide-react — cualquier nombre válido de Lucide
 * configurado en el mantenedor de funciones funcionará automáticamente sin
 * necesidad de agregarlo manualmente aquí.
 *
 * Referencia de iconos: https://lucide.dev/icons/
 */

import * as LucideIcons from 'lucide-react'
import { type LucideIcon, Circle } from 'lucide-react'

/**
 * Obtiene un componente de icono Lucide a partir de su nombre (string).
 * Busca en el catálogo completo de lucide-react.
 * Si el nombre no existe, retorna Circle como fallback.
 */
export function obtenerIcono(nombre: string | null | undefined): LucideIcon {
  if (!nombre) return Circle
  const icono = (LucideIcons as Record<string, unknown>)[nombre]
  if (typeof icono === 'function') return icono as LucideIcon
  return Circle
}

export type { LucideIcon }
