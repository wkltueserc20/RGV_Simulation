import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { calcTask, calcFlowTask } from '../lib/timeCalculator'
import type { FlowStep, SingleHistoryEntry, FlowHistoryEntry } from '../types'

interface Props {
  onResult: () => void
}

type TaskMode = 'single' | 'flow'

function StorageSelect({
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
}) {
  const { state } = useApp()
  const { storages } = state
  const sel = storages.find(s => s.id === value)
  return (
    <div className="flex gap-1 items-end">
      <label className="flex flex-col">
        <span className="text-xs text-gray-400">{label}</span>
        <select
          value={value}
          onChange={e => { onId(e.target.value); onLayer(1) }}
          className="border border-gray-300 rounded px-1 py-1 text-sm"
        >
          <option value="">— 選擇 —</option>
          {storages.map(s => <option key={s.id} value={s.id}>{s.name}  X:{s.position}mm</option>)}
        </select>
      </label>
      <label className="flex flex-col">
        <span className="text-xs text-gray-400">層</span>
        <select
          value={layer}
          onChange={e => onLayer(parseInt(e.target.value) as 1 | 2)}
          disabled={!sel}
          className="border border-gray-300 rounded px-1 py-1 text-sm w-16 disabled:opacity-50"
        >
          <option value={1}>第 1 層</option>
          {sel?.layers === 2 && <option value={2}>第 2 層</option>}
        </select>
      </label>
    </div>
  )
}

