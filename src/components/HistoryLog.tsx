import { useState } from 'react'
import { useApp } from '../context/AppContext'
import type { SingleHistoryEntry, FlowHistoryEntry, HistoryEntry } from '../types'

const fmt = (s: number) => s.toFixed(2) + 's'

function SingleRow({ h }: { h: SingleHistoryEntry }) {
  return (
    <div className="text-xs bg-gray-50 rounded p-1.5 flex justify-between items-center">
      <div>
        <span className="font-medium">{h.pickStorageName}-{h.pickLayer}層</span>
        {' → '}
        <span className="font-medium">{h.placeStorageName}-{h.placeLayer}層</span>
        <div className="text-gray-400 mt-0.5">
          序列 {fmt(h.sequentialTotal)} | 疊加 {fmt(h.concurrentTotal)}
        </div>
      </div>
      <div className="text-gray-400 text-right shrink-0 ml-2">
        {new Date(h.timestamp).toLocaleTimeString('zh-TW', {
          hour: '2-digit', minute: '2-digit', second: '2-digit',
        })}
      </div>
    </div>
  )
}

function FlowRow({ h }: { h: FlowHistoryEntry }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="text-xs bg-gray-50 rounded overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex justify-between items-center p-1.5 hover:bg-gray-100"
      >
        <div className="flex items-center gap-1.5">
          <span className="text-gray-400">{open ? '▼' : '▶'}</span>
          <span className="font-medium text-gray-700">流程任務</span>
          <span className="text-gray-400">({h.steps.length} 步驟)</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-blue-600 font-mono">{fmt(h.grandConcurrentTotal)}</span>
          <span className="text-gray-400">
            {new Date(h.timestamp).toLocaleTimeString('zh-TW', {
              hour: '2-digit', minute: '2-digit', second: '2-digit',
            })}
          </span>
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-200 px-2 py-1 space-y-0.5">
          {h.steps.map((step, i) => (
            <div key={i}>
              <div className="flex justify-between py-0.5">
                <span>
                  <span className="text-gray-400 mr-1">{i + 1}.</span>
                  <span className="font-medium">{step.pickStorageName}-{step.pickLayer}層</span>
                  {' → '}
                  <span className="font-medium">{step.placeStorageName}-{step.placeLayer}層</span>
                </span>
                <span className="font-mono text-gray-600 shrink-0 ml-2">{fmt(step.concurrentTotal)}</span>
              </div>
              {step.nextPickStorageName && (
                <div className="text-gray-400 pl-4 py-0.5 text-xs">
                  移動 {step.placeStorageName} → {step.nextPickStorageName}
                </div>
              )}
            </div>
          ))}
          <div className="border-t border-gray-100 pt-1 flex justify-between text-gray-500">
            <span>序列 {fmt(h.grandSequentialTotal)} | 疊加 {fmt(h.grandConcurrentTotal)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

function isFlowEntry(h: HistoryEntry): h is FlowHistoryEntry {
  return (h as FlowHistoryEntry).type === 'flow'
}

function isSingleEntry(h: HistoryEntry): h is SingleHistoryEntry {
  return (h as SingleHistoryEntry).type === 'single' || !(h as FlowHistoryEntry).type
}

export default function HistoryLog() {
  const { state, dispatch } = useApp()
  const [confirmClear, setConfirmClear] = useState(false)

  if (state.history.length === 0) {
    return (
      <div className="border border-gray-200 rounded-lg p-3">
        <div className="text-sm font-semibold text-gray-700 mb-1">歷史紀錄</div>
        <p className="text-xs text-gray-400 text-center py-2">尚無紀錄</p>
      </div>
    )
  }

  const handleClear = () => {
    if (confirmClear) {
      dispatch({ type: 'CLEAR_HISTORY' })
      setConfirmClear(false)
    } else {
      setConfirmClear(true)
    }
  }

  return (
    <div className="border border-gray-200 rounded-lg p-3">
      <div className="flex justify-between items-center mb-2">
        <div className="text-sm font-semibold text-gray-700">
          歷史紀錄 ({state.history.length})
        </div>
        <div className="flex gap-1">
          {confirmClear && (
            <button
              onClick={() => setConfirmClear(false)}
              className="text-xs px-2 py-0.5 rounded bg-gray-200 hover:bg-gray-300"
            >
              取消
            </button>
          )}
          <button
            onClick={handleClear}
            className={`text-xs px-2 py-0.5 rounded ${
              confirmClear ? 'bg-red-500 text-white' : 'bg-red-100 text-red-600 hover:bg-red-200'
            }`}
          >
            {confirmClear ? '確認清除' : '清除歷史'}
          </button>
        </div>
      </div>
      <div className="space-y-1 max-h-48 overflow-y-auto">
        {state.history.map(h => (
          isFlowEntry(h)
            ? <FlowRow key={h.id} h={h} />
            : isSingleEntry(h)
              ? <SingleRow key={h.id} h={h as SingleHistoryEntry} />
              : null
        ))}
      </div>
    </div>
  )
}
