import { useEffect, useState } from 'react'

interface Props {
  value: number
  onChange: (n: number) => void
  min?: number
  max?: number
  step?: number
  className?: string
  disabled?: boolean
}

/**
 * Controlled number input that maintains a local string for display,
 * and calls onChange whenever the typed value is a valid number within bounds.
 */
export default function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  className = '',
  disabled,
}: Props) {
  const [raw, setRaw] = useState(String(value))

  // Sync display when external state changes (e.g. localStorage restore)
  useEffect(() => {
    setRaw(String(value))
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const str = e.target.value
    setRaw(str)
    const n = parseFloat(str)
    if (isNaN(n)) return
    if (min !== undefined && n < min) return
    if (max !== undefined && n > max) return
    onChange(n)
  }

  const isInvalid = (() => {
    const n = parseFloat(raw)
    if (isNaN(n)) return true
    if (min !== undefined && n < min) return true
    if (max !== undefined && n > max) return true
    return false
  })()

  return (
    <input
      type="number"
      value={raw}
      onChange={handleChange}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      className={`border rounded px-1 py-0.5 text-sm ${
        isInvalid ? 'border-red-400 bg-red-50' : 'border-gray-300'
      } ${className}`}
    />
  )
}
