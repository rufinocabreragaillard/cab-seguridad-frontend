'use client'

import { type ReactNode } from 'react'
import { Plus, Download, Search } from 'lucide-react'
import { Boton } from '@/components/ui/boton'
import { Input } from '@/components/ui/input'
import { exportarExcel, type ColumnaExport } from '@/lib/exportar-excel'

interface BarraHerramientasProps {
  busqueda: string
  onBusqueda: (valor: string) => void
  placeholderBusqueda?: string
  onNuevo?: () => void
  textoNuevo?: string
  /** Datos y columnas para exportar a Excel */
  excelDatos?: Record<string, unknown>[]
  excelColumnas?: ColumnaExport[]
  excelNombreArchivo?: string
  /** Elementos adicionales entre Excel y Nuevo */
  extra?: ReactNode
}

export function BarraHerramientas({
  busqueda,
  onBusqueda,
  placeholderBusqueda = 'Buscar...',
  onNuevo,
  textoNuevo = 'Nuevo',
  excelDatos,
  excelColumnas,
  excelNombreArchivo = 'datos',
  extra,
}: BarraHerramientasProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="max-w-sm flex-1">
        <Input
          placeholder={placeholderBusqueda}
          value={busqueda}
          onChange={(e) => onBusqueda(e.target.value)}
          icono={<Search size={15} />}
        />
      </div>
      <div className="flex gap-2 ml-auto">
        {excelDatos && excelColumnas && (
          <Boton
            variante="contorno"
            tamano="sm"
            onClick={() => exportarExcel(excelDatos, excelColumnas, excelNombreArchivo)}
            disabled={excelDatos.length === 0}
          >
            <Download size={15} />
            Excel
          </Boton>
        )}
        {extra}
        {onNuevo && (
          <Boton variante="primario" onClick={onNuevo}>
            <Plus size={16} />
            {textoNuevo}
          </Boton>
        )}
      </div>
    </div>
  )
}