export default function TaskPanel({ onResult }: Props) {
  const { state, dispatch } = useApp()
  const { storages, rgv } = state

  const [mode, setMode] = useState<TaskMode>('single')
  const [error, setError] = useState('')

  // Single mode state
  const [pickId, setPickId] = useState('')
  const [pickLayer, setPickLayer] = useState<1 | 2>(1)
  const [placeId, setPlaceId] = useState('')
  const [placeLayer, setPlaceLayer] = useState<1 | 2>(1)

  // Flow mode state
  const [flowSteps, setFlowSteps] = useState<FlowStep[]>([
    { pickStorageId: '', pickLayer: 1, placeStorageId: '', placeLayer: 1 },
  ])

  const updateFlowStep = (i: number, patch: Partial<FlowStep>) => {
    setFlowSteps(prev => prev.map((s, idx) => idx === i ? { ...s, ...patch } : s))
  }

  const addFlowStep = () => {
    setFlowSteps(prev => [...prev, { pickStorageId: '', pickLayer: 1, placeStorageId: '', placeLayer: 1 }])
  }

  const removeFlowStep = (i: number) => {
    setFlowSteps(prev => prev.filter((_, idx) => idx !== i))
  }

  const runSingle = () => {
    const pickStorage = storages.find(s => s.id === pickId)
    const placeStorage = storages.find(s => s.id === placeId)
    if (storages.length === 0) { setError('請先新增庫位'); return }
    if (!pickStorage) { setError('請選擇取料庫位'); return }
    if (!placeStorage) { setError('請選擇放料庫位'); return }
    setError('')

    const result = calcTask(rgv, pickStorage, pickLayer, placeStorage, placeLayer)
    dispatch({ type: 'SET_LAST_RESULT', payload: result })

    const entry: SingleHistoryEntry = {
      type: 'single',
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

  const runFlow = () => {
    if (storages.length === 0) { setError('請先新增庫位'); return }
    if (flowSteps.length === 0) { setError('請至少新增一個步驟'); return }
    for (let i = 0; i < flowSteps.length; i++) {
      const s = flowSteps[i]
      if (!s.pickStorageId) { setError(`步驟 ${i + 1}：請選擇取料庫位`); return }
      if (!s.placeStorageId) { setError(`步驟 ${i + 1}：請選擇放料庫位`); return }
    }
    setError('')

    const result = calcFlowTask(rgv, flowSteps, storages)
    dispatch({ type: 'SET_LAST_FLOW_RESULT', payload: result })

    const histSteps = result.steps.map((sr, i) => {
      const pick = storages.find(s => s.id === sr.pickStorageId)
      const place = storages.find(s => s.id === sr.placeStorageId)
      const next = result.steps[i + 1]
      const nextPick = next ? storages.find(s => s.id === next.pickStorageId) : undefined
      return {
        pickStorageName: pick?.name ?? '',
        pickLayer: sr.pickLayer,
        placeStorageName: place?.name ?? '',
        placeLayer: sr.placeLayer,
        nextPickStorageName: nextPick?.name,
        sequentialTotal: sr.sequentialTotal,
        concurrentTotal: sr.concurrentTotal,
      }
    })

    const entry: FlowHistoryEntry = {
      type: 'flow',
      id: `h${Date.now()}`,
      timestamp: Date.now(),
      steps: histSteps,
      grandSequentialTotal: result.grandSequentialTotal,
      grandConcurrentTotal: result.grandConcurrentTotal,
    }
    dispatch({ type: 'ADD_HISTORY', payload: entry })
    onResult()
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 px-3 py-2">
      {/* Mode toggle */}
      <div className="flex items-center gap-3 mb-2">
        <span className="text-sm font-semibold text-gray-700">任務設定</span>
        <div className="flex rounded border border-gray-200 overflow-hidden text-xs">
          <button
            onClick={() => { setMode('single'); setError('') }}
            className={`px-3 py-1 ${mode === 'single' ? 'bg-blue-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            單一任務
          </button>
          <button
            onClick={() => { setMode('flow'); setError('') }}
            className={`px-3 py-1 ${mode === 'flow' ? 'bg-blue-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            流程任務
          </button>
        </div>
      </div>

      {/* Single mode */}
      {mode === 'single' && (
        <div className="flex flex-wrap items-end gap-2">
          <StorageSelect label="取料庫位" value={pickId} layer={pickLayer} onId={setPickId} onLayer={setPickLayer} />
          <span className="text-gray-300 self-end pb-1.5 shrink-0">→</span>
          <StorageSelect label="放料庫位" value={placeId} layer={placeLayer} onId={setPlaceId} onLayer={setPlaceLayer} />
          <button
            onClick={runSingle}
            className="shrink-0 px-4 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded"
          >
            ▶ 執行模擬
          </button>
        </div>
      )}

      {/* Flow mode */}
      {mode === 'flow' && (
        <div className="space-y-1">
          {flowSteps.map((step, i) => (
            <div key={i} className="flex flex-wrap items-end gap-2 bg-gray-50 rounded px-2 py-1.5">
              <span className="text-xs font-semibold text-gray-400 self-center w-4 shrink-0">{i + 1}</span>
              <StorageSelect
                label="取料"
                value={step.pickStorageId}
                layer={step.pickLayer}
                onId={id => updateFlowStep(i, { pickStorageId: id, pickLayer: 1 })}
                onLayer={l => updateFlowStep(i, { pickLayer: l })}
              />
              <span className="text-gray-300 self-end pb-1.5 shrink-0">→</span>
              <StorageSelect
                label="放料"
                value={step.placeStorageId}
                layer={step.placeLayer}
                onId={id => updateFlowStep(i, { placeStorageId: id, placeLayer: 1 })}
                onLayer={l => updateFlowStep(i, { placeLayer: l })}
              />
              {flowSteps.length > 1 && (
                <button
                  onClick={() => removeFlowStep(i)}
                  className="self-end pb-1 text-red-400 hover:text-red-600 text-sm shrink-0"
                  title="移除步驟"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <div className="flex gap-2 pt-1">
            <button
              onClick={addFlowStep}
              className="text-xs px-3 py-1.5 rounded border border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              + 新增步驟
            </button>
            <button
              onClick={runFlow}
              className="px-4 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded"
            >
              ▶ 執行流程
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}
