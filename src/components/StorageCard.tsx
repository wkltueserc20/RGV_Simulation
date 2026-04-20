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
    <div className="mt-1.5">
      <div className="mb-1">
        <div className={`text-[10px] font-semibold font-display tracking-widest ${accent}`}>{label}</div>
      </div>
      <div className="grid grid-cols-2 gap-1">
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

export default function StorageCard({ storage, isOpen, onToggle }: Props) {
  const { state, dispatch } = useApp()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [name, setName] = useState(storage.name)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [isOpen])

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
    <div
      ref={cardRef}
      className={`rounded mb-1 text-sm border-l-2 overflow-hidden transition-all duration-200 ${
        isOpen
          ? 'border-l-hmi-accent border border-hmi-accent/30 storage-card-active'
          : 'border-l-hmi-border border border-hmi-border/50 hover:border-hmi-border'
      }`}
    >
      {/* Header */}
      <div className={`flex items-center justify-between px-2 py-1.5 transition-colors ${
        isOpen ? 'bg-hmi-accent/8' : 'bg-hmi-card hover:bg-hmi-elevated'
      }`}>
        <button
          className="flex-1 text-left font-medium truncate"
          onClick={() => { onToggle(); setConfirmDelete(false) }}
        >
          <span className={isOpen ? 'text-hmi-accent' : 'text-hmi-primary'}>
            {storage.name || '（未命名）'}
          </span>
          <span className="text-[10px] text-hmi-muted font-mono ml-2">
            {storage.side === 'left' ? 'L' : 'R'} | X:{storage.position} | {storage.layers}層 | {storage.width}×{storage.depth}
          </span>
        </button>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => { onToggle(); setConfirmDelete(false) }}
            className="hmi-btn-ghost text-[10px] px-1.5 py-0.5"
          >
            {isOpen ? '收' : '編輯'}
          </button>
          <button
            onClick={handleDuplicate}
            className="text-[10px] px-1.5 py-0.5 rounded bg-hmi-accent/10 border border-hmi-accent/25 text-hmi-accent hover:bg-hmi-accent/20 transition-colors"
            title="複製此庫位"
          >
            複製
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className="hmi-btn-danger text-[10px] px-1.5 py-0.5"
          >
            刪除
          </button>
        </div>
      </div>

      {/* Confirm delete bar */}
      {confirmDelete && (
        <div className="flex items-center justify-between px-2 py-1.5 bg-hmi-error/8 border-t border-hmi-error/25 text-xs">
          <span className="text-hmi-error font-mono">確定刪除「{storage.name || '未命名'}」？</span>
          <div className="flex gap-1">
            <button onClick={handleDelete} className="hmi-btn-warning px-2 py-0.5 text-[10px]">
              確認刪除
            </button>
            <button onClick={() => setConfirmDelete(false)} className="hmi-btn-ghost px-2 py-0.5 text-[10px]">
              取消
            </button>
          </div>
        </div>
      )}

      {/* Expanded form */}
      {isOpen && (
        <div className="p-2 space-y-2 bg-hmi-base/30">
          <div className="grid grid-cols-2 gap-1">
            <label className="flex flex-col gap-0.5 col-span-2">
              <span className="hmi-label">名稱</span>
              <input
                type="text"
                value={name}
                onChange={e => { setName(e.target.value); update({ name: e.target.value }) }}
                className="hmi-input"
              />
            </label>
            <label className="flex flex-col gap-0.5">
              <span className="hmi-label">X 位置 (mm)</span>
              <NumberInput
                value={storage.position}
                min={0}
                max={state.track.length}
                step={100}
                onChange={n => update({ position: n })}
                className="w-full"
              />
            </label>
            <label className="flex flex-col gap-0.5">
              <span className="hmi-label">側邊</span>
              <select
                value={storage.side}
                onChange={e => update({ side: e.target.value as StorageSide })}
                className="hmi-select"
              >
                <option value="left">左側</option>
                <option value="right">右側</option>
              </select>
            </label>
            <label className="flex flex-col gap-0.5 col-span-2">
              <span className="hmi-label">層數</span>
              <select
                value={storage.layers}
                onChange={e => update({ layers: parseInt(e.target.value) as LayerCount })}
                className="hmi-select"
              >
                <option value={1}>1 層</option>
                <option value={2}>2 層</option>
              </select>
            </label>
            <label className="flex flex-col gap-0.5">
              <span className="hmi-label">寬度 (mm)</span>
              <NumberInput value={storage.width} min={50} step={50} onChange={n => update({ width: n })} className="w-full" />
            </label>
            <label className="flex flex-col gap-0.5">
              <span className="hmi-label">深度 (mm)</span>
              <NumberInput value={storage.depth} min={50} step={50} onChange={n => update({ depth: n })} className="w-full" />
            </label>
          </div>

          <div className="border-t border-hmi-border/40 pt-1">
            <LayerForm
              label="第 1 層"
              accent="text-hmi-axis-x"
              value={storage.layer1}
              onChange={v => update({ layer1: v })}
            />
            {storage.layers === 2 && (
              <LayerForm
                label="第 2 層"
                accent="text-hmi-axis-z"
                value={storage.layer2}
                onChange={v => update({ layer2: v })}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export { defaultLayer }
