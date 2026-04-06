'use client'

import { type ReactNode } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Tabla, TablaCabecera, TablaCuerpo, TablaFila, TablaTh, TablaTd } from '@/components/ui/tabla'
import { Insignia } from '@/components/ui/insignia'

export interface ColumnaDef<T> {
  titulo: string
  className?: string
  render: (item: T) => ReactNode
}

interface TablaCrudProps<T> {
  columnas: ColumnaDef<T>[]
  items: T[]
  cargando: boolean
  getId: (item: T) => string
  onEditar?: (item: T) => void
  onEliminar?: (item: T) => void
  textoVacio?: string
  /** Acciones extra por fila */
  accionesExtra?: (item: T) => ReactNode
}

export function TablaCrud<T>({
  columnas,
  items,
  cargando,
  getId,
  onEditar,
  onEliminar,
  textoVacio = 'No se encontraron registros',
  accionesExtra,
}: TablaCrudProps<T>) {
  const totalCols = columnas.length + (onEditar || onEliminar ? 1 : 0)

  return (
    <Tabla>
      <TablaCabecera>
        <tr>
          {columnas.map((col, i) => (
            <TablaTh key={i} className={col.className}>{col.titulo}</TablaTh>
          ))}
          {(onEditar || onEliminar) && <TablaTh className="text-right">Acciones</TablaTh>}
        </tr>
      </TablaCabecera>
      <TablaCuerpo>
        {cargando ? (
          <TablaFila>
            <TablaTd className="py-8 text-center text-texto-muted" colSpan={totalCols as never}>
              Cargando...
            </TablaTd>
          </TablaFila>
        ) : items.length === 0 ? (
          <TablaFila>
            <TablaTd className="py-8 text-center text-texto-muted" colSpan={totalCols as never}>
              {textoVacio}
            </TablaTd>
          </TablaFila>
        ) : (
          items.map((item) => (
            <TablaFila key={getId(item)}>
              {columnas.map((col, i) => (
                <TablaTd key={i} className={col.className}>
                  {col.render(item)}
                </TablaTd>
              ))}
              {(onEditar || onEliminar) && (
                <TablaTd>
                  <div className="flex items-center justify-end gap-1">
                    {accionesExtra?.(item)}
                    {onEditar && (
                      <button
                        onClick={() => onEditar(item)}
                        className="p-1.5 rounded-lg hover:bg-primario-muy-claro text-texto-muted hover:text-primario transition-colors"
                        title="Editar"
                      >
                        <Pencil size={14} />
                      </button>
                    )}
                    {onEliminar && (
                      <button
                        onClick={() => onEliminar(item)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-texto-muted hover:text-error transition-colors"
                        title="Desactivar"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </TablaTd>
              )}
            </TablaFila>
          ))
        )}
      </TablaCuerpo>
    </Tabla>
  )
}

/** Helper: columna de código (con badge mono) */
export function columnaCodigo<T>(titulo: string, getCodigo: (item: T) => string): ColumnaDef<T> {
  return {
    titulo,
    render: (item) => (
      <code className="text-xs bg-fondo px-2 py-1 rounded font-mono">{getCodigo(item)}</code>
    ),
  }
}

/** Helper: columna de texto con font-medium */
export function columnaNombre<T>(titulo: string, getNombre: (item: T) => string): ColumnaDef<T> {
  return {
    titulo,
    render: (item) => <span className="font-medium">{getNombre(item)}</span>,
  }
}

/** Helper: columna de descripción (truncada, muted) */
export function columnaDescripcion<T>(titulo: string, getDesc: (item: T) => string | null | undefined): ColumnaDef<T> {
  return {
    titulo,
    className: 'text-texto-muted text-sm max-w-[300px] truncate',
    render: (item) => <>{getDesc(item) || '\u2014'}</>,
  }
}

/** Helper: columna de estado activo/inactivo */
export function columnaEstado<T>(getActivo: (item: T) => boolean): ColumnaDef<T> {
  return {
    titulo: 'Estado',
    render: (item) => (
      <Insignia variante={getActivo(item) ? 'exito' : 'error'}>
        {getActivo(item) ? 'Activo' : 'Inactivo'}
      </Insignia>
    ),
  }
}
