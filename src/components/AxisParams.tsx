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
      {label && <div className="text-xs font-semibold text-hmi-secondary font-display tracking-wide mb-1">{label}</div>}
      <div className="grid grid-cols-3 gap-1">
        {(['maxSpeed', 'accel', 'decel'] as const).map(key => (
          <label key={key} className="flex flex-col gap-0.5">
            <span className="hmi-label">
              {key === 'maxSpeed' ? '最高速' : key === 'accel' ? '加速' : '減速'}
            </span>
            <span className="text-[10px] text-hmi-muted font-mono -mt-0.5">
              {key === 'maxSpeed' ? 'mm/s' : 'mm/s²'}
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
