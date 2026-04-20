import { useApp } from '../context/AppContext'
import NumberInput from './NumberInput'

export default function TrackConfigPanel() {
  const { state, dispatch } = useApp()
  const track = state.track

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-1 h-4 bg-hmi-secondary rounded-full" />
        <span className="hmi-title">軌道設定</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1">
          <span className="hmi-label">長度 (mm)</span>
          <NumberInput
            value={track.length}
            min={1}
            step={100}
            onChange={n => dispatch({ type: 'UPDATE_TRACK', payload: { ...track, length: n } })}
            className="w-full"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="hmi-label">寬度 (mm)</span>
          <NumberInput
            value={track.width}
            min={1}
            step={10}
            onChange={n => dispatch({ type: 'UPDATE_TRACK', payload: { ...track, width: n } })}
            className="w-full"
          />
        </label>
      </div>
    </div>
  )
}
