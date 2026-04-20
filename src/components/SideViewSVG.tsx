import type { AppState, AnimationState } from '../types'

interface Props {
  state: AppState
  anim: AnimationState | null
  flowStepIndex?: number
}

const SVG_W = 340
const SVG_H = 220
const FLOOR_Y = SVG_H - 20
const RGV_BASE_W = 70
const RGV_BASE_H = 20
const RGV_X = 30
const MAX_HEIGHT_MM = 2500
const HEIGHT_SCALE  = (FLOOR_Y - 30) / MAX_HEIGHT_MM
const DEPTH_SCALE   = (SVG_W - RGV_X - RGV_BASE_W - 30) / 1500

function mmToSvgY(mm: number) {
  return FLOOR_Y - mm * HEIGHT_SCALE
}

/* ── Colours ──────────────────────────────────────────────── */
const C = {
  bg:         '#F2F5F9',
  gridLine:   'rgba(140,168,200,0.3)',
  ground:     '#8A9BB0',
  groundText: '#4A6080',

  rgvFill:    '#1A6FC4',
  rgvStroke:  '#0055A0',
  rgvText:    '#FFFFFF',

  mastFill:   '#8AA8C8',
  mastStroke: '#6080A0',

  carriageFill:   '#E07000',
  carriageStroke: '#A05000',
  tineFill:       '#F0A000',
  tineStroke:     '#A07000',

  refX:       '#0078D4',   // pick height
  refXamber:  '#C96000',   // carry height (Z)
  refY:       '#047857',   // place height
  refGray:    '#8A9BB0',   // travel height

  bayPickFill:    'rgba(0,120,212,0.08)',
  bayPickStroke:  '#0078D4',
  bayPlaceFill:   'rgba(4,120,87,0.08)',
  bayPlaceStroke: '#047857',

  labelText:  '#1A2B3C',
  mutedText:  '#4A6080',
  dimText:    '#8A9BB0',
}

