'use client'

/**
 * CirculoProgreso — disco con anillo de progreso circular (SVG).
 *
 * El disco tiene un color fijo que identifica el paso en el pipeline.
 * El anillo exterior se llena progresivamente; su color sigue la escala
 * semáforo: gris → amarillo → amarillo-verde → verde.
 */

interface CirculoProgresoProps {
  nombre: string          // "EXTRAER"
  total: number           // documentos a procesar
  completados: number     // documentos ya procesados
  estado: 'esperando' | 'activo' | 'listo' | 'error'
  colorDisco: string      // color de fondo del disco (#EF4444, etc.)
  size?: number           // diámetro total en px (default 148)
}

// Escala de color del anillo según progreso (0..1)
function colorAnillo(progreso: number, estado: CirculoProgresoProps['estado']): string {
  if (estado === 'error') return '#EF4444'
  if (estado === 'esperando' || progreso === 0) return '#D1D5DB'   // gris
  if (progreso >= 1) return '#16A34A'                              // verde pleno
  if (progreso >= 0.7) return '#22C55E'                            // verde
  if (progreso >= 0.4) return '#84CC16'                            // amarillo-verde
  return '#EAB308'                                                 // amarillo
}

export function CirculoProgreso({
  nombre,
  total,
  completados,
  estado,
  colorDisco,
  size = 148,
}: CirculoProgresoProps) {
  const grosorAnillo = Math.round(size * 0.082)   // ~12px para size=148
  const radio = (size - grosorAnillo) / 2
  const cx = size / 2
  const cy = size / 2
  const circunferencia = 2 * Math.PI * radio

  const progreso = total > 0 ? Math.min(completados / total, 1) : 0
  const offset = circunferencia * (1 - progreso)
  const colorRing = colorAnillo(progreso, estado)

  // Texto interior
  const labelConteo = total > 0
    ? estado === 'listo' ? `${total}/${total}` : `${completados}/${total}`
    : '—'

  // Opacidad del disco: apagado cuando espera, pleno cuando activo/listo
  const opacidadDisco = estado === 'esperando' ? 0.45 : 1

  return (
    <div className="flex flex-col items-center gap-2 select-none">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ overflow: 'visible' }}
      >
        {/* Anillo de fondo (gris) */}
        <circle
          cx={cx}
          cy={cy}
          r={radio}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={grosorAnillo}
        />

        {/* Anillo de progreso */}
        <circle
          cx={cx}
          cy={cy}
          r={radio}
          fill="none"
          stroke={colorRing}
          strokeWidth={grosorAnillo}
          strokeLinecap="round"
          strokeDasharray={circunferencia}
          strokeDashoffset={offset}
          // Empezar desde arriba (−90°)
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{
            transition: 'stroke-dashoffset 0.6s ease, stroke 0.4s ease',
          }}
        />

        {/* Disco interior */}
        <circle
          cx={cx}
          cy={cy}
          r={radio - grosorAnillo / 2 - 2}
          fill={colorDisco}
          opacity={opacidadDisco}
          style={{ transition: 'opacity 0.4s ease' }}
        />

        {/* Ícono de check cuando listo */}
        {estado === 'listo' && (
          <text
            x={cx}
            y={cy - 10}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={Math.round(size * 0.22)}
            fill="white"
            fontWeight="bold"
          >
            ✓
          </text>
        )}

        {/* Nombre del proceso */}
        <text
          x={cx}
          y={estado === 'listo' ? cy + 12 : cy - 8}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={Math.round(size * 0.115)}
          fontWeight="700"
          fill="white"
          letterSpacing="0.5"
        >
          {nombre}
        </text>

        {/* Conteo */}
        {estado !== 'listo' && (
          <text
            x={cx}
            y={cy + 14}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={Math.round(size * 0.1)}
            fill="rgba(255,255,255,0.85)"
          >
            {labelConteo}
          </text>
        )}

        {/* Pulso animado cuando activo */}
        {estado === 'activo' && progreso < 1 && (
          <circle
            cx={cx}
            cy={cy}
            r={radio + grosorAnillo / 2 + 3}
            fill="none"
            stroke={colorDisco}
            strokeWidth={2}
            opacity={0.4}
          >
            <animate
              attributeName="r"
              from={radio + grosorAnillo / 2 + 2}
              to={radio + grosorAnillo / 2 + 10}
              dur="1.5s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              from="0.4"
              to="0"
              dur="1.5s"
              repeatCount="indefinite"
            />
          </circle>
        )}
      </svg>

      {/* Estado textual debajo */}
      <span className="text-xs font-medium" style={{
        color: estado === 'listo' ? '#16A34A'
          : estado === 'activo' ? colorDisco
          : estado === 'error' ? '#EF4444'
          : '#9CA3AF',
      }}>
        {estado === 'esperando' && 'Esperando'}
        {estado === 'activo' && 'En proceso...'}
        {estado === 'listo' && 'Listo'}
        {estado === 'error' && 'Error'}
      </span>
    </div>
  )
}
