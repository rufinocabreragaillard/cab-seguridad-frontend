'use client'

import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Modal } from '@/components/ui/modal'
import { ModalConfirmar } from '@/components/ui/modal-confirmar'
import { Boton } from '@/components/ui/boton'
import { BarraHerramientas } from '@/components/ui/barra-herramientas'
import {
  TablaCrud,
  columnaCodigo,
  columnaNombre,
} from '@/components/ui/tabla-crud'
import { Insignia } from '@/components/ui/insignia'
import { procesosApi } from '@/lib/api'
import type { Proceso } from '@/lib/api'
import { useCrudPage } from '@/hooks/useCrudPage'
import { BotonChat } from '@/components/ui/boton-chat'

const selectClass =
  'w-full rounded-lg border border-borde bg-surface px-3 py-2 text-sm text-texto focus:outline-none focus:ring-2 focus:ring-primario disabled:opacity-50'

type FormProceso = {
  nombre_proceso: string
  descripcion: string
  tipo_entidad: string
  n_parallel: number
}

export default function PaginaProcesos() {
  const t = useTranslations('procesos')
  const tc = useTranslations('common')

  const crud = useCrudPage<Proceso, FormProceso>({
    cargarFn: () => procesosApi.listar(),
    actualizarFn: (id, f) =>
      procesosApi.actualizar(id, {
        nombre_proceso: f.nombre_proceso?.trim(),
        descripcion: f.descripcion?.trim() || undefined,
        n_parallel: f.n_parallel,
      }),
    getId: (p) => p.codigo_proceso,
    camposBusqueda: (p) => [p.codigo_proceso, p.nombre_proceso, p.tipo_entidad],
    formInicial: { nombre_proceso: '', descripcion: '', tipo_entidad: '', n_parallel: 1 },
    itemToForm: (p) => ({
      nombre_proceso: p.nombre_proceso,
      descripcion: p.descripcion ?? '',
      tipo_entidad: p.tipo_entidad,
      n_parallel: p.n_parallel,
    }),
  })

  const filtradosOrdenados = [...crud.filtrados].sort((a, b) =>
    a.nombre_proceso.localeCompare(b.nombre_proceso),
  )

  return (
    <div className="relative flex flex-col gap-6 max-w-5xl">
      <BotonChat className="top-0 right-0" />
      <div className="pr-28">
        <h2 className="text-2xl font-bold text-texto">{t('titulo')}</h2>
        <p className="text-sm text-texto-muted mt-1">{t('subtitulo')}</p>
      </div>

      <BarraHerramientas
        busqueda={crud.busqueda}
        onBusqueda={crud.setBusqueda}
        placeholderBusqueda={t('buscarPlaceholder')}
        excelDatos={filtradosOrdenados as unknown as Record<string, unknown>[]}
        excelColumnas={[
          { titulo: t('colCodigo'), campo: 'codigo_proceso' },
          { titulo: t('colNombre'), campo: 'nombre_proceso' },
          { titulo: t('colTipoEntidad'), campo: 'tipo_entidad' },
          { titulo: t('colParalelo'), campo: 'n_parallel' },
          { titulo: t('colEstado'), campo: 'activo' },
        ]}
        excelNombreArchivo="procesos"
      />

      <TablaCrud
        columnas={[
          columnaCodigo<Proceso>(t('colCodigo'), (p) => p.codigo_proceso),
          columnaNombre<Proceso>(t('colNombre'), (p) => p.nombre_proceso),
          {
            titulo: t('colTipoEntidad'),
            render: (p: Proceso) => (
              <Insignia variante="secundario">{p.tipo_entidad}</Insignia>
            ),
          },
          {
            titulo: t('colParalelo'),
            render: (p: Proceso) => (
              <span className="text-sm">{p.n_parallel}</span>
            ),
          },
          {
            titulo: t('colEstado'),
            render: (p: Proceso) =>
              p.activo ? (
                <Insignia variante="exito">{tc('activo')}</Insignia>
              ) : (
                <Insignia variante="neutro">{tc('inactivo')}</Insignia>
              ),
          },
        ]}
        items={filtradosOrdenados}
        cargando={crud.cargando}
        getId={(p) => p.codigo_proceso}
        onEditar={crud.abrirEditar}
        textoVacio={t('sinProcesos')}
      />

      {/* Modal editar */}
      <Modal
        abierto={crud.modal}
        alCerrar={crud.cerrarModal}
        titulo={
          crud.editando
            ? t('editarTitulo', { nombre: crud.editando.nombre_proceso })
            : t('editarTitulo', { nombre: '' })
        }
        className="max-w-lg"
      >
        <div className="flex flex-col gap-4 min-w-[400px]">
          {crud.editando && (
            <Input
              etiqueta={t('etiquetaCodigo')}
              value={crud.editando.codigo_proceso}
              onChange={() => {}}
              disabled
            />
          )}

          <Input
            etiqueta={t('etiquetaNombre')}
            value={crud.form.nombre_proceso}
            onChange={(e) => crud.updateForm('nombre_proceso', e.target.value)}
            placeholder={t('placeholderNombre')}
            autoFocus
          />

          <Textarea
            etiqueta={t('etiquetaDescripcion')}
            value={crud.form.descripcion}
            onChange={(e) => crud.updateForm('descripcion', e.target.value)}
            placeholder={t('placeholderDescripcion')}
            rows={3}
          />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-texto">{t('etiquetaTipoEntidad')}</label>
            <select
              className={selectClass}
              value={crud.form.tipo_entidad}
              onChange={(e) => crud.updateForm('tipo_entidad', e.target.value)}
              disabled
            >
              <option value="DOCUMENTOS">DOCUMENTOS</option>
              <option value="PERSONAS">PERSONAS</option>
              <option value="ACTIVOS">ACTIVOS</option>
            </select>
            <p className="text-xs text-texto-muted">{t('descTipoEntidad')}</p>
          </div>

          <Input
            etiqueta={t('etiquetaParalelo')}
            type="number"
            value={String(crud.form.n_parallel)}
            onChange={(e) => crud.updateForm('n_parallel', Number(e.target.value))}
            placeholder="1"
          />

          {crud.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <p className="text-sm text-error">{crud.error}</p>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <Boton variante="contorno" onClick={crud.cerrarModal}>
              {tc('salir')}
            </Boton>
            <Boton
              variante="secundario"
              onClick={() => {
                if (!crud.form.nombre_proceso.trim()) {
                  crud.setError(t('errorNombreObligatorio'))
                  return
                }
                crud.guardar(undefined, undefined, { cerrar: true })
              }}
              cargando={crud.guardando}
            >
              {tc('grabarYSalir')}
            </Boton>
            <Boton
              variante="primario"
              onClick={() => {
                if (!crud.form.nombre_proceso.trim()) {
                  crud.setError(t('errorNombreObligatorio'))
                  return
                }
                crud.guardar(undefined, undefined, { cerrar: false })
              }}
              cargando={crud.guardando}
            >
              {tc('grabar')}
            </Boton>
          </div>
        </div>
      </Modal>
    </div>
  )
}
