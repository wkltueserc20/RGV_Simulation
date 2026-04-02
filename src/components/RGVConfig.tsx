import { useState } from 'react'
import { useApp } from '../context/AppContext'
import type { RGVConfig, MotionMode } from '../types'
import AxisParamsInput from './AxisParams'
import NumberInput from './NumberInput'

export default function RGVConfigPanel() {
  const { state, dispatch } = useApp()
  const [open, setOpen] = useState(true)
  const rgv = state.rgv

  const update = (patch: Partial<RGVConfig>) => {
    dispatch({ type: 'UPDATE_RGV', payload: { ...rgv, ...patch } })
  }

  const positionExceedsTrack = rgv.startPosition > state.track.length

  return (
    <div className="border border-gray-200 rounded-lg mb-2">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex justify-between items-center px-3 py-2 text-sm font-semibold bg-gray-50 rounded-lg"
      >
        <span>RGV 設定</span>
        <span>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="p-3 space-y-2">
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
            <label className="flex flex-col">
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

          <AxisParamsInput label="行走軸 X" value={rgv.travel} onChange={v => update({ travel: v })} />
          <AxisParamsInput label="升降軸 Z" value={rgv.lift} onChange={v => update({ lift: v })} />
          <AxisParamsInput label="進退軸 Y" value={rgv.fork} onChange={v => update({ fork: v })} />
        </div>
      )}
    </div>
  )
}
