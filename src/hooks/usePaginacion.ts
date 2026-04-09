'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export interface RespuestaPaginada<T> {
  items: T[]
  total: number
  page: number
  limit: number
}

interface Opciones<T, F> {
  /** Función que consume los filtros y retorna la respuesta paginada del backend. */
  fetcher: (params: { page: number; limit: number } & F) => Promise<RespuestaPaginada<T>>
  /** Filtros iniciales (además de page/limit). Cambios en este objeto resetean a página 1. */
  filtros: F
  /** Tamaño inicial de página (default 50). */
  limitInicial?: number
  /** Debounce en ms para refetch cuando cambian filtros (default 300). */
  debounceMs?: number
}

/**
 * Hook genérico para listados paginados servidor-side.
 *
 * - Dispara el fetcher al montar y cada vez que cambien `filtros`, `page` o `limit`.
 * - Aplica debounce a los cambios de filtros (útil para campos de búsqueda).
 * - Resetea a página 1 al cambiar filtros.
 * - `refetch()` re-ejecuta con los valores actuales (para después de crear/editar/eliminar).
 */
export function usePaginacion<T, F extends Record<string, unknown>>({
  fetcher,
  filtros,
  limitInicial = 50,
  debounceMs = 300,
}: Opciones<T, F>) {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(limitInicial)
  const [items, setItems] = useState<T[]>([])
  const [total, setTotal] = useState(0)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Serializamos filtros para comparar por valor (evita ref re-renders).
  const filtrosKey = JSON.stringify(filtros)
  const filtrosKeyPrev = useRef(filtrosKey)

  const ejecutar = useCallback(async (p: number, l: number, f: F) => {
    setCargando(true)
    setError(null)
    try {
      const res = await fetcher({ page: p, limit: l, ...f })
      setItems(res.items)
      setTotal(res.total)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar')
      setItems([])
      setTotal(0)
    } finally {
      setCargando(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher])

  // Resetear a página 1 cuando cambian los filtros (comparando por valor).
  useEffect(() => {
    if (filtrosKey !== filtrosKeyPrev.current) {
      filtrosKeyPrev.current = filtrosKey
      if (page !== 1) {
        setPage(1)
        return   // el cambio de page dispara otro efecto
      }
    }
    const t = setTimeout(() => ejecutar(page, limit, filtros), debounceMs)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtrosKey, page, limit])

  const refetch = useCallback(() => ejecutar(page, limit, filtros), [ejecutar, page, limit, filtros])

  return {
    items, total, page, limit, cargando, error,
    setPage, setLimit, refetch,
  }
}
