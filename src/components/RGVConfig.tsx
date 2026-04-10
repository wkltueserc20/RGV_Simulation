import { useState } from 'react'
import { useApp } from '../context/AppContext'
import type { RGVConfig, MotionMode } from '../types'
import AxisParamsInput from './AxisParams'
import NumberInput from './NumberInput'

function CollapsibleAxis({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-gray-200 rounded">
      <button
        className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-50"
        onClick={() => setOpen(o => !o)}
      >
        <span>{label}</span>
        <span className="text-gray-400">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="px-2 pb-2">{children}</div>}
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
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col">
          <span className="text-xs text-gray-400">長 (mm)</span>
          <NumberInput value={rgv.length} min={1} step={10} onChange={n => update({ length: n })} className="w-full" />
        </label>
        <label className="flex flex-col">
          <span className="text-xs text-gray-400">寬 (mm)</span>
          <NumberInput value={rgv.width} min={1} step={10} onChange={n => update({ width: n })} className="w-full" />
        </label>
        <label className="flex flex-col">
          <span className="text-xs text-gray-400">高 (mm)</span>
          <NumberInput value={rgv.height} min={1} step={10} onChange={n => update({ height: n })} className="w-full" />
        </label>
        <label className="flex flex-col">
          <span className="text-xs text-gray-400">行走高度 (mm)</span>
          <NumberInput
            value={rgv.travelHeight}
            min={0}
            step={10}
            onChange={n => update({ travelHeight: n })}
            className="w-full"
          />
        </label>
        <label className="flex flex-col col-span-2">
          <span className="text-xs text-gray-400">初始位置 (mm)</span>
          <NumberInput
            value={rgv.startPosition}
            min={0}
            max={state.track.length}
            step={10}
            onChange={n => update({ startPosition: n })}
            className="w-full"
          />
          {positionExceedsTrack && (
            <span className="text-xs text-red-500">超出軌道長度</span>
          )}
        </label>
      </div>

      <div>
        <span className="text-xs text-gray-400">動作模式</span>
        <div className="flex gap-3 mt-1">
          {(['sequential', 'concurrent'] as MotionMode[]).map(m => (
            <label key={m} className="flex items-center gap-1 text-sm cursor-pointer">
              <input
                type="radio"
                name="motionMode"
                value={m}
                checked={rgv.motionMode === m}
                onChange={() => update({ motionMode: m })}
              />
              {m === 'sequential' ? '序列' : '疊加'}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <CollapsibleAxis label="行走軸 X">
          <AxisParamsInput label="" value={rgv.travel} onChange={v => update({ travel: v })} />
        </CollapsibleAxis>
        <CollapsibleAxis label="升降軸 Z">
          <AxisParamsInput label="" value={rgv.lift} onChange={v => update({ lift: v })} />
        </CollapsibleAxis>
        <CollapsibleAxis label="進退軸 Y">
          <AxisParamsInput label="" value={rgv.fork} onChange={v => update({ fork: v })} />
        </CollapsibleAxis>
      </div>
    </div>
  )
}
