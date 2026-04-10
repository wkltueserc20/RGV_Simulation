import { useState, useCallback } from 'react'
import { useApp } from '../context/AppContext'
import StorageCard from './StorageCard'
import StorageModal from './StorageModal'

interface Props {
  openStorageId: string | null
  onOpenChange: (id: string | null) => void
}

const inputCls = 'w-full border border-gray-300 rounded px-1 py-0.5 text-xs'

export default function StorageManager({ openStorageId, onOpenChange }: Props) {
  const { state, dispatch } = useApp()
  const [showModal, setShowModal] = useState(false)
  const [globalOpen, setGlobalOpen] = useState(false)
  const [sizeMsg, setSizeMsg] = useState('')
  const [depthMsg, setDepthMsg] = useState('')

  // Bulk size fields
  const [bulkWidth, setBulkWidth] = useState('')
  const [bulkDepth, setBulkDepth] = useState('')

  // Bulk depth fields
  const [bulkL1Pick, setBulkL1Pick] = useState('')
  const [bulkL1Place, setBulkL1Place] = useState('')
  const [bulkL2Pick, setBulkL2Pick] = useState('')
  const [bulkL2Place, setBulkL2Place] = useState('')

  const nextName = `庫${String.fromCharCode(65 + state.storages.length)}`
  const sorted = [...state.storages].sort((a, b) => a.position - b.position)

  const handleToggle = (id: string) => {
    onOpenChange(openStorageId === id ? null : id)
  }

  const showFeedback = useCallback((setter: (m: string) => void, msg: string) => {
    setter(msg)
    setTimeout(() => setter(''), 2000)
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
          ...(w !== null ? { width: w } : {}),
          ...(d !== null ? { depth: d } : {}),
        },
      })
    })
    showFeedback(setSizeMsg, `✓ 已套用到 ${state.storages.length} 個庫位`)
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
    showFeedback(setDepthMsg, `✓ 已套用到 ${state.storages.length} 個庫位`)
  }

  return (
    <div>
      {/* 全域套用面板 */}
      <div className="border border-gray-200 rounded mb-2 text-xs">
        <button
          className="w-full flex items-center justify-between px-2 py-1.5 bg-gray-50 hover:bg-gray-100 font-medium text-gray-600"
          onClick={() => setGlobalOpen(o => !o)}
        >
          <span>全域套用</span>
          <span className="text-gray-400">{globalOpen ? '▲' : '▼'}</span>
        </button>

        {globalOpen && (
          <div className="p-2 space-y-3">
            {/* 尺寸區塊 */}
            <div className="space-y-1">
              <div className="text-xs font-semibold text-gray-500">尺寸</div>
              <div className="grid grid-cols-2 gap-1">
                <label className="flex flex-col">
                  <span className="text-xs text-gray-400 mb-0.5">寬度 (mm)</span>
                  <input
                    type="number"
                    min={50}
                    step={50}
                    placeholder="—"
                    value={bulkWidth}
                    onChange={e => setBulkWidth(e.target.value)}
                    className={inputCls}
                  />
                </label>
                <label className="flex flex-col">
                  <span className="text-xs text-gray-400 mb-0.5">深度 (mm)</span>
                  <input
                    type="number"
                    min={50}
                    step={50}
                    placeholder="—"
                    value={bulkDepth}
                    onChange={e => setBulkDepth(e.target.value)}
                    className={inputCls}
                  />
                </label>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={applySize}
                  disabled={state.storages.length === 0}
                  className="flex-1 py-1 text-xs rounded bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  套用尺寸到全部
                </button>
                {sizeMsg && <span className="text-xs text-green-600 whitespace-nowrap">{sizeMsg}</span>}
              </div>
            </div>

            {/* 深度設定區塊 */}
            <div className="space-y-1">
              <div className="text-xs font-semibold text-gray-500">深度設定</div>
              <div className="text-xs text-gray-400 mb-0.5">第 1 層</div>
              <div className="grid grid-cols-2 gap-1">
                <label className="flex flex-col">
                  <span className="text-xs text-gray-400 mb-0.5">取料深度 (mm)</span>
                  <input
                    type="number"
                    min={0}
                    step={10}
                    placeholder="—"
                    value={bulkL1Pick}
                    onChange={e => setBulkL1Pick(e.target.value)}
                    className={inputCls}
                  />
                </label>
                <label className="flex flex-col">
                  <span className="text-xs text-gray-400 mb-0.5">放料深度 (mm)</span>
                  <input
                    type="number"
                    min={0}
                    step={10}
                    placeholder="—"
                    value={bulkL1Place}
                    onChange={e => setBulkL1Place(e.target.value)}
                    className={inputCls}
                  />
                </label>
              </div>
              <div className="text-xs text-gray-400 mt-1 mb-0.5">第 2 層（僅套用至 2 層庫位）</div>
              <div className="grid grid-cols-2 gap-1">
                <label className="flex flex-col">
                  <span className="text-xs text-gray-400 mb-0.5">取料深度 (mm)</span>
                  <input
                    type="number"
                    min={0}
                    step={10}
                    placeholder="—"
                    value={bulkL2Pick}
                    onChange={e => setBulkL2Pick(e.target.value)}
                    className={inputCls}
                  />
                </label>
                <label className="flex flex-col">
                  <span className="text-xs text-gray-400 mb-0.5">放料深度 (mm)</span>
                  <input
                    type="number"
                    min={0}
                    step={10}
                    placeholder="—"
                    value={bulkL2Place}
                    onChange={e => setBulkL2Place(e.target.value)}
                    className={inputCls}
                  />
                </label>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={applyDepth}
                  disabled={state.storages.length === 0}
                  className="flex-1 py-1 text-xs rounded bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  套用深度到全部
                </button>
                {depthMsg && <span className="text-xs text-green-600 whitespace-nowrap">{depthMsg}</span>}
              </div>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => setShowModal(true)}
        className="w-full mb-2 py-1.5 text-sm rounded bg-blue-500 hover:bg-blue-600 text-white font-medium"
      >
        + 新增庫位
      </button>

      {state.storages.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-4">尚無庫位</p>
      )}

      {sorted.map(s => (
        <StorageCard
          key={s.id}
          storage={s}
          isOpen={openStorageId === s.id}
          onToggle={() => handleToggle(s.id)}
        />
      ))}

      {showModal && (
        <StorageModal
          nextName={nextName}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
