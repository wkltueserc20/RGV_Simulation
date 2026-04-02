import { useState } from 'react'
import { useApp } from '../context/AppContext'
import type { StorageLocation, StorageLayer, StorageSide, LayerCount } from '../types'
import NumberInput from './NumberInput'

interface Props {
  storage: StorageLocation
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

export default function StorageCard({ storage }: Props) {
  const { state, dispatch } = useApp()
  const [open, setOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [name, setName] = useState(storage.name)

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

  return (
    <div className="border border-gray-200 rounded mb-1 text-sm">
      <div className="flex items-center justify-between px-2 py-1.5 bg-gray-50">
        <button
          className="flex-1 text-left font-medium truncate"
          onClick={() => setOpen(o => !o)}
        >
          {storage.name || '（未命名）'}
          <span className="text-xs text-gray-400 ml-2">
            {storage.side === 'left' ? '左' : '右'} | X:{storage.position} | {storage.layers}層
          </span>
        </button>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => { setOpen(o => !o); setConfirmDelete(false) }}
            className="text-xs px-1.5 py-0.5 rounded bg-gray-200 hover:bg-gray-300"
          >
            {open ? '收' : '編輯'}
          </button>
          <button
            onClick={handleDelete}
            className={`text-xs px-1.5 py-0.5 rounded ${confirmDelete ? 'bg-red-500 text-white' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
          >
            {confirmDelete ? '確認刪除' : '刪除'}
          </button>
          {confirmDelete && (
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-xs px-1.5 py-0.5 rounded bg-gray-200 hover:bg-gray-300"
            >
              取消
            </button>
          )}
        </div>
      </div>

      {open && (
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