export default function SideViewSVG({ state, anim, flowStepIndex }: Props) {
  const singleResult   = state.lastResult
  const flowStepResult = flowStepIndex !== undefined
    ? state.lastFlowResult?.steps[flowStepIndex] ?? null
    : null
  const result = singleResult ?? flowStepResult

  if (!result) {
    return (
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        className="w-full border border-hmi-border rounded-lg"
        style={{ background: C.bg, fontFamily: "'JetBrains Mono', monospace" }}
      >
        <defs>
          <pattern id="sgrid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d={`M 20 0 L 0 0 0 20`} fill="none" stroke={C.gridLine} strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width={SVG_W} height={SVG_H} fill="url(#sgrid)" />
        <text x={SVG_W / 2} y={SVG_H / 2} textAnchor="middle" fontSize={10} fill={C.mutedText}>
          執行模擬後顯示側視圖
        </text>
      </svg>
    )
  }

  const pickStorage  = state.storages.find(s => s.id === result.pickStorageId)
  const placeStorage = state.storages.find(s => s.id === result.placeStorageId)
  const pickLayerData  = result.pickLayer  === 1 ? pickStorage?.layer1  : pickStorage?.layer2
  const placeLayerData = result.placeLayer === 1 ? placeStorage?.layer1 : placeStorage?.layer2

  const travelHeight = state.rgv.travelHeight
  const forkZ  = anim ? anim.forkZ : travelHeight
  const forkY  = anim ? anim.forkY : 0

  const forkSvgY   = mmToSvgY(forkZ)
  const forkLength = Math.max(4, forkY * DEPTH_SCALE)
  const forkStartX = RGV_X + RGV_BASE_W
  const FORK_TINE_H     = 5
  const FORK_CARRIAGE_H = 12

  const lines: { mm: number; color: string; label: string }[] = []
  if (pickLayerData) {
    lines.push({ mm: pickLayerData.pickHeight,  color: C.refX,      label: `取 ${pickLayerData.pickHeight}mm`  })
    lines.push({ mm: pickLayerData.placeHeight, color: C.refXamber, label: `帶 ${pickLayerData.placeHeight}mm` })
  }
  if (placeLayerData) {
    lines.push({ mm: placeLayerData.placeHeight, color: C.refY, label: `放 ${placeLayerData.placeHeight}mm` })
  }
  if (travelHeight > 0) {
    lines.push({ mm: travelHeight, color: C.refGray, label: `行 ${travelHeight}mm` })
  }

  const storageBays: { storage: typeof pickStorage; fill: string; stroke: string; label: string }[] = []
  if (pickStorage)  storageBays.push({ storage: pickStorage,  fill: C.bayPickFill,  stroke: C.bayPickStroke,  label: '取' })
  if (placeStorage && placeStorage.id !== pickStorage?.id) {
    storageBays.push({ storage: placeStorage, fill: C.bayPlaceFill, stroke: C.bayPlaceStroke, label: '放' })
  }

  return (
    <svg
      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      className="w-full border border-hmi-border rounded-lg"
      style={{ background: C.bg, fontFamily: "'JetBrains Mono', monospace" }}
    >
      <defs>
        <pattern id="sgrid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d={`M 20 0 L 0 0 0 20`} fill="none" stroke={C.gridLine} strokeWidth="0.5" />
        </pattern>
        <filter id="forkGlow">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <rect width={SVG_W} height={SVG_H} fill="url(#sgrid)" />

      {/* Storage bay outlines */}
      {storageBays.map(({ storage: s, fill, stroke, label }) => {
        if (!s) return null
        const bayDepth  = (s.depth ?? 500) * DEPTH_SCALE
        const bayX      = forkStartX
        const maxH      = s.layers === 2
          ? Math.max(s.layer1.placeHeight, s.layer2.placeHeight)
          : s.layer1.placeHeight
        const bayTop    = mmToSvgY(maxH)
        const bayHeight = FLOOR_Y - bayTop
        const dividerY  = s.layers === 2 ? mmToSvgY(s.layer1.placeHeight) : null
        return (
          <g key={s.id}>
            <rect
              x={bayX} y={bayTop}
              width={bayDepth} height={bayHeight}
              fill={fill} stroke={stroke}
              strokeWidth={0.8} opacity={0.9}
            />
            {dividerY !== null && (
              <line
                x1={bayX} y1={dividerY}
                x2={bayX + bayDepth} y2={dividerY}
                stroke={stroke} strokeWidth={0.6} strokeDasharray="3 2"
              />
            )}
            <text x={bayX + 3} y={bayTop + 9} fontSize={7} fill={stroke} fontWeight="bold">
              {label} {s.name}
            </text>
          </g>
        )
      })}

      {/* Ground */}
      <line x1={0} y1={FLOOR_Y} x2={SVG_W} y2={FLOOR_Y} stroke={C.ground} strokeWidth={1.5} />

      {/* Reference lines */}
      {lines.map((l, i) => (
        <g key={i}>
          <line
            x1={RGV_X + RGV_BASE_W}
            y1={mmToSvgY(l.mm)}
            x2={SVG_W - 4}
            y2={mmToSvgY(l.mm)}
            stroke={l.color}
            strokeWidth={0.8}
            strokeDasharray="4 3"
            opacity={0.6}
          />
          <text
            x={SVG_W - 2}
            y={mmToSvgY(l.mm) - 2}
            fontSize={6.5}
            fill={l.color}
            textAnchor="end"
            opacity={0.9}
          >
            {l.label}
          </text>
        </g>
      ))}

      {/* RGV base */}
      <rect
        x={RGV_X}
        y={FLOOR_Y - RGV_BASE_H}
        width={RGV_BASE_W}
        height={RGV_BASE_H}
        rx={3}
        fill={C.rgvFill}
        stroke={C.rgvStroke}
        strokeWidth={1.5}
      />
      {/* RGV glow outline */}
      <rect
        x={RGV_X - 1} y={FLOOR_Y - RGV_BASE_H - 1}
        width={RGV_BASE_W + 2} height={RGV_BASE_H + 2}
        rx={4} fill="none" stroke={C.rgvStroke} strokeWidth={0.5} opacity={0.3}
      />
      <text x={RGV_X + RGV_BASE_W / 2} y={FLOOR_Y - 5} textAnchor="middle" fontSize={8} fill={C.rgvText} fontWeight="bold">
        RGV
      </text>

      {/* Fork mast */}
      <rect
        x={RGV_X + RGV_BASE_W - 6}
        y={30}
        width={6}
        height={FLOOR_Y - RGV_BASE_H - 30}
        fill={C.mastFill}
        stroke={C.mastStroke}
        strokeWidth={0.5}
      />

      {/* Fork carriage + tines */}
      <g filter="url(#forkGlow)">
        <rect
          x={RGV_X + RGV_BASE_W - 8}
          y={forkSvgY - FORK_CARRIAGE_H / 2}
          width={8}
          height={FORK_CARRIAGE_H}
          rx={1}
          fill={C.carriageFill}
          stroke={C.carriageStroke}
          strokeWidth={1}
        />
        {[0, FORK_TINE_H + 2].map((offset, i) => (
          <rect
            key={i}
            x={forkStartX}
            y={forkSvgY - FORK_CARRIAGE_H / 2 + offset}
            width={Math.max(4, forkLength)}
            height={FORK_TINE_H}
            rx={1}
            fill={C.tineFill}
            stroke={C.tineStroke}
            strokeWidth={0.8}
          />
        ))}
      </g>

      {/* Height readout */}
      {forkZ > travelHeight + 5 && (
        <text x={RGV_X - 2} y={(FLOOR_Y + forkSvgY) / 2 + 3} fontSize={7} fill={C.refXamber} textAnchor="end">
          {Math.round(forkZ)}
        </text>
      )}

      {/* Fork depth readout */}
      {forkY > 10 && (
        <text
          x={forkStartX + forkLength / 2}
          y={forkSvgY + FORK_CARRIAGE_H / 2 + 10}
          textAnchor="middle"
          fontSize={7}
          fill={C.carriageFill}
        >
          {Math.round(forkY)}mm
        </text>
      )}

      <text x={4} y={12} fontSize={8} fill={C.mutedText}>側視圖</text>
      <text x={4} y={FLOOR_Y + 14} fontSize={7} fill={C.groundText}>地面</text>
    </svg>
  )
}
