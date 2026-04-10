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
  value,
  onChange,
}: {
  label: string
  value: StorageLayer
  onChange: (v: StorageLayer) => void
}) {
  const fields: { key: keyof StorageLayer; label: string }[] = [
    { key: 'pickHeight', label: '取料高度' },
    { key: 'pickDepth', label: '取料深度' },
    { key: 'placeHeight', label: '放料高度' },
    { key: 'placeDepth', label: '放料深度' },
  ]
  return (
    <div>
      <div className="text-xs font-semibold text-blue-600 mb-1">{label}</div>
      <div className="grid grid-cols-2 gap-2">
        {fields.map(f => (
          <label key={f.key} className="flex flex-col">
            <span className="text-xs text-gray-400">{f.label} (mm)</span>
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

  const [name, setName] = useState(nextName)
  const [position, setPosition] = useState(0)
  const [side, setSide] = useState<StorageSide>('left')
  const [layers, setLayers] = useState<LayerCount>(1)
  const [width, setWidth] = useState(600)
  const [depth, setDepth] = useState(500)
  const [layer1, setLayer1] = useState<StorageLayer>({ ...defaultLayer })
  const [layer2, setLayer2] = useState<StorageLayer>({
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
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-xl shadow-xl w-96 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="text-base font-semibold text-gray-800">新增庫位</div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-4 space-y-4">
          {/* Basic info */}
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col col-span-2">
              <span className="text-xs text-gray-400 mb-0.5">名稱</span>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-blue-400"
                placeholder={nextName}
              />
            </label>
            <label className="flex flex-col">
              <span className="text-xs text-gray-400 mb-0.5">X 位置 (mm)</span>
              <NumberInput
                value={position}
                min={0}
                max={state.track.length}
                step={100}
                onChange={setPosition}
                className="w-full"
              />
            </label>
            <label className="flex flex-col">
              <span className="text-xs text-gray-400 mb-0.5">側邊</span>
              <select
                value={side}
                onChange={e => setSide(e.target.value as StorageSide)}
                className="border border-gray-300 rounded px-2 py-1.5 text-sm"
              >
                <option value="left">左側</option>
                <option value="right">右側</option>
              </select>
            </label>
            <label className="flex flex-col col-span-2">
              <span className="text-xs text-gray-400 mb-0.5">層數</span>
              <select
                value={layers}
                onChange={e => setLayers(parseInt(e.target.value) as LayerCount)}
                className="border border-gray-300 rounded px-2 py-1.5 text-sm"
              >
                <option value={1}>1 層</option>
                <option value={2}>2 層</option>
              </select>
            </label>
            <label className="flex flex-col">
              <span className="text-xs text-gray-400 mb-0.5">寬度 (mm)</span>
              <NumberInput value={width} min={50} step={50} onChange={setWidth} className="w-full" />
            </label>
            <label className="flex flex-col">
              <span className="text-xs text-gray-400 mb-0.5">深度 (mm)</span>
              <NumberInput value={depth} min={50} step={50} onChange={setDepth} className="w-full" />
            </label>
          </div>

          {/* Layer settings */}
          <div className="border-t border-gray-100 pt-3 space-y-3">
            <LayerForm label="第 1 層" value={layer1} onChange={setLayer1} />
            {layers === 2 && (
              <LayerForm label="第 2 層" value={layer2} onChange={setLayer2} />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-4 py-3 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-sm rounded border border-gray-300 text-gray-600 hover:bg-gray-50"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-2 text-sm rounded bg-blue-500 hover:bg-blue-600 text-white font-semibold"
          >
            確認建立
          </button>
        </div>
      </div>
    </div>
  )
}
