import { useEffect, useRef, useState } from 'react'
import { useApp } from '../context/AppContext'
import type { StorageLocation, StorageLayer, StorageSide, LayerCount } from '../types'
import NumberInput from './NumberInput'

interface Props {
  storage: StorageLocation
  isOpen: boolean
  onToggle: () => void
}

const defaultLayer: StorageLayer = {
  pickHeight: 200,
  pickDepth: 800,
  placeHeight: 220,
  placeDepth: 800,
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
    <div className="mt-1">
      <div className="text-xs font-semibold text-blue-600 mb-1">{label}</div>
      <div className="grid grid-cols-2 gap-1">
        {fields.map(f => (
          <label key={f.key} className="flex flex-col">
            <span className="text-xs text-gray-400">{f.label} (mm)</span>
            <NumberInput
              value={value[f.key]}
              min={0}
              step={10}
              onChange={n => onChange({ ...value, [f.key]: n })}
              className="w-full text-xs"
            />
          </label>
        ))}
      </div>
    </div>
  )
}

export default function StorageCard({ storage, isOpen, onToggle }: Props) {
  const { state, dispatch } = useApp()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [name, setName] = useState(storage.name)
  const cardRef = useRef<HTMLDivElement>(null)

  // Scroll into view when opened externally (e.g. SVG click)
  useEffect(() => {
    if (isOpen) {
      cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [isOpen])

  // Keep local name in sync if storage name changes externally
  useEffect(() => {
    setName(storage.name)
  }, [storage.name])

  const update = (patch: Partial<StorageLocation>) => {
    dispatch({ type: 'UPDATE_STORAGE', payload: { ...storage, ...patch } })
  }

  const handleDelete = () => {
    if (confirmDelete) {
      dispatch({ type: 'DELETE_STORAGE', payload: storage.id })
    } else {
      setConfirmDelete(true)
    }
  }

  const handleDuplicate = () => {
    dispatch({
      type: 'ADD_STORAGE',
      payload: { ...storage, id: `s${Date.now()}`, name: `${storage.name} 副本` },
    })
  }

  return (
    <div ref={cardRef} className={`rounded mb-1 text-sm border-l-2 ${isOpen ? 'border-blue-400 border border-blue-200' : 'border-transparent border border-gray-200'}`}>
      <div className={`flex items-center justify-between px-2 py-1.5 ${isOpen ? 'bg-blue-50' : 'bg-gray-50'}`}>
        <button
          className="flex-1 text-left font-medium truncate"
          onClick={() => { onToggle(); setConfirmDelete(false) }}
        >
          <span className={isOpen ? 'text-blue-700' : ''}>{storage.name || '（未命名）'}</span>
          <span className="text-xs text-gray-400 ml-2">
            {storage.side === 'left' ? '左' : '右'} | X:{storage.position} | {storage.layers}層 | {storage.width}×{storage.depth}mm
          </span>
        </button>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => { onToggle(); setConfirmDelete(false) }}
            className="text-xs px-1.5 py-0.5 rounded bg-gray-200 hover:bg-gray-300"
          >
            {isOpen ? '收' : '編輯'}
          </button>
          <button
            onClick={handleDuplicate}
            className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-600 hover:bg-blue-200"
            title="複製此庫位"
          >
            複製
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-600 hover:bg-red-200"
          >
            刪除
          </button>
        </div>
      </div>

      {confirmDelete && (
        <div className="flex items-center justify-between px-2 py-1.5 bg-red-50 border-t border-red-200 text-xs">
          <span className="text-red-600">確定要刪除「{storage.name || '未命名'}」？</span>
          <div className="flex gap-1">
            <button
              onClick={handleDelete}
              className="px-2 py-0.5 rounded bg-red-500 text-white hover:bg-red-600"
            >
              確認刪除
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-2 py-0.5 rounded bg-gray-200 hover:bg-gray-300 text-gray-600"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {isOpen && (
        <div className="p-2 space-y-2">
          <div className="grid grid-cols-2 gap-1">
            <label className="flex flex-col col-span-2">
              <span className="text-xs text-gray-400">名稱</span>
              <input
                type="text"
                value={name}
                onChange={e => {
                  setName(e.target.value)
                  update({ name: e.target.value })
                }}
                className="border border-gray-300 rounded px-1 py-0.5 text-sm"
              />
            </label>
            <label className="flex flex-col">
              <span className="text-xs text-gray-400">X 位置 (mm)</span>
              <NumberInput
                value={storage.position}
                min={0}
                max={state.track.length}
                step={100}
                onChange={n => update({ position: n })}
                className="w-full"
              />
            </label>
            <label className="flex flex-col">
              <span className="text-xs text-gray-400">側邊</span>
              <select
                value={storage.side}
                onChange={e => update({ side: e.target.value as StorageSide })}
                className="border border-gray-300 rounded px-1 py-0.5 text-sm"
              >
                <option value="left">左側</option>
                <option value="right">右側</option>
              </select>
            </label>
            <label className="flex flex-col col-span-2">
              <span className="text-xs text-gray-400">層數</span>
              <select
                value={storage.layers}
                onChange={e => update({ layers: parseInt(e.target.value) as LayerCount })}
                className="border border-gray-300 rounded px-1 py-0.5 text-sm"
              >
                <option value={1}>1 層</option>
                <option value={2}>2 層</option>
              </select>
            </label>
            <label className="flex flex-col">
              <span className="text-xs text-gray-400">寬度 (mm)</span>
              <NumberInput
                value={storage.width}
                min={50}
                step={50}
                onChange={n => update({ width: n })}
                className="w-full"
              />
            </label>
            <label className="flex flex-col">
              <span className="text-xs text-gray-400">深度 (mm)</span>
              <NumberInput
                value={storage.depth}
                min={50}
                step={50}
                onChange={n => update({ depth: n })}
                className="w-full"
              />
            </label>
          </div>

          <LayerForm
            label="第 1 層"
            value={storage.layer1}
            onChange={v => update({ layer1: v })}
          />
          {storage.layers === 2 && (
            <LayerForm
              label="第 2 層"
              value={storage.layer2}
              onChange={v => update({ layer2: v })}
            />
          )}
        </div>
      )}
    </div>
  )
}

export { defaultLayer }
