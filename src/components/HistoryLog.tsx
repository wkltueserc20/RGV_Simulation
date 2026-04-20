import { useState } from 'react'
import { useApp } from '../context/AppContext'
import type { SingleHistoryEntry, FlowHistoryEntry, HistoryEntry } from '../types'

const fmt = (s: number) => s.toFixed(2) + 's'

function TimeTag({ label, value }: { label: string; value: string }) {
  return (
    <span className="text-[10px] font-mono text-hmi-muted">
      {label}&thinsp;<span className="text-hmi-secondary">{value}</span>
    </span>
  )
}

function SingleRow({ h }: { h: SingleHistoryEntry }) {
  return (
    <div className="text-xs bg-hmi-card border border-hmi-border/60 rounded px-2 py-1.5 flex justify-between items-start gap-2">
      <div className="min-w-0">
        <div className="text-hmi-primary font-medium truncate">
          <span>{h.pickStorageName}</span>
          <span className="text-hmi-muted">-{h.pickLayer}L</span>
          <span className="text-hmi-muted mx-1">→</span>
          <span>{h.placeStorageName}</span>
          <span className="text-hmi-muted">-{h.placeLayer}L</span>
        </div>
        <div className="flex gap-2 mt-0.5">
          <TimeTag label="序列" value={fmt(h.sequentialTotal)} />
          <TimeTag label="疊加" value={fmt(h.concurrentTotal)} />
        </div>
      </div>
      <div className="text-hmi-muted text-[10px] font-mono shrink-0">
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
    <div className="text-xs bg-hmi-card border border-hmi-border/60 rounded overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex justify-between items-center px-2 py-1.5 hover:bg-hmi-elevated transition-colors"
      >
        <div className="flex items-center gap-1.5">
          <span className="text-hmi-muted text-[10px]">{open ? '▼' : '▶'}</span>
          <span className="font-semibold font-display tracking-wide text-hmi-primary">流程任務</span>
          <span className="text-hmi-muted text-[10px] font-mono">({h.steps.length} 步驟)</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-hmi-accent font-mono tabular-nums">{fmt(h.grandConcurrentTotal)}</span>
          <span className="text-hmi-muted text-[10px] font-mono">
            {new Date(h.timestamp).toLocaleTimeString('zh-TW', {
              hour: '2-digit', minute: '2-digit', second: '2-digit',
            })}
          </span>
        </div>
      </button>

      {open && (
        <div className="border-t border-hmi-border/40 px-2 py-1.5 space-y-0.5 bg-hmi-elevated/30">
          {h.steps.map((step, i) => (
            <div key={i}>
              <div className="flex justify-between py-0.5">
                <span className="text-hmi-secondary">
                  <span className="text-hmi-muted font-mono mr-1">{String(i + 1).padStart(2, '0')}.</span>
                  <span className="font-medium text-hmi-primary">{step.pickStorageName}</span>
                  <span className="text-hmi-muted">-{step.pickLayer}L</span>
                  <span className="text-hmi-muted mx-1">→</span>
                  <span className="font-medium text-hmi-primary">{step.placeStorageName}</span>
                  <span className="text-hmi-muted">-{step.placeLayer}L</span>
                </span>
                <span className="font-mono text-hmi-primary tabular-nums shrink-0 ml-2">{fmt(step.concurrentTotal)}</span>
              </div>
              {step.nextPickStorageName && (
                <div className="text-hmi-muted pl-6 text-[10px] font-mono">
                  ↓ {step.placeStorageName} → {step.nextPickStorageName}
                </div>
              )}
            </div>
          ))}
          <div className="border-t border-hmi-border/40 pt-1 flex gap-3 text-hmi-muted">
            <TimeTag label="序列" value={fmt(h.grandSequentialTotal)} />
            <TimeTag label="疊加" value={fmt(h.grandConcurrentTotal)} />
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
      <div className="bg-hmi-panel border border-hmi-border rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1 h-4 bg-hmi-secondary rounded-full" />
          <span className="hmi-title">歷史紀錄</span>
        </div>
        <p className="text-xs text-hmi-muted text-center py-4 font-mono">— 尚無紀錄 —</p>
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
    <div className="bg-hmi-panel border border-hmi-border rounded-lg p-3">
      <div className="flex justify-between items-center mb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-hmi-secondary rounded-full" />
          <span className="hmi-title">歷史紀錄</span>
          <span className="text-[10px] font-mono text-hmi-muted bg-hmi-card border border-hmi-border px-1.5 py-px rounded">
            {state.history.length}
          </span>
        </div>
        <div className="flex gap-1">
          {confirmClear && (
            <button
              onClick={() => setConfirmClear(false)}
              className="hmi-btn-ghost"
            >
              取消
            </button>
          )}
          <button
            onClick={handleClear}
            className={confirmClear ? 'hmi-btn-warning' : 'hmi-btn-danger'}
          >
            {confirmClear ? '確認清除' : '清除'}
          </button>
        </div>
      </div>

      <div className="space-y-1 max-h-52 overflow-y-auto pr-0.5">
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
