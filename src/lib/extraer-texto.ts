/**
 * Utilidad para extraer texto de archivos usando File System Access API.
 * Soporta: PDF, DOCX, XLSX, XLS, TXT, CSV, MD, JSON, XML, HTML
 */

const EXTENSIONES_TEXTO = new Set([
  'txt', 'csv', 'md', 'json', 'xml', 'html', 'htm', 'log', 'sql', 'py', 'js', 'ts', 'yaml', 'yml', 'ini', 'cfg',
])

/**
 * Lee un archivo del filesystem y extrae su contenido como texto.
 * Retorna null si el formato no es soportado.
 */
export async function extraerTextoDeArchivo(fileHandle: FileSystemFileHandle): Promise<string | null> {
  const file = await fileHandle.getFile()
  const nombre = file.name.toLowerCase()
  const ext = nombre.split('.').pop() || ''

  // PDF
  if (ext === 'pdf') {
    return extraerTextoPDF(file)
  }

  // Word (.docx). Nota: .doc binario antiguo NO soportado.
  if (ext === 'docx') {
    return extraerTextoDOCX(file)
  }

  // Excel (.xlsx / .xls / .xlsm)
  if (ext === 'xlsx' || ext === 'xls' || ext === 'xlsm') {
    return extraerTextoExcel(file)
  }

  // Archivos de texto plano
  if (EXTENSIONES_TEXTO.has(ext)) {
    return file.text()
  }

  return null
}

/**
 * Extrae texto de un archivo PDF usando pdf.js
 */
async function extraerTextoPDF(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist')

  // Configurar worker
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  const paginas: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const pagina = await pdf.getPage(i)
    const contenido = await pagina.getTextContent()
    const texto = contenido.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
    paginas.push(texto)
  }

  return paginas.join('\n\n')
}

/**
 * Extrae texto de un .docx usando mammoth.
 */
async function extraerTextoDOCX(file: File): Promise<string> {
  const mammoth = await import('mammoth')
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer })
  return result.value
}

/**
 * Extrae texto de un Excel (.xlsx/.xls/.xlsm) usando SheetJS.
 * Cada hoja se serializa como CSV; las hojas se separan por encabezado.
 */
async function extraerTextoExcel(file: File): Promise<string> {
  const XLSX = await import('xlsx')
  const arrayBuffer = await file.arrayBuffer()
  const workbook = XLSX.read(arrayBuffer, { type: 'array' })
  const partes: string[] = []
  for (const nombreHoja of workbook.SheetNames) {
    const hoja = workbook.Sheets[nombreHoja]
    const csv = XLSX.utils.sheet_to_csv(hoja, { blankrows: false })
    if (csv.trim()) {
      partes.push(`### Hoja: ${nombreHoja}\n${csv}`)
    }
  }
  return partes.join('\n\n')
}

/**
 * Abre un archivo del filesystem dado un FileSystemDirectoryHandle y una ruta relativa.
 * La ruta es relativa al directorio raíz (ej: "/Contratos/2024/contrato.pdf")
 */
export async function abrirArchivoPorRuta(
  dirHandle: FileSystemDirectoryHandle,
  rutaRelativa: string,
): Promise<FileSystemFileHandle | null> {
  // Normalizar ruta: quitar / inicial y el nombre del directorio raíz
  const partes = rutaRelativa.split('/').filter(Boolean)

  // Las primeras partes son directorios, la última es el archivo
  if (partes.length === 0) return null

  let currentDir = dirHandle
  // Navegar por los subdirectorios (saltar el primero que es el nombre del directorio raíz)
  for (let i = 1; i < partes.length - 1; i++) {
    try {
      currentDir = await currentDir.getDirectoryHandle(partes[i])
    } catch {
      return null // Directorio no encontrado
    }
  }

  // Obtener el archivo
  const nombreArchivo = partes[partes.length - 1]
  try {
    return await currentDir.getFileHandle(nombreArchivo)
  } catch {
    return null // Archivo no encontrado
  }
}
