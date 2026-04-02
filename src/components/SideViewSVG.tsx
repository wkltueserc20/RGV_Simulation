import type { AppState, AnimationState } from '../types'

interface Props {
  state: AppState
  anim: AnimationState | null
}

const SVG_W = 340
const SVG_H = 220
const FLOOR_Y = SVG_H - 20
const RGV_BASE_W = 70
const RGV_BASE_H = 20
const RGV_X = 30
const MAX_HEIGHT_MM = 2500
const HEIGHT_SCALE = (FLOOR_Y - 30) / MAX_HEIGHT_MM
const DEPTH_SCALE = (SVG_W - RGV_X - RGV_BASE_W - 30) / 1500

function mmToSvgY(mm: number) {
  return FLOOR_Y - mm * HEIGHT_SCALE
}

export default function SideViewSVG({ state, anim }: Props) {
  const result = state.lastResult
  if (!result) {
    return (
      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full border border-gray-200 rounded bg-white">
        <text x={SVG_W / 2} y={SVG_H / 2} textAnchor="middle" fontSize={11} fill="#9ca3af">
          執行模擬後顯示側視圖
        </text>
      </svg>
    )
  }

  const pickStorage = state.storages.find(s => s.id === result.pickStorageId)
  const placeStorage = state.storages.find(s => s.id === result.placeStorageId)
  const pickLayerData = result.pickLayer === 1 ? pickStorage?.layer1 : pickStorage?.layer2
  const placeLayerData = result.placeLayer === 1 ? placeStorage?.layer1 : placeStorage?.layer2

  const travelHeight = state.rgv.travelHeight
  const forkZ = anim ? anim.forkZ : travelHeight
  const forkY = anim ? anim.forkY : 0

  const forkSvgY = mmToSvgY(forkZ)
  const forkLength = Math.max(4, forkY * DEPTH_SCALE)
  const forkStartX = RGV_X + RGV_BASE_W
  const FORK_TINE_H = 5
  const FORK_CARRIAGE_H = 12

  // Reference lines to show
  const lines: { mm: number; color: string; label: string }[] = []
  if (pickLayerData) {
    lines.push({ mm: pickLayerData.pickHeight, color: '#3b82f6', label: `取料高 ${pickLayerData.pickHeight}mm` })
    lines.push({ mm: pickLayerData.placeHeight, color: '#f59e0b', label: `帶貨高 ${pickLayerData.placeHeight}mm` })
  }
  if (placeLayerData) {
    lines.push({ mm: placeLayerData.placeHeight, color: '#22c55e', label: `放料高 ${placeLayerData.placeHeight}mm` })
  }
  if (travelHeight > 0) {
    lines.push({ mm: travelHeight, color: '#9ca3af', label: `行走高 ${travelHeight}mm` })
  }

  return (
    <svg
      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      className="w-full border border-gray-200 rounded bg-white"
      style={{ fontFamily: 'sans-serif' }}
    >
      {/* Ground */}
      <line x1={0} y1={FLOOR_Y} x2={SVG_W} y2={FLOOR_Y} stroke="#9ca3af" strokeWidth={2} />

      {/* Reference height lines */}
      {lines.map((l, i) => (
        <g key={i}>
          <line
            x1={RGV_X + RGV_BASE_W}
            y1={mmToSvgY(l.mm)}
            x2={SVG_W - 4}
            y2={mmToSvgY(l.mm)}
            stroke={l.color}
            strokeWidth={0.8}
            strokeDasharray="3 3"
            opacity={0.7}
          />
          <text
            x={SVG_W - 2}
            y={mmToSvgY(l.mm) - 2}
            fontSize={7}
            fill={l.color}
            textAnchor="end"
          >
            {l.label}
          </text>
        </g>
      ))}

      {/* RGV body */}
      <rect
        x={RGV_X}
        y={FLOOR_Y - RGV_BASE_H}
        width={RGV_BASE_W}
        height={RGV_BASE_H}
        rx={3}
        fill="#1d4ed8"
        stroke="#1e40af"
        strokeWidth={1.5}
      />
      <text x={RGV_X + RGV_BASE_W / 2} y={FLOOR_Y - 5} textAnchor="middle" fontSize={8} fill="white" fontWeight="bold">
        RGV
      </text>

      {/* Fork mast */}
      <rect
        x={RGV_X + RGV_BASE_W - 6}
        y={30}
        width={6}
        height={FLOOR_Y - RGV_BASE_H - 30}
        fill="#e5e7eb"
        stroke="#9ca3af"
        strokeWidth={0.5}
      />

      {/* Fork carriage */}
      <rect
        x={RGV_X + RGV_BASE_W - 8}
        y={forkSvgY - FORK_CARRIAGE_H / 2}
        width={8}
        height={FORK_CARRIAGE_H}
        rx={1}
        fill="#f59e0b"
        stroke="#d97706"
        strokeWidth={1}
      />

      {/* Fork tines (two prongs) */}
      {[0, FORK_TINE_H + 2].map((offset, i) => (
        <rect
          key={i}
          x={forkStartX}
          y={forkSvgY - FORK_CARRIAGE_H / 2 + offset}
          width={Math.max(4, forkLength)}
          height={FORK_TINE_H}
          rx={1}
          fill="#fbbf24"
          stroke="#d97706"
          strokeWidth={0.8}
        />
      ))}

      {/* Height readout */}
      {forkZ > travelHeight + 5 && (
        <text x={RGV_X - 2} y={(FLOOR_Y + forkSvgY) / 2 + 3} fontSize={7} fill="#6b7280" textAnchor="end">
          {Math.round(forkZ)}
        </text>
      )}

      {/* Fork depth readout */}
      {forkY > 10 && (
        <text
          x={forkStartX + forkLength / 2}
          y={forkSvgY + FORK_CARRIAGE_H / 2 + 9}
          textAnchor="middle"
          fontSize={7}
          fill="#d97706"
        >
          {Math.round(forkY)}mm
        </text>
      )}

      <text x={4} y={12} fontSize={8} fill="#6b7280">側視圖</text>
      <text x={4} y={FLOOR_Y + 14} fontSize={7} fill="#9ca3af">地面</text>
    </svg>
  )
}
