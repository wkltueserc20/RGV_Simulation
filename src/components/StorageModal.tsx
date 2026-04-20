import { useState } from 'react'
import { useApp } from '../context/AppContext'
import type { StorageLocation, StorageLayer, StorageSide, LayerCount } from '../types'
import NumberInput from './NumberInput'
import { defaultLayer } from './StorageCard'

interface Props {
  onClose: () => void
  nextName: string
}

function LayerForm({
  label,
  accent,
  value,
  onChange,
}: {
  label: string
  accent: string
  value: StorageLayer
  onChange: (v: StorageLayer) => void
}) {
  const fields: { key: keyof StorageLayer; label: string }[] = [
    { key: 'pickHeight',  label: '取料高度' },
    { key: 'pickDepth',   label: '取料深度' },
    { key: 'placeHeight', label: '放料高度' },
    { key: 'placeDepth',  label: '放料深度' },
  ]
  return (
    <div>
      <div className={`text-[10px] font-semibold font-display tracking-widest mb-1.5 uppercase ${accent}`}>{label}</div>
      <div className="grid grid-cols-2 gap-2">
        {fields.map(f => (
          <label key={f.key} className="flex flex-col gap-0.5">
            <span className="hmi-label">{f.label} (mm)</span>
            <NumberInput
              value={value[f.key]}
              min={0}
              step={10}
              onChange={n => onChange({ ...value, [f.key]: n })}
              className="w-full"
            />
          </label>
        ))}
      </div>
    </div>
  )
}

let idCounter = Date.now()
const nextId = () => `s${idCounter++}`

export default function StorageModal({ onClose, nextName }: Props) {
  const { state, dispatch } = useApp()

  const [name, setName]       = useState(nextName)
  const [position, setPosition] = useState(0)
  const [side, setSide]       = useState<StorageSide>('left')
  const [layers, setLayers]   = useState<LayerCount>(1)
  const [width, setWidth]     = useState(600)
  const [depth, setDepth]     = useState(500)
  const [layer1, setLayer1]   = useState<StorageLayer>({ ...defaultLayer })
  const [layer2, setLayer2]   = useState<StorageLayer>({
    ...defaultLayer,
    pickHeight: 1200,
    placeHeight: 1220,
  })

  const handleConfirm = () => {
    const newStorage: StorageLocation = {
      id: nextId(),
      name: name.trim() || nextName,
      position,
      side,
      layers,
      width,
      depth,
      layer1,
      layer2,
    }
    dispatch({ type: 'ADD_STORAGE', payload: newStorage })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-hmi-panel border border-hmi-border rounded-xl shadow-panel w-96 max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-hmi-border shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-hmi-axis-z rounded-full" />
            <span className="text-base font-semibold font-display tracking-wide text-hmi-primary">新增庫位</span>
          </div>
          <button
            onClick={onClose}
            className="text-hmi-muted hover:text-hmi-secondary text-lg leading-none transition-colors w-6 h-6 flex items-center justify-center rounded hover:bg-hmi-elevated"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-0.5 col-span-2">
              <span className="hmi-label">名稱</span>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="hmi-input"
                placeholder={nextName}
              />
            </label>
            <label className="flex flex-col gap-0.5">
              <span className="hmi-label">X 位置 (mm)</span>
              <NumberInput
                value={position}
                min={0}
                max={state.track.length}
                step={100}
                onChange={setPosition}
                className="w-full"
              />
            </label>
            <label className="flex flex-col gap-0.5">
              <span className="hmi-label">側邊</span>
              <select
                value={side}
                onChange={e => setSide(e.target.value as StorageSide)}
                className="hmi-select"
              >
                <option value="left">左側</option>
                <option value="right">右側</option>
              </select>
            </label>
            <label className="flex flex-col gap-0.5 col-span-2">
              <span className="hmi-label">層數</span>
              <select
                value={layers}
                onChange={e => setLayers(parseInt(e.target.value) as LayerCount)}
                className="hmi-select"
              >
                <option value={1}>1 層</option>
                <option value={2}>2 層</option>
              </select>
            </label>
            <label className="flex flex-col gap-0.5">
              <span className="hmi-label">寬度 (mm)</span>
              <NumberInput value={width} min={50} step={50} onChange={setWidth} className="w-full" />
            </label>
            <label className="flex flex-col gap-0.5">
              <span className="hmi-label">深度 (mm)</span>
              <NumberInput value={depth} min={50} step={50} onChange={setDepth} className="w-full" />
            </label>
          </div>

          <div className="border-t border-hmi-border/40 pt-3 space-y-3">
            <LayerForm label="第 1 層" accent="text-hmi-axis-x" value={layer1} onChange={setLayer1} />
            {layers === 2 && (
              <LayerForm label="第 2 層" accent="text-hmi-axis-z" value={layer2} onChange={setLayer2} />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-4 py-3 border-t border-hmi-border shrink-0">
          <button onClick={onClose} className="hmi-btn-ghost flex-1 justify-center py-2">
            取消
          </button>
          <button onClick={handleConfirm} className="hmi-btn-primary flex-1 justify-center py-2">
            確認建立
          </button>
        </div>
      </div>
    </div>
  )
}
