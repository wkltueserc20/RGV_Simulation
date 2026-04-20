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
const TRACK_H = 28
const PADDING = 40
const CLICK_THRESHOLD = 5
const MAX_DEPTH_MM  = 1500
const MAX_DEPTH_SVG = TRACK_Y - TRACK_H / 2 - 5

export default function TopViewSVG({ state, anim, highlightPickId, highlightPlaceId, onStorageClick }: Props) {
  const { dispatch } = useApp()
  const { track, storages, rgv } = state
  const svgRef = useRef<SVGSVGElement>(null)
  const [draggingId, setDraggingId]   = useState<string | null>(null)
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

  const currentX   = anim ? anim.rgvX : rgv.startPosition
  const rgvCenterX = toSvgX(currentX)

  const pickId  = highlightPickId  ?? state.lastResult?.pickStorageId  ?? ''
  const placeId = highlightPlaceId ?? state.lastResult?.placeStorageId ?? ''
  const canInteract = !anim

  /* ── Colours ─────────────────────────────────────── */
  const C = {
    trackFill:      '#D4E0EC',
    trackStroke:    '#8AA8C8',
    trackLine:      '#A0B8D0',
    storageDef:     '#E8F0F8',
    storageDefStr:  '#8AA8C8',
    storagePickF:   'rgba(0,120,212,0.12)',
    storagePick:    '#0078D4',
    storagePlaceF:  'rgba(4,120,87,0.12)',
    storagePlace:   '#047857',
    storageDragF:   'rgba(180,83,9,0.12)',
    storageDrag:    '#B45309',
    storageHlF:     'rgba(0,120,212,0.06)',
    storageHl:      '#8AA8C8',
    divider:        '#A0B8D0',
    textPrimary:    '#1A2B3C',
    textMuted:      '#8A9BB0',
    textSecondary:  '#4A6080',
    rgvFill:        '#1A6FC4',
    rgvStroke:      '#0055A0',
    rgvDragFill:    '#2580D4',
    rgvDragLabel:   '#0055A0',
    legendBg:       'rgba(242,245,249,0.9)',
    gridLine:       'rgba(140,168,200,0.3)',
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      className="w-full border border-hmi-border rounded-lg"
      style={{ background: '#F2F5F9', fontFamily: "'JetBrains Mono', monospace", userSelect: 'none' }}
    >
      {/* Subtle background grid */}
      <defs>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d={`M 20 0 L 0 0 0 20`} fill="none" stroke={C.gridLine} strokeWidth="0.5" />
        </pattern>
        <filter id="glowX">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="glowY">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <rect width={SVG_W} height={SVG_H} fill="url(#grid)" />

      {/* Track */}
      <rect
        x={PADDING} y={TRACK_Y - TRACK_H / 2}
        width={SVG_W - 2 * PADDING} height={TRACK_H}
        rx={4} fill={C.trackFill} stroke={C.trackStroke} strokeWidth={1.5}
      />
      <line
        x1={PADDING} y1={TRACK_Y}
        x2={SVG_W - PADDING} y2={TRACK_Y}
        stroke={C.trackLine} strokeWidth={1} strokeDasharray="6 4"
      />

      {/* Storage locations */}
      {storages.map(s => {
        const sx   = toSvgX(s.position)
        const svgW = Math.max(12, (s.width / track.length) * (SVG_W - 2 * PADDING))
        const svgH = Math.max(8, (s.depth / MAX_DEPTH_MM) * MAX_DEPTH_SVG)
        const isLeft = s.side === 'left'
        const sy = isLeft
          ? TRACK_Y - TRACK_H / 2 - svgH - 4
          : TRACK_Y + TRACK_H / 2 + 4

        const isPick      = !!anim && s.id === pickId
        const isPlace     = !!anim && s.id === placeId
        const isDragging  = s.id === draggingId
        const isHighlighted = !anim && (s.id === pickId || s.id === placeId)

        const fill   = isPick ? C.storagePickF  : isPlace ? C.storagePlaceF
                     : isDragging ? C.storageDragF : isHighlighted ? C.storageHlF : C.storageDef
        const stroke = isPick ? C.storagePick   : isPlace ? C.storagePlace
                     : isDragging ? C.storageDrag : isHighlighted ? C.storageHl : C.storageDefStr
        const sw     = (isPick || isPlace || isDragging) ? 1.5 : 1
        const filterAttr = isPick ? 'url(#glowX)' : isPlace ? 'url(#glowY)' : undefined

        return (
          <g
            key={s.id}
            filter={filterAttr}
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
            <title>{s.name} | X: {s.position}mm | {s.side === 'left' ? '左' : '右'}側 | {s.layers}層 | 寬{s.width}×深{s.depth}mm</title>

            <rect
              x={sx - svgW / 2} y={sy}
              width={svgW} height={svgH}
              rx={2} fill={fill} stroke={stroke} strokeWidth={sw}
            />
            {/* Layer divider for 2-layer storages */}
            {s.layers === 2 && (
              <line
                x1={sx - svgW / 2} y1={sy + svgH / 2}
                x2={sx + svgW / 2} y2={sy + svgH / 2}
                stroke={stroke} strokeWidth={0.5} opacity={0.6}
              />
            )}
            <text x={sx} y={sy + svgH / 2 + 4} textAnchor="middle" fontSize={8} fill={stroke} opacity={0.9}>
              {s.name}
            </text>
            <line
              x1={sx} y1={isLeft ? sy + svgH : sy}
              x2={sx} y2={isLeft ? TRACK_Y - TRACK_H / 2 : TRACK_Y + TRACK_H / 2}
              stroke={isDragging ? C.storageDrag : C.storageDefStr}
              strokeWidth={isDragging ? 1.5 : 0.8} strokeDasharray="3 3"
            />
            {isDragging && (
              <text
                x={sx} y={isLeft ? sy - 5 : sy + svgH + 12}
                textAnchor="middle" fontSize={8} fontWeight="bold" fill={C.storageDrag}
              >
                {s.position}mm
              </text>
            )}
          </g>
        )
      })}

      {/* RGV */}
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
        onPointerUp={canInteract ? () => setDraggingRgv(false)   : undefined}
        onPointerCancel={canInteract ? () => setDraggingRgv(false) : undefined}
      >
        <title>RGV 初始位置: {rgv.startPosition}mm（拖拽調整）</title>

        {/* Glow underlay */}
        <rect
          x={rgvCenterX - rgvSvgW / 2 - 2}
          y={TRACK_Y - rgvSvgH / 2 - 2}
          width={rgvSvgW + 4} height={rgvSvgH + 4}
          rx={5}
          fill="none" stroke={C.rgvStroke}
          strokeWidth={1} opacity={0.3}
        />
        <rect
          x={rgvCenterX - rgvSvgW / 2}
          y={TRACK_Y - rgvSvgH / 2}
          width={rgvSvgW} height={rgvSvgH}
          rx={3}
          fill={draggingRgv ? C.rgvDragFill : C.rgvFill}
          stroke={C.rgvStroke} strokeWidth={1.5}
        />
        <text x={rgvCenterX} y={TRACK_Y + 4} textAnchor="middle" fontSize={8} fill={C.rgvStroke} fontWeight="bold">
          RGV
        </text>
        {draggingRgv && (
          <text
            x={rgvCenterX} y={TRACK_Y - rgvSvgH / 2 - 5}
            textAnchor="middle" fontSize={8} fontWeight="bold" fill={C.rgvDragLabel}
          >
            {rgv.startPosition}mm
          </text>
        )}
      </g>

      {/* Hints */}
      {!anim && storages.length > 0 && !draggingId && !draggingRgv && (
        <text x={SVG_W / 2} y={SVG_H - 6} textAnchor="middle" fontSize={7.5} fill={C.textMuted}>
          拖拽可調整位置 · 點選庫位展開設定
        </text>
      )}
      {anim?.phase && (
        <text x={SVG_W / 2} y={SVG_H - 6} textAnchor="middle" fontSize={9} fill={C.textSecondary}>
          {anim.phase}
        </text>
      )}

      {/* Scale */}
      <text x={PADDING} y={SVG_H - 6} fontSize={7.5} fill={C.textMuted}>0</text>
      <text x={SVG_W - PADDING} y={SVG_H - 6} fontSize={7.5} fill={C.textMuted} textAnchor="end">
        {track.length}mm
      </text>

      {/* Legend */}
      {(state.lastResult || state.lastFlowResult) && (
        <g transform={`translate(${SVG_W - 92}, 6)`}>
          <rect width={86} height={26} rx={3} fill={C.legendBg} stroke={C.storageDefStr} strokeWidth={0.5} />
          <rect x={6} y={6} width={7} height={7} rx={1} fill={C.storagePickF} stroke={C.storagePick} strokeWidth={1} />
          <text x={17} y={13} fontSize={7.5} fill={C.textPrimary}>取料</text>
          <rect x={46} y={6} width={7} height={7} rx={1} fill={C.storagePlaceF} stroke={C.storagePlace} strokeWidth={1} />
          <text x={57} y={13} fontSize={7.5} fill={C.textPrimary}>放料</text>
        </g>
      )}
    </svg>
  )
}
