import { useState } from 'react'
import { useApp } from '../context/AppContext'

const fmt = (s: number) => s.toFixed(2) + 's'

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
              confirmClear
                ? 'bg-red-500 text-white'
                : 'bg-red-100 text-red-600 hover:bg-red-200'
            }`}
          >
            {confirmClear ? '確認清除' : '清除歷史'}
          </button>
        </div>
      </div>
      <div className="space-y-1 max-h-48 overflow-y-auto">
        {state.history.map(h => (
          <div
            key={h.id}
            className="text-xs bg-gray-50 rounded p-1.5 flex justify-between items-center"
          >
            <div>
              <span className="font-medium">
                {h.pickStorageName}-{h.pickLayer}層
              </span>
              {' → '}
              <span className="font-medium">
                {h.placeStorageName}-{h.placeLayer}層
              </span>
              <div className="text-gray-400 mt-0.5">
                序列 {fmt(h.sequentialTotal)} | 疊加 {fmt(h.concurrentTotal)}
              </div>
            </div>
            <div className="text-gray-400 text-right shrink-0 ml-2">
              {new Date(h.timestamp).toLocaleTimeString('zh-TW', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
