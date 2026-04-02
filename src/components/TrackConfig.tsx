import { useState } from 'react'
import { useApp } from '../context/AppContext'
import NumberInput from './NumberInput'

export default function TrackConfigPanel() {
  const { state, dispatch } = useApp()
  const [open, setOpen] = useState(true)
  const track = state.track

  return (
    <div className="border border-gray-200 rounded-lg mb-2">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex justify-between items-center px-3 py-2 text-sm font-semibold bg-gray-50 rounded-lg"
      >
        <span>軌道設定</span>
        <span>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="p-3 grid grid-cols-2 gap-2">
          <label className="flex flex-col">
            <span className="text-xs text-gray-400">長度 (mm)</span>
            <NumberInput
              value={track.length}
              min={1}
              step={100}
              onChange={n => dispatch({ type: 'UPDATE_TRACK', payload: { ...track, length: n } })}
              className="w-full"
            />
          </label>
          <label className="flex flex-col">
            <span className="text-xs text-gray-400">寬度 (mm)</span>
            <NumberInput
              value={track.width}
              min={1}
              step={10}
              onChange={n => dispatch({ type: 'UPDATE_TRACK', payload: { ...track, width: n } })}
              className="w-full"
            />
          </label>
        </div>
      )}
    </div>
  )
}
