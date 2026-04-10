import { useApp } from '../context/AppContext'
import NumberInput from './NumberInput'

export default function TrackConfigPanel() {
  const { state, dispatch } = useApp()
  const track = state.track

  return (
    <div className="grid grid-cols-2 gap-2">
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
  )
}
