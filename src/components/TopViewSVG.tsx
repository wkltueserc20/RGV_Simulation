import { useRef, useState } from 'react'
import type { AppState, AnimationState } from '../types'
import { useApp } from '../context/AppContext'

interface Props {
  state: AppState
  anim: AnimationState | null
  highlightPickId?: string
  highlightPlaceId?: string
  onStorageClick?: (id: string) => void
}

const SVG_W = 700
const SVG_H = 220
const TRACK_Y = SVG_H / 2
const TRACK_H = 30
const PADDING = 40
const CLICK_THRESHOLD = 5  // pixels — under this = click, over = drag
const MAX_DEPTH_MM = 1500  // reference: max storage depth in mm → maps to available Y space
const MAX_DEPTH_SVG = TRACK_Y - TRACK_H / 2 - 5  // SVG units available per side

export default function TopViewSVG({ state, anim, highlightPickId, highlightPlaceId, onStorageClick }: Props) {
  const { dispatch } = useApp()
  const { track, storages, rgv } = state
  const svgRef = useRef<SVGSVGElement>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [draggingRgv, setDraggingRgv] = useState(false)
  const pointerDownPos = useRef<{ clientX: number; clientY: number } | null>(null)

  const toSvgX = (mm: number) =>
    PADDING + (mm / track.length) * (SVG_W - 2 * PADDING)

  const clientToMm = (clientX: number): number => {
    if (!svgRef.current) return 0
    const rect = svgRef.current.getBoundingClientRect()
    const svgX = (clientX - rect.left) * (SVG_W / rect.width)
    const mm = ((svgX - PADDING) / (SVG_W - 2 * PADDING)) * track.length
    return Math.round(Math.max(0, Math.min(track.length, mm)) / 10) * 10
  }

  const rgvSvgW = Math.max(20, (rgv.length / track.length) * (SVG_W - 2 * PADDING))
  const rgvSvgH = 22

  const currentX = anim ? anim.rgvX : rgv.startPosition
  const rgvCenterX = toSvgX(currentX)

  const pickId = highlightPickId ?? state.lastResult?.pickStorageId ?? ''
  const placeId = highlightPlaceId ?? state.lastResult?.placeStorageId ?? ''
  const canInteract = !anim

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      className="w-full border border-gray-200 rounded bg-white"
      style={{ fontFamily: 'sans-serif', userSelect: 'none' }}
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
        x1={PADDING} y1={TRACK_Y}
        x2={SVG_W - PADDING} y2={TRACK_Y}
        stroke="#6b7280" strokeWidth={1} strokeDasharray="4 4"
      />

      {/* Storage locations */}
      {storages.map(s => {
        const sx = toSvgX(s.position)
        const svgW = Math.max(12, (s.width / track.length) * (SVG_W - 2 * PADDING))
        const svgH = Math.max(8, (s.depth / MAX_DEPTH_MM) * MAX_DEPTH_SVG)
        const isLeft = s.side === 'left'
        const sy = isLeft
          ? TRACK_Y - TRACK_H / 2 - svgH - 4
          : TRACK_Y + TRACK_H / 2 + 4

        const isPick = !!anim && s.id === pickId
        const isPlace = !!anim && s.id === placeId
        const isDragging = s.id === draggingId
        const isHighlighted = !anim && (s.id === pickId || s.id === placeId)
        const highlight = isPick ? '#bfdbfe' : isPlace ? '#bbf7d0' : isDragging ? '#fef9c3' : isHighlighted ? '#ede9fe' : '#f3f4f6'
        const stroke = isPick ? '#3b82f6' : isPlace ? '#22c55e' : isDragging ? '#eab308' : isHighlighted ? '#7c3aed' : '#9ca3af'

        return (
          <g
            key={s.id}
            style={{ cursor: canInteract ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
            onPointerDown={canInteract ? (e) => {
              e.stopPropagation()
              ;(e.currentTarget as SVGGElement).setPointerCapture(e.pointerId)
              pointerDownPos.current = { clientX: e.clientX, clientY: e.clientY }
              setDraggingId(s.id)
            } : undefined}
            onPointerMove={canInteract ? (e) => {
              if (draggingId !== s.id) return
              const newMm = clientToMm(e.clientX)
              dispatch({ type: 'UPDATE_STORAGE', payload: { ...s, position: newMm } })
            } : undefined}
            onPointerUp={canInteract ? (e) => {
              setDraggingId(null)
              // Detect click: if pointer barely moved, treat as click not drag
              const down = pointerDownPos.current
              if (down) {
                const dx = e.clientX - down.clientX
                const dy = e.clientY - down.clientY
                if (Math.sqrt(dx * dx + dy * dy) < CLICK_THRESHOLD) {
                  onStorageClick?.(s.id)
                }
              }
              pointerDownPos.current = null
            } : undefined}
            onPointerCancel={canInteract ? () => {
              setDraggingId(null)
              pointerDownPos.current = null
            } : undefined}
          >
            {/* Hover tooltip */}
            <title>{s.name} | X: {s.position}mm | {s.side === 'left' ? '左' : '右'}側 | {s.layers}層 | 寬{s.width}×深{s.depth}mm</title>

            <rect
              x={sx - svgW / 2} y={sy}
              width={svgW} height={svgH}
              rx={3} fill={highlight} stroke={stroke}
              strokeWidth={isPick || isPlace || isDragging ? 2 : 1}
            />
            {s.layers === 2 && (
              <line
                x1={sx - svgW / 2} y1={sy + svgH / 2}
                x2={sx + svgW / 2} y2={sy + svgH / 2}
                stroke={stroke} strokeWidth={0.5}
              />
            )}
            <text x={sx} y={sy + svgH / 2 + 4} textAnchor="middle" fontSize={9} fill="#374151">
              {s.name}
            </text>
            <line
              x1={sx} y1={isLeft ? sy + svgH : sy}
              x2={sx} y2={isLeft ? TRACK_Y - TRACK_H / 2 : TRACK_Y + TRACK_H / 2}
              stroke={isDragging ? '#eab308' : '#d1d5db'}
              strokeWidth={isDragging ? 1.5 : 1} strokeDasharray="2 2"
            />
            {isDragging && (
              <text
                x={sx} y={isLeft ? sy - 4 : sy + svgH + 12}
                textAnchor="middle" fontSize={9} fontWeight="bold" fill="#a16207"
              >
                {s.position}mm
              </text>
            )}
          </g>
        )
      })}

      {/* RGV body — draggable when not animating */}
      <g
        style={{ cursor: canInteract ? (draggingRgv ? 'grabbing' : 'ew-resize') : 'default' }}
        onPointerDown={canInteract ? (e) => {
          e.stopPropagation()
          ;(e.currentTarget as SVGGElement).setPointerCapture(e.pointerId)
          setDraggingRgv(true)
        } : undefined}
        onPointerMove={canInteract ? (e) => {
          if (!draggingRgv) return
          const newMm = clientToMm(e.clientX)
          dispatch({ type: 'UPDATE_RGV', payload: { ...rgv, startPosition: newMm } })
        } : undefined}
        onPointerUp={canInteract ? () => setDraggingRgv(false) : undefined}
        onPointerCancel={canInteract ? () => setDraggingRgv(false) : undefined}
      >
        <title>RGV 初始位置: {rgv.startPosition}mm（拖拽調整）</title>
        <rect
          x={rgvCenterX - rgvSvgW / 2}
          y={TRACK_Y - rgvSvgH / 2}
          width={rgvSvgW} height={rgvSvgH}
          rx={3}
          fill={draggingRgv ? '#2563eb' : '#1d4ed8'}
          stroke="#1e40af" strokeWidth={1.5} opacity={0.9}
        />
        <text x={rgvCenterX} y={TRACK_Y + 4} textAnchor="middle" fontSize={9} fill="white" fontWeight="bold">
          RGV
        </text>
        {draggingRgv && (
          <text
            x={rgvCenterX} y={TRACK_Y - rgvSvgH / 2 - 4}
            textAnchor="middle" fontSize={9} fontWeight="bold" fill="#1d4ed8"
          >
            {rgv.startPosition}mm
          </text>
        )}
      </g>

      {/* Hints */}
      {!anim && storages.length > 0 && !draggingId && !draggingRgv && (
        <text x={SVG_W / 2} y={SVG_H - 6} textAnchor="middle" fontSize={8} fill="#d1d5db">
          拖拽可調整位置・點選庫位展開設定
        </text>
      )}
      {anim?.phase && (
        <text x={SVG_W / 2} y={SVG_H - 6} textAnchor="middle" fontSize={10} fill="#6b7280">
          {anim.phase}
        </text>
      )}

      {/* Scale */}
      <text x={PADDING} y={SVG_H - 6} fontSize={8} fill="#9ca3af">0</text>
      <text x={SVG_W - PADDING} y={SVG_H - 6} fontSize={8} fill="#9ca3af" textAnchor="end">
        {track.length}mm
      </text>

      {/* Legend */}
      {(state.lastResult || state.lastFlowResult) && (
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
