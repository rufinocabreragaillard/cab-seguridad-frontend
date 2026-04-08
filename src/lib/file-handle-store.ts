/**
 * Persistencia compartida del FileSystemDirectoryHandle del directorio raiz
 * que el usuario seleccionó en /procesar-documentos.
 *
 * Se guarda en IndexedDB para que sobreviva recargas y pueda usarse desde
 * otras pantallas (ej. /documentos para "abrir documento original").
 *
 * El handle queda valido mientras el usuario no limpie la sesion del browser.
 * El permiso de lectura puede caducar y hay que repedirlo con
 * `requestPermission`.
 */

const IDB_NAME = 'cab-procesar-docs'
const IDB_STORE = 'handles'
const IDB_KEY = 'dirHandle'

function idbOpen(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function getDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
  if (typeof indexedDB === 'undefined') return null
  try {
    const db = await idbOpen()
    return await new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readonly')
      const req = tx.objectStore(IDB_STORE).get(IDB_KEY)
      req.onsuccess = () => resolve((req.result as FileSystemDirectoryHandle) || null)
      req.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

export async function setDirectoryHandle(handle: FileSystemDirectoryHandle | null) {
  if (typeof indexedDB === 'undefined') return
  try {
    const db = await idbOpen()
    const tx = db.transaction(IDB_STORE, 'readwrite')
    if (handle) tx.objectStore(IDB_STORE).put(handle, IDB_KEY)
    else tx.objectStore(IDB_STORE).delete(IDB_KEY)
  } catch {
    /* ignore */
  }
}

/**
 * Verifica el permiso 'read' del handle. Si no esta concedido, lo solicita.
 * Devuelve true si quedo concedido, false en cualquier otro caso.
 */
export async function ensureReadPermission(
  handle: FileSystemDirectoryHandle,
): Promise<boolean> {
  // El tipo FileSystemHandle.queryPermission no esta en lib.dom todavia.
  type WithPermission = FileSystemDirectoryHandle & {
    queryPermission?: (opts: { mode: 'read' | 'readwrite' }) => Promise<PermissionState>
    requestPermission?: (opts: { mode: 'read' | 'readwrite' }) => Promise<PermissionState>
  }
  const h = handle as WithPermission
  try {
    if (h.queryPermission) {
      const estado = await h.queryPermission({ mode: 'read' })
      if (estado === 'granted') return true
    }
    if (h.requestPermission) {
      const estado = await h.requestPermission({ mode: 'read' })
      return estado === 'granted'
    }
  } catch {
    return false
  }
  return false
}
