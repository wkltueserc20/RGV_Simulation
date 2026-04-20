import { useState } from 'react'
import { useApp } from '../context/AppContext'
import type { RGVConfig, MotionMode } from '../types'
import AxisParamsInput from './AxisParams'
import NumberInput from './NumberInput'

function CollapsibleAxis({ label, accent, children }: { label: string; accent: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-hmi-border rounded overflow-hidden">
      <button
        className="hmi-collapsible-trigger"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-2">
          <span className={`text-[10px] px-1.5 py-px rounded-sm font-mono font-bold border ${accent}`}>
            {label.slice(0, 1)}
          </span>
          <span>{label}</span>
        </div>
        <span className="text-hmi-muted text-[10px]">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-2 pb-2 pt-1 bg-hmi-card/50">
          {children}
        </div>
      )}
    </div>
  )
}

export default function RGVConfigPanel() {
  const { state, dispatch } = useApp()
  const rgv = state.rgv

  const update = (patch: Partial<RGVConfig>) => {
    dispatch({ type: 'UPDATE_RGV', payload: { ...rgv, ...patch } })
  }

  const positionExceedsTrack = rgv.startPosition > state.track.length

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-1 h-4 bg-hmi-accent rounded-full" />
        <span className="hmi-title">RGV 設定</span>
      </div>

      {/* Dimensions */}
      <div className="bg-hmi-card border border-hmi-border/60 rounded p-2 space-y-2">
        <div className="text-[10px] font-semibold font-display tracking-widest text-hmi-muted uppercase">車體尺寸</div>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-0.5">
            <span className="hmi-label">長 (mm)</span>
            <NumberInput value={rgv.length} min={1} step={10} onChange={n => update({ length: n })} className="w-full" />
          </label>
          <label className="flex flex-col gap-0.5">
            <span className="hmi-label">寬 (mm)</span>
            <NumberInput value={rgv.width} min={1} step={10} onChange={n => update({ width: n })} className="w-full" />
          </label>
          <label className="flex flex-col gap-0.5">
            <span className="hmi-label">高 (mm)</span>
            <NumberInput value={rgv.height} min={1} step={10} onChange={n => update({ height: n })} className="w-full" />
          </label>
          <label className="flex flex-col gap-0.5">
            <span className="hmi-label">行走高度 (mm)</span>
            <NumberInput
              value={rgv.travelHeight}
              min={0}
              step={10}
              onChange={n => update({ travelHeight: n })}
              className="w-full"
            />
          </label>
          <label className="flex flex-col gap-0.5 col-span-2">
            <span className="hmi-label">初始位置 (mm)</span>
            <NumberInput
              value={rgv.startPosition}
              min={0}
              max={state.track.length}
              step={10}
              onChange={n => update({ startPosition: n })}
              className="w-full"
            />
            {positionExceedsTrack && (
              <span className="text-xs text-hmi-error font-mono">⚠ 超出軌道長度</span>
            )}
          </label>
        </div>
      </div>

      {/* Motion mode */}
      <div className="bg-hmi-card border border-hmi-border/60 rounded p-2 space-y-1.5">
        <div className="text-[10px] font-semibold font-display tracking-widest text-hmi-muted uppercase">動作模式</div>
        <div className="flex gap-3">
          {(['sequential', 'concurrent'] as MotionMode[]).map(m => (
            <label key={m} className="flex items-center gap-1.5 cursor-pointer group">
              <input
                type="radio"
                name="motionMode"
                value={m}
                checked={rgv.motionMode === m}
                onChange={() => update({ motionMode: m })}
                className="accent-hmi-accent"
              />
              <span className={`text-sm font-display tracking-wide transition-colors ${
                rgv.motionMode === m ? 'text-hmi-accent' : 'text-hmi-secondary group-hover:text-hmi-primary'
              }`}>
                {m === 'sequential' ? '序列' : '疊加'}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Axis parameters */}
      <div className="space-y-1">
        <div className="text-[10px] font-semibold font-display tracking-widest text-hmi-muted uppercase mb-1">軸參數</div>
        <CollapsibleAxis
          label="行走軸 X"
          accent="bg-hmi-accent/15 text-hmi-axis-x border-hmi-accent/30"
        >
          <AxisParamsInput label="" value={rgv.travel} onChange={v => update({ travel: v })} />
        </CollapsibleAxis>
        <CollapsibleAxis
          label="升降軸 Z"
          accent="bg-hmi-warning/10 text-hmi-axis-z border-hmi-warning/30"
        >
          <AxisParamsInput label="" value={rgv.lift} onChange={v => update({ lift: v })} />
        </CollapsibleAxis>
        <CollapsibleAxis
          label="進退軸 Y"
          accent="bg-hmi-success/10 text-hmi-axis-y border-hmi-success/30"
        >
          <AxisParamsInput label="" value={rgv.fork} onChange={v => update({ fork: v })} />
        </CollapsibleAxis>
      </div>
    </div>
  )
}
