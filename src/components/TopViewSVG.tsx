import type { AppState, AnimationState } from '../types'

interface Props {
  state: AppState
  anim: AnimationState | null
}

const SVG_W = 700
const SVG_H = 220
const TRACK_Y = SVG_H / 2     // center line
const TRACK_H = 30             // visual track height
const STORAGE_W = 36
const STORAGE_H = 28
const PADDING = 40             // left/right padding in SVG coords

export default function TopViewSVG({ state, anim }: Props) {
  const { track, storages, rgv } = state

  const toSvgX = (mm: number) =>
    PADDING + (mm / track.length) * (SVG_W - 2 * PADDING)

  const rgvSvgW = Math.max(20, (rgv.length / track.length) * (SVG_W - 2 * PADDING))
  const rgvSvgH = 22

  const currentX = anim ? anim.rgvX : rgv.startPosition
  const rgvCenterX = toSvgX(currentX)

  const pickId = state.lastResult?.pickStorageId ?? ''
  const placeId = state.lastResult?.placeStorageId ?? ''

  return (
    <svg
      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      className="w-full border border-gray-200 rounded bg-white"
      style={{ fontFamily: 'sans-serif' }}
    >
      {/* Track background */}
      <rect
        x={PADDING}
        y={TRACK_Y - TRACK_H / 2}
        width={SVG_W - 2 * PADDING}
        height={TRACK_H}
        rx={4}
        fill="#e5e7eb"
        stroke="#9ca3af"
        strokeWidth={1}
      />
      {/* Track center line */}
      <line
        x1={PADDING}
        y1={TRACK_Y}
        x2={SVG_W - PADDING}
        y2={TRACK_Y}
        stroke="#6b7280"
        strokeWidth={1}
        strokeDasharray="4 4"
      />

      {/* Storage locations */}
      {storages.map(s => {
        const sx = toSvgX(s.position)
        const isLeft = s.side === 'left'
        const sy = isLeft
          ? TRACK_Y - TRACK_H / 2 - STORAGE_H - 4
          : TRACK_Y + TRACK_H / 2 + 4

        const isPick = anim && s.id === pickId
        const isPlace = anim && s.id === placeId
        const highlight = isPick ? '#bfdbfe' : isPlace ? '#bbf7d0' : '#f3f4f6'
        const stroke = isPick ? '#3b82f6' : isPlace ? '#22c55e' : '#9ca3af'

        return (
          <g key={s.id}>
            <rect
              x={sx - STORAGE_W / 2}
              y={sy}
              width={STORAGE_W}
              height={STORAGE_H}
              rx={3}
              fill={highlight}
              stroke={stroke}
              strokeWidth={isPick || isPlace ? 2 : 1}
            />
            {/* Layer divider for 2-layer storage */}
            {s.layers === 2 && (
              <line
                x1={sx - STORAGE_W / 2}
                y1={sy + STORAGE_H / 2}
                x2={sx + STORAGE_W / 2}
                y2={sy + STORAGE_H / 2}
                stroke={stroke}
                strokeWidth={0.5}
              />
            )}
            <text
              x={sx}
              y={sy + STORAGE_H / 2 + 4}
              textAnchor="middle"
              fontSize={9}
              fill="#374151"
            >
              {s.name}
            </text>
            {/* connector line to track */}
            <line
              x1={sx}
              y1={isLeft ? sy + STORAGE_H : sy}
              x2={sx}
              y2={isLeft ? TRACK_Y - TRACK_H / 2 : TRACK_Y + TRACK_H / 2}
              stroke="#d1d5db"
              strokeWidth={1}
              strokeDasharray="2 2"
            />
          </g>
        )
      })}

      {/* RGV body */}
      <rect
        x={rgvCenterX - rgvSvgW / 2}
        y={TRACK_Y - rgvSvgH / 2}
        width={rgvSvgW}
        height={rgvSvgH}
        rx={3}
        fill="#1d4ed8"
        stroke="#1e40af"
        strokeWidth={1.5}
        opacity={0.9}
      />
      <text
        x={rgvCenterX}
        y={TRACK_Y + 4}
        textAnchor="middle"
        fontSize={9}
        fill="white"
        fontWeight="bold"
      >
        RGV
      </text>

      {/* Phase label */}
      {anim?.phase && (
        <text
          x={SVG_W / 2}
          y={SVG_H - 6}
          textAnchor="middle"
          fontSize={10}
          fill="#6b7280"
        >
          {anim.phase}
        </text>
      )}

      {/* Scale indicator */}
      <text x={PADDING} y={SVG_H - 6} fontSize={8} fill="#9ca3af">
        0
      </text>
      <text x={SVG_W - PADDING} y={SVG_H - 6} fontSize={8} fill="#9ca3af" textAnchor="end">
        {track.length}mm
      </text>

      {/* Legend */}
      {state.lastResult && (
        <g transform={`translate(${SVG_W - 110}, 6)`}>
          <rect width={8} height={8} rx={1} fill="#bfdbfe" stroke="#3b82f6" />
          <text x={11} y={7} fontSize={8} fill="#374151">取料</text>
          <rect y={12} width={8} height={8} rx={1} fill="#bbf7d0" stroke="#22c55e" />
          <text x={11} y={19} fontSize={8} fill="#374151">放料</text>
        </g>
      )}
    </svg>
  )
}
