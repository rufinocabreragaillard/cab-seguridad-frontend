// ─── Tipo de elemento (aplicaciones, funciones, roles, grupos) ────────────────
// BD enum: USUARIO | ADMINISTRADOR | PRUEBAS | RESTRINGIDO
// (Constraint CHECK real en tablas `aplicaciones`, `funciones`, `roles`, `grupos_entidades`).

export type TipoElemento = 'USUARIO' | 'ADMINISTRADOR' | 'PRUEBAS' | 'RESTRINGIDO'

export type VarianteInsigniaTipo = 'primario' | 'exito' | 'error' | 'advertencia' | 'neutro' | 'secundario'

export const TIPOS_ELEMENTO: TipoElemento[] = ['USUARIO', 'ADMINISTRADOR', 'PRUEBAS', 'RESTRINGIDO']

export const ETIQUETA_TIPO: Record<TipoElemento, string> = {
  USUARIO: 'Usuario',
  ADMINISTRADOR: 'Administración',
  PRUEBAS: 'Test',
  RESTRINGIDO: 'Restringido',
}

export const DESCRIPCION_TIPO: Record<TipoElemento, string> = {
  USUARIO: 'Usuario — disponible para cualquier rol de usuario final',
  ADMINISTRADOR: 'Administración — solo administradores de grupo',
  PRUEBAS: 'Test — entornos de prueba',
  RESTRINGIDO: 'Restringido — solo super-admin puede asignar',
}

export const VARIANTE_TIPO: Record<TipoElemento, VarianteInsigniaTipo> = {
  USUARIO: 'exito',
  ADMINISTRADOR: 'advertencia',
  PRUEBAS: 'neutro',
  RESTRINGIDO: 'error',
}

export function normalizarTipo(tipo?: string | null): TipoElemento {
  const t = (tipo || 'USUARIO').toUpperCase()
  return (TIPOS_ELEMENTO as string[]).includes(t) ? (t as TipoElemento) : 'USUARIO'
}

export function etiquetaTipo(tipo?: string | null): string {
  return ETIQUETA_TIPO[normalizarTipo(tipo)]
}

export function varianteTipo(tipo?: string | null): VarianteInsigniaTipo {
  return VARIANTE_TIPO[normalizarTipo(tipo)]
}

export function esTipoSensible(tipo?: string | null): boolean {
  const t = normalizarTipo(tipo)
  return t === 'RESTRINGIDO' || t === 'ADMINISTRADOR'
}
