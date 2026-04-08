'use client'

import { useCallback, useEffect, useState } from 'react'
import { Download, Loader2, RefreshCw } from 'lucide-react'
import { Boton } from '@/components/ui/boton'
import { Input } from '@/components/ui/input'
import { Insignia } from '@/components/ui/insignia'
import {
  Tabla,
  TablaCabecera,
  TablaCuerpo,
  TablaFila,
  TablaTd,
  TablaTh,
} from '@/components/ui/tabla'
import {
  llmUsoApi,
  type LLMUsoFila,
  type LLMUsoResumen,
} from '@/lib/api'
import { exportarExcel } from '@/lib/exportar-excel'
import { useAuth } from '@/context/AuthContext'

function fmtUsd(n: number | undefined | null) {
  return `$${(Number(n) || 0).toFixed(4)}`
}

function fmtInt(n: number | undefined | null) {
  return (Number(n) || 0).toLocaleString('es-CL')
}

export default function PaginaLLMUso() {
  const { grupoActivo } = useAuth()

  const [resumen, setResumen] = useState<LLMUsoResumen | null>(null)
  const [filas, setFilas] = useState<LLMUsoFila[]>([])
  const [cargando, setCargando] = useState(true)

  const [filtros, setFiltros] = useState({
    desde: '',
    hasta: '',
    proveedor: '',
    modelo: '',
    codigo_usuario: '',
  })

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const [r, f] = await Promise.all([
        llmUsoApi.resumen(),
        llmUsoApi.listar({
          desde: filtros.desde || undefined,
          hasta: filtros.hasta || undefined,
          proveedor: filtros.proveedor || undefined,
          modelo: filtros.modelo || undefined,
          codigo_usuario: filtros.codigo_usuario || undefined,
          limit: 500,
        }),
      ])
      setResumen(r)
      setFilas(f)
    } finally {
      setCargando(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grupoActivo])

  useEffect(() => {
    cargar()
  }, [cargar])

  const aplicarFiltros = () => {
    cargar()
  }

  const exportar = () => {
    exportarExcel(
      filas as unknown as Record<string, unknown>[],
      [
        { titulo: 'Fecha', campo: 'created_at' },
        { titulo: 'Proveedor', campo: 'proveedor' },
        { titulo: 'Modelo', campo: 'modelo' },
        { titulo: 'Alias', campo: 'alias_credencial' },
        { titulo: 'Key casa', campo: 'uso_key_casa', formato: (v) => (v ? 'SI' : 'NO') },
        { titulo: 'Usuario', campo: 'codigo_usuario' },
        { titulo: 'Función', campo: 'codigo_funcion' },
        { titulo: 'Operación', campo: 'operacion' },
        { titulo: 'Tokens in', campo: 'tokens_input' },
        { titulo: 'Tokens out', campo: 'tokens_output' },
        { titulo: 'Costo USD', campo: 'costo_estimado_usd' },
        { titulo: 'Éxito', campo: 'exito', formato: (v) => (v ? 'SI' : 'NO') },
      ],
      `uso-llm-${grupoActivo}-${new Date().toISOString().slice(0, 10)}`,
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Uso LLM</h1>
          <p className="text-sm text-gray-600">
            Consumo de modelos LLM del grupo <strong>{grupoActivo}</strong>.
          </p>
        </div>
        <div className="flex gap-2">
          <Boton variante="contorno" onClick={cargar}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refrescar
          </Boton>
          <Boton variante="contorno" onClick={exportar}>
            <Download className="w-4 h-4 mr-1" />
            Exportar
          </Boton>
        </div>
      </div>

      {/* Tarjetas resumen */}
      {resumen && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-xs text-gray-500 uppercase">Mes actual</div>
            <div className="text-2xl font-semibold text-[#074B91] mt-1">{resumen.mes}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-xs text-gray-500 uppercase">Llamadas</div>
            <div className="text-2xl font-semibold text-gray-900 mt-1">
              {fmtInt(resumen.total_llamadas)}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-xs text-gray-500 uppercase">Costo total</div>
            <div className="text-2xl font-semibold text-gray-900 mt-1">
              {fmtUsd(resumen.total_costo_usd)}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-xs text-gray-500 uppercase">Key casa / grupo</div>
            <div className="text-sm font-medium text-gray-900 mt-2">
              <span className="text-amber-600">{fmtUsd(resumen.costo_key_casa_usd)}</span>{' '}
              /{' '}
              <span className="text-green-600">{fmtUsd(resumen.costo_key_grupo_usd)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Desglose por modelo y usuario */}
      {resumen && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Por modelo</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs uppercase border-b">
                  <th className="text-left py-1">Modelo</th>
                  <th className="text-right py-1">Llamadas</th>
                  <th className="text-right py-1">Tokens in</th>
                  <th className="text-right py-1">Tokens out</th>
                  <th className="text-right py-1">Costo</th>
                </tr>
              </thead>
              <tbody>
                {resumen.por_modelo.map((m) => (
                  <tr key={m.clave} className="border-b last:border-0">
                    <td className="py-2 font-mono text-xs">{m.clave}</td>
                    <td className="text-right">{fmtInt(m.llamadas)}</td>
                    <td className="text-right">{fmtInt(m.tokens_input)}</td>
                    <td className="text-right">{fmtInt(m.tokens_output)}</td>
                    <td className="text-right font-medium">{fmtUsd(m.costo_usd)}</td>
                  </tr>
                ))}
                {resumen.por_modelo.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-gray-400">
                      Sin datos este mes
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Por usuario</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs uppercase border-b">
                  <th className="text-left py-1">Usuario</th>
                  <th className="text-right py-1">Llamadas</th>
                  <th className="text-right py-1">Costo</th>
                </tr>
              </thead>
              <tbody>
                {resumen.por_usuario.map((u) => (
                  <tr key={u.clave} className="border-b last:border-0">
                    <td className="py-2 text-xs">{u.clave}</td>
                    <td className="text-right">{fmtInt(u.llamadas)}</td>
                    <td className="text-right font-medium">{fmtUsd(u.costo_usd)}</td>
                  </tr>
                ))}
                {resumen.por_usuario.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-gray-400">
                      Sin datos este mes
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Filtros detalle */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Detalle de llamadas</h3>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-3">
          <Input
            type="date"
            value={filtros.desde}
            onChange={(e) => setFiltros({ ...filtros, desde: e.target.value })}
            placeholder="Desde"
          />
          <Input
            type="date"
            value={filtros.hasta}
            onChange={(e) => setFiltros({ ...filtros, hasta: e.target.value })}
            placeholder="Hasta"
          />
          <select
            value={filtros.proveedor}
            onChange={(e) => setFiltros({ ...filtros, proveedor: e.target.value })}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          >
            <option value="">Todos proveedores</option>
            <option value="anthropic">Anthropic</option>
            <option value="google">Google</option>
          </select>
          <Input
            placeholder="Modelo"
            value={filtros.modelo}
            onChange={(e) => setFiltros({ ...filtros, modelo: e.target.value })}
          />
          <Input
            placeholder="Usuario"
            value={filtros.codigo_usuario}
            onChange={(e) => setFiltros({ ...filtros, codigo_usuario: e.target.value })}
          />
          <Boton onClick={aplicarFiltros}>Aplicar</Boton>
        </div>

        {cargando ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        ) : (
          <Tabla>
            <TablaCabecera>
              <TablaFila>
                <TablaTh>Fecha</TablaTh>
                <TablaTh>Proveedor</TablaTh>
                <TablaTh>Modelo</TablaTh>
                <TablaTh>Key</TablaTh>
                <TablaTh>Usuario</TablaTh>
                <TablaTh>Función</TablaTh>
                <TablaTh className="text-right">Tok in</TablaTh>
                <TablaTh className="text-right">Tok out</TablaTh>
                <TablaTh className="text-right">Costo</TablaTh>
                <TablaTh>Estado</TablaTh>
              </TablaFila>
            </TablaCabecera>
            <TablaCuerpo>
              {filas.map((f) => (
                <TablaFila key={f.id}>
                  <TablaTd className="text-xs">
                    {new Date(f.created_at).toLocaleString('es-CL')}
                  </TablaTd>
                  <TablaTd className="capitalize">{f.proveedor}</TablaTd>
                  <TablaTd className="font-mono text-xs">{f.modelo}</TablaTd>
                  <TablaTd>
                    {f.uso_key_casa ? (
                      <Insignia variante="advertencia">Casa</Insignia>
                    ) : (
                      <Insignia variante="exito">{f.alias_credencial}</Insignia>
                    )}
                  </TablaTd>
                  <TablaTd className="text-xs">{f.codigo_usuario}</TablaTd>
                  <TablaTd className="text-xs">{f.codigo_funcion ?? '—'}</TablaTd>
                  <TablaTd className="text-right">{fmtInt(f.tokens_input)}</TablaTd>
                  <TablaTd className="text-right">{fmtInt(f.tokens_output)}</TablaTd>
                  <TablaTd className="text-right">{fmtUsd(f.costo_estimado_usd)}</TablaTd>
                  <TablaTd>
                    {f.exito ? (
                      <Insignia variante="exito">OK</Insignia>
                    ) : (
                      <Insignia variante="error">Error</Insignia>
                    )}
                  </TablaTd>
                </TablaFila>
              ))}
              {filas.length === 0 && (
                <TablaFila>
                  <TablaTd colSpan={10} className="text-center text-gray-400 py-6">
                    Sin llamadas registradas
                  </TablaTd>
                </TablaFila>
              )}
            </TablaCuerpo>
          </Tabla>
        )}
      </div>
    </div>
  )
}
