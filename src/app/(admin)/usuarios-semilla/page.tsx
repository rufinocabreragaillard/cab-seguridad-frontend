'use client'

/**
 * Pantalla de Usuario Semilla
 *
 * Permite al super-admin crear/gestionar el usuario administrador inicial
 * (semilla) de cada grupo. A diferencia de /usuarios, esta pantalla:
 *  - Lista TODOS los usuarios del sistema sin filtro de grupo.
 *  - El selector de grupo del usuario es libre (no está atado al grupoActivo).
 *  - Al cambiar grupo en el formulario, recarga entidades de ese grupo.
 *  - Solo accesible para super-admin (grupo ADMIN).
 */

import { useEffect, useState, useCallback } from 'react'
import { Plus, Pencil, Search, Trash2 } from 'lucide-react'
import { Boton } from '@/components/ui/boton'
import { Input } from '@/components/ui/input'
import { Insignia } from '@/components/ui/insignia'
import { Modal } from '@/components/ui/modal'
import { ModalConfirmar } from '@/components/ui/modal-confirmar'
import { Tabla, TablaCabecera, TablaCuerpo, TablaFila, TablaTh, TablaTd } from '@/components/ui/tabla'
import { usuariosApi, gruposApi, entidadesApi, rolesApi, aplicacionesApi } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import type { Usuario, Grupo, Entidad, Rol, Aplicacion, Area } from '@/lib/tipos'

