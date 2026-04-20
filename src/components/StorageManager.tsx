import { useState, useCallback } from 'react'
import { useApp } from '../context/AppContext'
import StorageCard from './StorageCard'
import StorageModal from './StorageModal'

interface Props {
  openStorageId: string | null
  onOpenChange: (id: string | null) => void
}

export default function StorageManager({ openStorageId, onOpenChange }: Props) {
  const { state, dispatch } = useApp()
  const [showModal, setShowModal] = useState(false)
  const [globalOpen, setGlobalOpen] = useState(false)
  const [sizeMsg, setSizeMsg] = useState('')
  const [depthMsg, setDepthMsg] = useState('')

  const [bulkWidth, setBulkWidth]   = useState('')
  const [bulkDepth, setBulkDepth]   = useState('')
  const [bulkL1Pick, setBulkL1Pick]   = useState('')
  const [bulkL1Place, setBulkL1Place] = useState('')
  const [bulkL2Pick, setBulkL2Pick]   = useState('')
  const [bulkL2Place, setBulkL2Place] = useState('')

  const nextName = `庫${String.fromCharCode(65 + state.storages.length)}`
  const sorted   = [...state.storages].sort((a, b) => a.position - b.position)

  const handleToggle = (id: string) => {
    onOpenChange(openStorageId === id ? null : id)
  }

  const showFeedback = useCallback((setter: (m: string) => void, msg: string) => {
    setter(msg)
    setTimeout(() => setter(''), 2500)
  }, [])

  const applySize = () => {
    const w = bulkWidth !== '' ? Number(bulkWidth) : null
    const d = bulkDepth !== '' ? Number(bulkDepth) : null
    if (w === null && d === null) return
    state.storages.forEach(s => {
      dispatch({
        type: 'UPDATE_STORAGE',
        payload: {
          ...s,
          ...(w !== null ? { width: w }  : {}),
          ...(d !== null ? { depth: d }  : {}),
        },
      })
    })
    showFeedback(setSizeMsg, `✓ 已套用至 ${state.storages.length} 個庫位`)
  }

  const applyDepth = () => {
    const l1Pick  = bulkL1Pick  !== '' ? Number(bulkL1Pick)  : null
    const l1Place = bulkL1Place !== '' ? Number(bulkL1Place) : null
    const l2Pick  = bulkL2Pick  !== '' ? Number(bulkL2Pick)  : null
    const l2Place = bulkL2Place !== '' ? Number(bulkL2Place) : null
    if (l1Pick === null && l1Place === null && l2Pick === null && l2Place === null) return
    state.storages.forEach(s => {
      dispatch({
        type: 'UPDATE_STORAGE',
        payload: {
          ...s,
          layer1: {
            ...s.layer1,
            ...(l1Pick  !== null ? { pickDepth:  l1Pick  } : {}),
            ...(l1Place !== null ? { placeDepth: l1Place } : {}),
          },
          layer2: s.layers === 2 ? {
            ...s.layer2,
            ...(l2Pick  !== null ? { pickDepth:  l2Pick  } : {}),
            ...(l2Place !== null ? { placeDepth: l2Place } : {}),
          } : s.layer2,
        },
      })
    })
    showFeedback(setDepthMsg, `✓ 已套用至 ${state.storages.length} 個庫位`)
  }

  const inputCls = 'hmi-input'

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-1 h-4 bg-hmi-axis-z rounded-full" />
        <span className="hmi-title">庫位管理</span>
      </div>

      {/* Add storage */}
      <button
        onClick={() => setShowModal(true)}
        className="hmi-btn-primary w-full justify-center py-1.5 text-sm"
      >
        + 新增庫位
      </button>

      {/* Global bulk apply */}
      <div className="border border-hmi-border/60 rounded overflow-hidden text-xs">
        <button
          className="hmi-collapsible-trigger w-full"
          onClick={() => setGlobalOpen(o => !o)}
        >
          <span>全域套用</span>
          <span className="text-hmi-muted text-[10px]">{globalOpen ? '▲' : '▼'}</span>
        </button>

        {globalOpen && (
          <div className="p-2 space-y-3 bg-hmi-card/50">
            {/* Size block */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-semibold font-display tracking-widest text-hmi-muted uppercase">尺寸</div>
              <div className="grid grid-cols-2 gap-1">
                <label className="flex flex-col gap-0.5">
                  <span className="hmi-label">寬度 (mm)</span>
                  <input
                    type="number" min={50} step={50} placeholder="—"
                    value={bulkWidth} onChange={e => setBulkWidth(e.target.value)}
                    className={inputCls}
                  />
                </label>
                <label className="flex flex-col gap-0.5">
                  <span className="hmi-label">深度 (mm)</span>
                  <input
                    type="number" min={50} step={50} placeholder="—"
                    value={bulkDepth} onChange={e => setBulkDepth(e.target.value)}
                    className={inputCls}
                  />
                </label>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={applySize}
                  disabled={state.storages.length === 0}
                  className="flex-1 py-1 text-xs rounded bg-hmi-accent/15 border border-hmi-accent/30 text-hmi-accent hover:bg-hmi-accent/25 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-display tracking-wide"
                >
                  套用尺寸
                </button>
                {sizeMsg && <span className="text-xs text-hmi-success font-mono">{sizeMsg}</span>}
              </div>
            </div>

            {/* Depth block */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-semibold font-display tracking-widest text-hmi-muted uppercase">深度設定</div>
              <div className="text-[10px] text-hmi-axis-x font-display tracking-wide">第 1 層</div>
              <div className="grid grid-cols-2 gap-1">
                <label className="flex flex-col gap-0.5">
                  <span className="hmi-label">取料深度</span>
                  <input
                    type="number" min={0} step={10} placeholder="—"
                    value={bulkL1Pick} onChange={e => setBulkL1Pick(e.target.value)}
                    className={inputCls}
                  />
                </label>
                <label className="flex flex-col gap-0.5">
                  <span className="hmi-label">放料深度</span>
                  <input
                    type="number" min={0} step={10} placeholder="—"
                    value={bulkL1Place} onChange={e => setBulkL1Place(e.target.value)}
                    className={inputCls}
                  />
                </label>
              </div>
              <div className="text-[10px] text-hmi-axis-z font-display tracking-wide mt-1">第 2 層（僅 2 層庫位）</div>
              <div className="grid grid-cols-2 gap-1">
                <label className="flex flex-col gap-0.5">
                  <span className="hmi-label">取料深度</span>
                  <input
                    type="number" min={0} step={10} placeholder="—"
                    value={bulkL2Pick} onChange={e => setBulkL2Pick(e.target.value)}
                    className={inputCls}
                  />
                </label>
                <label className="flex flex-col gap-0.5">
                  <span className="hmi-label">放料深度</span>
                  <input
                    type="number" min={0} step={10} placeholder="—"
                    value={bulkL2Place} onChange={e => setBulkL2Place(e.target.value)}
                    className={inputCls}
                  />
                </label>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={applyDepth}
                  disabled={state.storages.length === 0}
                  className="flex-1 py-1 text-xs rounded bg-hmi-axis-z/15 border border-hmi-axis-z/30 text-hmi-axis-z hover:bg-hmi-axis-z/25 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-display tracking-wide"
                >
                  套用深度
                </button>
                {depthMsg && <span className="text-xs text-hmi-success font-mono">{depthMsg}</span>}
              </div>
            </div>
          </div>
        )}
      </div>

      {state.storages.length === 0 && (
        <p className="text-xs text-hmi-muted text-center py-6 font-mono">— 尚無庫位 —</p>
      )}

      <div className="space-y-0.5">
        {sorted.map(s => (
          <StorageCard
            key={s.id}
            storage={s}
            isOpen={openStorageId === s.id}
            onToggle={() => handleToggle(s.id)}
          />
        ))}
      </div>

      {showModal && (
        <StorageModal
          nextName={nextName}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
