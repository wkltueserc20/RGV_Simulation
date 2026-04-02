import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { calcTask } from '../lib/timeCalculator'
import type { HistoryEntry } from '../types'

interface Props {
  onResult: () => void
}

export default function TaskPanel({ onResult }: Props) {
  const { state, dispatch } = useApp()
  const { storages, rgv } = state

  const [pickId, setPickId] = useState('')
  const [pickLayer, setPickLayer] = useState<1 | 2>(1)
  const [placeId, setPlaceId] = useState('')
  const [placeLayer, setPlaceLayer] = useState<1 | 2>(1)
  const [error, setError] = useState('')

  const pickStorage = storages.find(s => s.id === pickId)
  const placeStorage = storages.find(s => s.id === placeId)

  const run = () => {
    if (storages.length === 0) { setError('請先新增庫位'); return }
    if (!pickStorage) { setError('請選擇取料庫位'); return }
    if (!placeStorage) { setError('請選擇放料庫位'); return }
    setError('')

    const result = calcTask(rgv, pickStorage, pickLayer, placeStorage, placeLayer)
    dispatch({ type: 'SET_LAST_RESULT', payload: result })

    const entry: HistoryEntry = {
      id: `h${Date.now()}`,
      timestamp: Date.now(),
      pickStorageName: pickStorage.name,
      pickLayer,
      placeStorageName: placeStorage.name,
      placeLayer,
      sequentialTotal: result.sequentialTotal,
      concurrentTotal: result.concurrentTotal,
    }
    dispatch({ type: 'ADD_HISTORY', payload: entry })
    onResult()
  }

  const StorageSelect = ({
    label,
    value,
    layer,
    onId,
    onLayer,
  }: {
    label: string
    value: string
    layer: 1 | 2
    onId: (id: string) => void
    onLayer: (l: 1 | 2) => void
  }) => {
    const sel = storages.find(s => s.id === value)
    return (
      <div className="flex gap-2 items-end">
        <label className="flex flex-col flex-1">
          <span className="text-xs text-gray-400">{label}</span>
          <select
            value={value}
            onChange={e => { onId(e.target.value); onLayer(1) }}
            className="border border-gray-300 rounded px-1 py-1 text-sm"
          >
            <option value="">— 選擇庫位 —</option>
            {storages.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col w-16">
          <span className="text-xs text-gray-400">層</span>
          <select
            value={layer}
            onChange={e => onLayer(parseInt(e.target.value) as 1 | 2)}
            disabled={!sel}
            className="border border-gray-300 rounded px-1 py-1 text-sm disabled:opacity-50"
          >
            <option value={1}>第 1 層</option>
            {sel?.layers === 2 && <option value={2}>第 2 層</option>}
          </select>
        </label>
      </div>
    )
  }

  return (
    <div className="border border-gray-200 rounded-lg p-3 space-y-2">
      <div className="text-sm font-semibold text-gray-700">任務設定</div>
      <StorageSelect
        label="取料庫位"
        value={pickId}
        layer={pickLayer}
        onId={setPickId}
        onLayer={setPickLayer}
      />
      <StorageSelect
        label="放料庫位"
        value={placeId}
        layer={placeLayer}
        onId={setPlaceId}
        onLayer={setPlaceLayer}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <button
        onClick={run}
        className="w-full py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded"
      >
        ▶ 執行模擬
      </button>
    </div>
  )
}
