'use client'

import { useEffect, useState, useCallback } from 'react'
import { Pencil, Search } from 'lucide-react'
import { Boton } from '@/components/ui/boton'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Tabla, TablaCabecera, TablaCuerpo, TablaFila, TablaTh, TablaTd } from '@/components/ui/tabla'
import { ubicacionesDocsApi } from '@/lib/api'
import type { UbicacionDoc } from '@/lib/tipos'
import { useAuth } from '@/context/AuthContext'

export default function PaginaAreas() {
  useAuth()

  const [areas, setAreas] = useState<UbicacionDoc[]>([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState<UbicacionDoc | null>(null)
  const [form, setForm] = useState({ nombre_ubicacion: '', alias_ubicacion: '' })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      setAreas(await ubicacionesDocsApi.listar({ tipo: 'AREA' }))
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const abrirEditar = (u: UbicacionDoc) => {
    setEditando(u)
    setForm({
      nombre_ubicacion: u.nombre_ubicacion,
      alias_ubicacion: u.alias_ubicacion || '',
    })
    setError('')
    setModal(true)
  }

  const guardar = async () => {
    if (!editando) return
    if (!form.nombre_ubicacion.trim()) {
      setError('El nombre es obligatorio')
      return
    }
    setGuardando(true)
    try {
      await ubicacionesDocsApi.actualizar(editando.codigo_ubicacion, {
        nombre_ubicacion: form.nombre_ubicacion,
        alias_ubicacion: form.alias_ubicacion || undefined,
      })
      setModal(false)
      cargar()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setGuardando(false)
    }
  }

  const filtrados = busqueda
    ? areas.filter(
        (a) =>
          a.nombre_ubicacion.toLowerCase().includes(busqueda.toLowerCase()) ||
          (a.alias_ubicacion || '').toLowerCase().includes(busqueda.toLowerCase()) ||
          (a.ruta_completa || '').toLowerCase().includes(busqueda.toLowerCase()) ||
          (a.codigo_entidad || '').toLowerCase().includes(busqueda.toLowerCase())
      )
    : areas

  return (
    <div className="flex flex-col gap-6 max-w-6xl">
      <div>
        <h2 className="text-2xl font-bold text-texto">Áreas</h2>
        <p className="text-sm text-texto-muted mt-1">
          Mantenedor de áreas (ubicaciones tipo AREA). Solo permite editar nombre y alias. Para crear o cambiar jerarquía use Ubicaciones de Documentos.
        </p>
      </div>

      <div className="max-w-sm">
        <Input
          placeholder="Buscar por nombre, alias, ruta o entidad..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          icono={<Search size={15} />}
        />
      </div>

      <div className="border border-borde rounded-lg bg-fondo-tarjeta overflow-hidden">
        {cargando ? (
          <div className="py-8 text-center text-texto-muted">Cargando...</div>
        ) : filtrados.length === 0 ? (
          <div className="py-8 text-center text-texto-muted">No se encontraron áreas</div>
        ) : (
          <Tabla>
            <TablaCabecera>
              <TablaFila>
                <TablaTh>Entidad</TablaTh>
                <TablaTh>Nombre</TablaTh>
                <TablaTh>Alias</TablaTh>
                <TablaTh>Ruta</TablaTh>
                <TablaTh>Nivel</TablaTh>
                <TablaTh className="w-24">Acciones</TablaTh>
              </TablaFila>
            </TablaCabecera>
            <TablaCuerpo>
              {filtrados.map((a) => (
                <TablaFila key={a.codigo_ubicacion}>
                  <TablaTd className="text-xs text-texto-muted">{a.codigo_entidad || '—'}</TablaTd>
                  <TablaTd className="font-medium">{a.nombre_ubicacion}</TablaTd>
                  <TablaTd className="text-texto-muted">{a.alias_ubicacion || '—'}</TablaTd>
                  <TablaTd className="text-xs text-texto-muted">{a.ruta_completa || '—'}</TablaTd>
                  <TablaTd className="text-xs">{a.nivel}</TablaTd>
                  <TablaTd>
                    <button
                      onClick={() => abrirEditar(a)}
                      className="p-1.5 rounded-lg hover:bg-primario-muy-claro text-texto-muted hover:text-primario transition-colors"
                      title="Editar"
                    >
                      <Pencil size={14} />
                    </button>
                  </TablaTd>
                </TablaFila>
              ))}
            </TablaCuerpo>
          </Tabla>
        )}
      </div>

      <Modal
        abierto={modal}
        alCerrar={() => setModal(false)}
        titulo={editando ? `Área: ${editando.nombre_ubicacion}` : 'Editar área'}
      >
        <div className="flex flex-col gap-4 min-w-[450px]">
          <Input
            etiqueta="Nombre *"
            value={form.nombre_ubicacion}
            onChange={(e) => setForm({ ...form, nombre_ubicacion: e.target.value })}
          />
          <Input
            etiqueta="Alias"
            value={form.alias_ubicacion}
            onChange={(e) => setForm({ ...form, alias_ubicacion: e.target.value })}
            placeholder="Alias corto opcional"
          />

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <p className="text-sm text-error">{error}</p>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <Boton variante="contorno" onClick={() => setModal(false)}>
              Cancelar
            </Boton>
            <Boton variante="primario" onClick={guardar} cargando={guardando}>
              Guardar
            </Boton>
          </div>
        </div>
      </Modal>
    </div>
  )
}