export default function PaginaUsuariosSemilla() {
  const { usuario: usuarioActual, esSuperAdmin } = useAuth()

  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')

  // Catálogos
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [roles, setRoles] = useState<Rol[]>([])
  const [aplicaciones, setAplicaciones] = useState<Aplicacion[]>([])

  // Entidades y áreas dinámicas (según grupo seleccionado en el form)
  const [entidadesGrupo, setEntidadesGrupo] = useState<Entidad[]>([])
  const [areasEntidad, setAreasEntidad] = useState<Area[]>([])
  const [cargandoEntidades, setCargandoEntidades] = useState(false)
  const [cargandoAreas, setCargandoAreas] = useState(false)

  // Roles del grupo seleccionado en el form
  const [rolesGrupo, setRolesGrupo] = useState<Rol[]>([])

  // Aplicaciones disponibles para el grupo seleccionado
  const [appsGrupo, setAppsGrupo] = useState<Aplicacion[]>([])

  // Modal
  const [modalAbierto, setModalAbierto] = useState(false)
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null)
  const [form, setForm] = useState({
    codigo_usuario: '',
    nombre: '',
    alias: '',
    telefono: '',
    descripcion: '',
    grupo_por_defecto: '',
    entidad_por_defecto: '',
    codigo_ubicacion_area_por_defecto: '',
    id_rol_principal: '',
    aplicacion_por_defecto: '',
    invitar: true,
  })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  // Confirmación de eliminación
  const [confirmarEliminar, setConfirmarEliminar] = useState<Usuario | null>(null)
  const [eliminando, setEliminando] = useState(false)

  // ── Carga inicial ─────────────────────────────────────────────────────────
  const cargarUsuarios = useCallback(async () => {
    setCargando(true)
    try {
      const u = await usuariosApi.listarTodos({ activo: undefined })
      setUsuarios(u)
    } catch {
      setUsuarios([])
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargarUsuarios()
    Promise.all([
      gruposApi.listar(),
      rolesApi.listar(),
      aplicacionesApi.listar(),
    ]).then(([g, r, a]) => {
      setGrupos(g)
      setRoles(r)
      setAplicaciones(a)
    }).catch(() => {})
  }, [cargarUsuarios])

  // ── Cascada: grupo → entidades, roles, apps ───────────────────────────────
  useEffect(() => {
    const grupo = form.grupo_por_defecto
    if (!grupo) {
      setEntidadesGrupo([])
      setAreasEntidad([])
      setRolesGrupo([])
      setAppsGrupo([])
      return
    }
    setCargandoEntidades(true)
    gruposApi.listarEntidades(grupo)
      .then(setEntidadesGrupo)
      .catch(() => setEntidadesGrupo([]))
      .finally(() => setCargandoEntidades(false))

    // Roles disponibles para el grupo (incluye globales)
    rolesApi.listar(undefined, grupo, true)
      .then(setRolesGrupo)
      .catch(() => setRolesGrupo([]))

    // Apps habilitadas para el grupo
    aplicacionesApi.listar(grupo)
      .then(setAppsGrupo)
      .catch(() => setAppsGrupo([]))

    // Limpiar entidad/área/app si cambia el grupo
    setForm((f) => ({ ...f, entidad_por_defecto: '', codigo_ubicacion_area_por_defecto: '', id_rol_principal: '', aplicacion_por_defecto: '' }))
    setAreasEntidad([])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.grupo_por_defecto])

  // Cascada: entidad → áreas
  useEffect(() => {
    const entidad = form.entidad_por_defecto
    if (!entidad) { setAreasEntidad([]); return }
    setCargandoAreas(true)
    entidadesApi.listarAreas(entidad)
      .then(setAreasEntidad)
      .catch(() => setAreasEntidad([]))
      .finally(() => setCargandoAreas(false))
    setForm((f) => ({ ...f, codigo_ubicacion_area_por_defecto: '' }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.entidad_por_defecto])

  // ── Abrir modal ────────────────────────────────────────────────────────────
  const abrirNuevo = () => {
    setUsuarioEditando(null)
    setForm({ codigo_usuario: '', nombre: '', alias: '', telefono: '', descripcion: '',
      grupo_por_defecto: '', entidad_por_defecto: '', codigo_ubicacion_area_por_defecto: '',
      id_rol_principal: '', aplicacion_por_defecto: '', invitar: true })
    setError('')
    setEntidadesGrupo([])
    setAreasEntidad([])
    setModalAbierto(true)
  }

  const abrirEditar = (u: Usuario) => {
    setUsuarioEditando(u)
    setForm({
      codigo_usuario: u.codigo_usuario,
      nombre: u.nombre,
      alias: u.alias || '',
      telefono: u.telefono || '',
      descripcion: u.descripcion || '',
      grupo_por_defecto: u.grupo_por_defecto || '',
      entidad_por_defecto: u.entidad_por_defecto || '',
      codigo_ubicacion_area_por_defecto: u.codigo_ubicacion_area_por_defecto || '',
      id_rol_principal: u.id_rol_principal != null ? String(u.id_rol_principal) : '',
      aplicacion_por_defecto: u.aplicacion_por_defecto || '',
      invitar: false,
    })
    setError('')
    setModalAbierto(true)
  }

  // ── Guardar ────────────────────────────────────────────────────────────────
  const guardar = async () => {
    setError('')
    if (!form.codigo_usuario || !form.nombre) {
      setError('El correo y el nombre son obligatorios')
      return
    }
    if (!form.grupo_por_defecto) {
      setError('El grupo por defecto es obligatorio para el usuario semilla')
      return
    }
    setGuardando(true)
    try {
      const datos = {
        nombre: form.nombre,
        alias: form.alias || undefined,
        telefono: form.telefono || undefined,
        descripcion: form.descripcion || undefined,
        grupo_por_defecto: form.grupo_por_defecto || undefined,
        entidad_por_defecto: form.entidad_por_defecto || undefined,
        codigo_ubicacion_area_por_defecto: form.codigo_ubicacion_area_por_defecto || undefined,
        id_rol_principal: form.id_rol_principal ? Number(form.id_rol_principal) : null,
        aplicacion_por_defecto: form.aplicacion_por_defecto || undefined,
      }
      if (usuarioEditando) {
        await usuariosApi.actualizar(usuarioEditando.codigo_usuario, datos)
      } else {
        await usuariosApi.crear({
          codigo_usuario: form.codigo_usuario,
          ...datos,
          invitar: form.invitar,
        })
      }
      setModalAbierto(false)
      cargarUsuarios()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setGuardando(false)
    }
  }

  const ejecutarEliminar = async () => {
    if (!confirmarEliminar) return
    setEliminando(true)
    try {
      await usuariosApi.eliminar(confirmarEliminar.codigo_usuario)
      setConfirmarEliminar(null)
      cargarUsuarios()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al eliminar')
      setConfirmarEliminar(null)
    } finally {
      setEliminando(false)
    }
  }

  // ── Filtros ────────────────────────────────────────────────────────────────
  const usuariosFiltrados = usuarios.filter((u) =>
    busqueda.length === 0 ||
    u.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.codigo_usuario.toLowerCase().includes(busqueda.toLowerCase()) ||
    (u.grupo_por_defecto || '').toLowerCase().includes(busqueda.toLowerCase())
  ).sort((a, b) => {
    // Ordenar por grupo luego nombre
    const ga = a.grupo_por_defecto || ''
    const gb = b.grupo_por_defecto || ''
    return ga !== gb ? ga.localeCompare(gb) : a.nombre.localeCompare(b.nombre)
  })

  // Nombre del grupo para mostrar en la tabla
  const nombreGrupo = (codigo?: string) => grupos.find((g) => g.codigo_grupo === codigo)?.nombre || codigo || '—'

  if (!esSuperAdmin()) {
    return (
      <div className="flex items-center justify-center h-48 text-texto-muted text-sm">
        Solo el super-administrador puede acceder a esta seccion.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-texto">Usuarios Semilla</h2>
          <p className="text-sm text-texto-muted mt-1">
            Gestión global de usuarios administradores iniciales por grupo. Sin filtro de grupo activo.
          </p>
        </div>
        <Boton variante="primario" onClick={abrirNuevo}><Plus size={16} />Nuevo usuario semilla</Boton>
      </div>

      {/* Buscador */}
      <div className="relative max-w-md">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-texto-muted" />
        <input
          type="text"
          placeholder="Buscar por nombre, correo o grupo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full rounded-lg border border-borde bg-surface pl-9 pr-3 py-2 text-sm text-texto focus:outline-none focus:ring-2 focus:ring-primario"
        />
      </div>

      {/* Tabla */}
      <Tabla>
        <TablaCabecera>
          <tr>
            <TablaTh>Nombre</TablaTh>
            <TablaTh>Correo</TablaTh>
            <TablaTh>Grupo por defecto</TablaTh>
            <TablaTh>Tipo grupo</TablaTh>
            <TablaTh>Estado</TablaTh>
            <TablaTh className="text-right">Acciones</TablaTh>
          </tr>
        </TablaCabecera>
        <TablaCuerpo>
          {cargando ? (
            <TablaFila>
              <TablaTd className="py-8 text-center text-texto-muted" colSpan={6 as never}>Cargando...</TablaTd>
            </TablaFila>
          ) : usuariosFiltrados.length === 0 ? (
            <TablaFila>
              <TablaTd className="py-8 text-center text-texto-muted" colSpan={6 as never}>No se encontraron usuarios</TablaTd>
            </TablaFila>
          ) : usuariosFiltrados.map((u) => {
            const grupoInfo = grupos.find((g) => g.codigo_grupo === u.grupo_por_defecto)
            return (
              <TablaFila key={u.codigo_usuario}>
                <TablaTd className="font-medium">{u.nombre}</TablaTd>
                <TablaTd className="text-sm text-texto-muted">{u.codigo_usuario}</TablaTd>
                <TablaTd>{u.grupo_por_defecto ? <span className="text-sm">{nombreGrupo(u.grupo_por_defecto)}</span> : <span className="text-texto-muted">—</span>}</TablaTd>
                <TablaTd>
                  {grupoInfo?.tipo === 'RESTRINGIDO'
                    ? <Insignia variante="advertencia">Restringido</Insignia>
                    : grupoInfo
                      ? <Insignia variante="primario">Normal</Insignia>
                      : <span className="text-texto-muted text-sm">—</span>
                  }
                </TablaTd>
                <TablaTd><Insignia variante={u.activo ? 'exito' : 'error'}>{u.activo ? 'Activo' : 'Inactivo'}</Insignia></TablaTd>
                <TablaTd>
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => abrirEditar(u)}
                      className="p-1.5 rounded-lg hover:bg-primario-muy-claro text-texto-muted hover:text-primario transition-colors"
                      title="Editar"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setConfirmarEliminar(u)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-texto-muted hover:text-error transition-colors"
                      title="Eliminar"
                      disabled={u.codigo_usuario === usuarioActual?.codigo_usuario}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </TablaTd>
              </TablaFila>
            )
          })}
        </TablaCuerpo>
      </Tabla>

      {/* Modal usuario semilla */}
      <Modal
        abierto={modalAbierto}
        alCerrar={() => setModalAbierto(false)}
        titulo={usuarioEditando ? `Editar: ${usuarioEditando.nombre}` : 'Nuevo usuario semilla'}
        className="max-w-2xl"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-texto-muted bg-fondo border border-borde rounded-lg px-4 py-3">
            Este formulario no filtra por grupo activo. El usuario semilla puede pertenecer a cualquier grupo del sistema.
          </p>

          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            {/* Email — solo al crear */}
            {!usuarioEditando ? (
              <Input
                etiqueta="Correo (login) *"
                type="email"
                value={form.codigo_usuario}
                onChange={(e) => setForm({ ...form, codigo_usuario: e.target.value.toLowerCase() })}
                placeholder="admin@grupo.cl"
              />
            ) : (
              <Input etiqueta="Correo" value={form.codigo_usuario} disabled readOnly />
            )}

            <Input
              etiqueta="Nombre completo *"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Juan Pérez"
            />
            <Input
              etiqueta="Alias"
              value={form.alias}
              onChange={(e) => setForm({ ...form, alias: e.target.value })}
              placeholder="Juan"
            />
            <Input
              etiqueta="Teléfono"
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              placeholder="+56 9 1234 5678"
            />
          </div>

          {/* Grupo — selector libre de todos los grupos */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-texto">Grupo por defecto *</label>
            <select
              value={form.grupo_por_defecto}
              onChange={(e) => setForm({ ...form, grupo_por_defecto: e.target.value })}
              className="w-full rounded-lg border border-borde bg-surface px-3 py-2 text-sm text-texto focus:outline-none focus:ring-2 focus:ring-primario"
            >
              <option value="">— Seleccionar grupo —</option>
              {grupos.sort((a, b) => {
                const to = (t?: string) => t === 'RESTRINGIDO' ? 1 : 0
                return to(a.tipo) - to(b.tipo) || a.nombre.localeCompare(b.nombre)
              }).map((g) => (
                <option key={g.codigo_grupo} value={g.codigo_grupo}>
                  {g.nombre} {g.tipo === 'RESTRINGIDO' ? '(Restringido)' : ''} — {g.codigo_grupo}
                </option>
              ))}
            </select>
          </div>

          {/* Entidad por defecto — filtrada al grupo */}
          {form.grupo_por_defecto && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-texto">Entidad por defecto</label>
                <select
                  value={form.entidad_por_defecto}
                  onChange={(e) => setForm({ ...form, entidad_por_defecto: e.target.value })}
                  disabled={cargandoEntidades}
                  className="w-full rounded-lg border border-borde bg-surface px-3 py-2 text-sm text-texto focus:outline-none focus:ring-2 focus:ring-primario disabled:opacity-60"
                >
                  <option value="">— Seleccionar entidad —</option>
                  {entidadesGrupo.map((e) => (
                    <option key={e.codigo_entidad} value={e.codigo_entidad}>{e.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-texto">Área por defecto</label>
                <select
                  value={form.codigo_ubicacion_area_por_defecto}
                  onChange={(e) => setForm({ ...form, codigo_ubicacion_area_por_defecto: e.target.value })}
                  disabled={!form.entidad_por_defecto || cargandoAreas}
                  className="w-full rounded-lg border border-borde bg-surface px-3 py-2 text-sm text-texto focus:outline-none focus:ring-2 focus:ring-primario disabled:opacity-60"
                >
                  <option value="">— Sin área —</option>
                  {areasEntidad.map((a) => (
                    <option key={a.codigo_area} value={a.codigo_area}>{a.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Rol principal — filtrado al grupo */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-texto">Rol principal</label>
                <select
                  value={form.id_rol_principal}
                  onChange={(e) => setForm({ ...form, id_rol_principal: e.target.value })}
                  className="w-full rounded-lg border border-borde bg-surface px-3 py-2 text-sm text-texto focus:outline-none focus:ring-2 focus:ring-primario"
                >
                  <option value="">— Sin rol —</option>
                  {rolesGrupo.map((r) => (
                    <option key={r.id_rol} value={r.id_rol}>
                      {r.nombre} {r.codigo_grupo == null ? '[Global]' : ''} {r.tipo === 'RESTRINGIDO' ? '★' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Aplicación por defecto */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-texto">Aplicación por defecto</label>
                <select
                  value={form.aplicacion_por_defecto}
                  onChange={(e) => setForm({ ...form, aplicacion_por_defecto: e.target.value })}
                  className="w-full rounded-lg border border-borde bg-surface px-3 py-2 text-sm text-texto focus:outline-none focus:ring-2 focus:ring-primario"
                >
                  <option value="">— Sin aplicación —</option>
                  {(appsGrupo.length > 0 ? appsGrupo : aplicaciones).map((a) => (
                    <option key={a.codigo_aplicacion} value={a.codigo_aplicacion}>{a.nombre}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Invitar — solo al crear */}
          {!usuarioEditando && (
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.invitar}
                onChange={(e) => setForm({ ...form, invitar: e.target.checked })}
                className="w-4 h-4 rounded border-borde text-primario focus:ring-primario"
              />
              <span className="text-sm text-texto">Enviar invitación por correo al crear</span>
            </label>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <p className="text-sm text-error">{error}</p>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <Boton variante="contorno" onClick={() => setModalAbierto(false)}>Cancelar</Boton>
            <Boton variante="primario" onClick={guardar} cargando={guardando}>
              {usuarioEditando ? 'Guardar' : 'Crear usuario semilla'}
            </Boton>
          </div>
        </div>
      </Modal>

      {/* Modal confirmar eliminación */}
      <ModalConfirmar
        abierto={!!confirmarEliminar}
        titulo="Eliminar usuario"
        mensaje={`¿Eliminar el usuario "${confirmarEliminar?.nombre}"? Esta acción no se puede deshacer.`}
        onConfirmar={ejecutarEliminar}
        onCancelar={() => setConfirmarEliminar(null)}
        cargando={eliminando}
      />
    </div>
  )
}
