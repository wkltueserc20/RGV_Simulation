import type { AxisParams } from '../types'
import NumberInput from './NumberInput'

interface Props {
  label: string
  value: AxisParams
  onChange: (v: AxisParams) => void
}

export default function AxisParamsInput({ label, value, onChange }: Props) {
  return (
    <div className="mb-2">
      <div className="text-xs font-semibold text-gray-500 mb-1">{label}</div>
      <div className="grid grid-cols-3 gap-1">
        {(['maxSpeed', 'accel', 'decel'] as const).map(key => (
          <label key={key} className="flex flex-col">
            <span className="text-xs text-gray-400">
              {key === 'maxSpeed' ? '最高速 (mm/s)' : key === 'accel' ? '加速 (mm/s²)' : '減速 (mm/s²)'}
            </span>
            <NumberInput
              value={value[key]}
              min={1}
              step={10}
              onChange={n => onChange({ ...value, [key]: n })}
              className="w-full"
            />
          </label>
        ))}
      </div>
    </div>
  )
}
