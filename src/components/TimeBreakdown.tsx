import { useState } from 'react'
import { useApp } from '../context/AppContext'

const fmt   = (s: number) => s.toFixed(2) + 's'
const fmtMm = (mm: number) => mm.toFixed(0) + 'mm'

function AxisBadge({ axis }: { axis: string }) {
  if (axis === 'X') return <span className="axis-badge-x">{axis}</span>
  if (axis === 'Z') return <span className="axis-badge-z">{axis}</span>
  return <span className="axis-badge-y">{axis}</span>
}

export default function TimeBreakdown() {
  const { state } = useApp()
  const [expandedStep, setExpandedStep] = useState<number | null>(null)

  // ── Single mode ──
  if (state.lastResult) {
    const result = state.lastResult
    const isConc = state.rgv.motionMode === 'concurrent'
    const steps  = isConc ? result.concurrentSteps  : result.sequentialSteps
    const total  = isConc ? result.concurrentTotal   : result.sequentialTotal

    return (
      <div className="bg-hmi-panel border border-hmi-border rounded-lg p-3">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-4 bg-hmi-axis-x rounded-full" />
          <span className="hmi-title">時間明細</span>
          <span className="ml-1 text-[10px] font-mono text-hmi-muted border border-hmi-border px-1.5 py-px rounded bg-hmi-card">
            {isConc ? '疊加' : '序列'}
          </span>
        </div>

        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-hmi-border">
              <th className="text-left pb-1.5 text-hmi-muted font-display tracking-wide text-[10px] uppercase">步驟</th>
              <th className="text-right pb-1.5 text-hmi-muted font-display tracking-wide text-[10px] uppercase">距離</th>
              {isConc && <th className="text-right pb-1.5 text-hmi-muted font-display tracking-wide text-[10px] uppercase">開始</th>}
              <th className="text-right pb-1.5 text-hmi-muted font-display tracking-wide text-[10px] uppercase">時間</th>
            </tr>
          </thead>
          <tbody>
            {steps.map((s, i) => (
              <tr key={i} className="border-b border-hmi-border/40 hover:bg-hmi-elevated/50 transition-colors">
                <td className="py-1 flex items-center gap-1.5">
                  <AxisBadge axis={s.axis} />
                  <span className="text-hmi-secondary">{s.name}</span>
                </td>
                <td className="text-right text-hmi-muted font-mono tabular-nums">{fmtMm(s.distance)}</td>
                {isConc && <td className="text-right text-hmi-muted font-mono tabular-nums">{fmt(s.startAt)}</td>}
                <td className="text-right font-mono tabular-nums text-hmi-primary">{fmt(s.duration)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-hmi-border">
              <td colSpan={isConc ? 3 : 2} className="pt-2 font-semibold font-display tracking-wide text-hmi-secondary">
                總計
              </td>
              <td className="pt-2 text-right font-mono font-bold text-hmi-accent tabular-nums">
                {fmt(total)}
              </td>
            </tr>
            <tr>
              <td colSpan={isConc ? 3 : 2} className="text-hmi-muted text-[10px] font-mono pt-0.5">序列</td>
              <td className="text-right text-hmi-muted text-[10px] font-mono tabular-nums">{fmt(result.sequentialTotal)}</td>
            </tr>
            <tr>
              <td colSpan={isConc ? 3 : 2} className="text-hmi-muted text-[10px] font-mono">疊加</td>
              <td className="text-right text-hmi-muted text-[10px] font-mono tabular-nums">{fmt(result.concurrentTotal)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    )
  }

  // ── Flow mode ──
  if (state.lastFlowResult) {
    const flow  = state.lastFlowResult
    const isConc = state.rgv.motionMode === 'concurrent'
    const grandTotal = isConc ? flow.grandConcurrentTotal : flow.grandSequentialTotal

    return (
      <div className="bg-hmi-panel border border-hmi-border rounded-lg p-3">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-4 bg-hmi-axis-x rounded-full" />
          <span className="hmi-title">流程時間明細</span>
          <span className="ml-1 text-[10px] font-mono text-hmi-muted border border-hmi-border px-1.5 py-px rounded bg-hmi-card">
            {isConc ? '疊加' : '序列'}
          </span>
        </div>

        <div className="space-y-1">
          {flow.steps.map((step, i) => {
            const pick  = state.storages.find(s => s.id === step.pickStorageId)
            const place = state.storages.find(s => s.id === step.placeStorageId)
            const total = isConc ? step.concurrentTotal : step.sequentialTotal
            const steps = isConc ? step.concurrentSteps : step.sequentialSteps
            const isExpanded = expandedStep === i

            return (
              <div key={i} className="border border-hmi-border/60 rounded overflow-hidden">
                <button
                  onClick={() => setExpandedStep(isExpanded ? null : i)}
                  className="w-full flex items-center justify-between px-2 py-1.5 text-xs hover:bg-hmi-elevated transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-hmi-muted font-mono w-5 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                    <span className="font-medium text-hmi-primary">
                      {pick?.name ?? '?'}<span className="text-hmi-muted">-{step.pickLayer}L</span>
                      <span className="text-hmi-muted mx-1">→</span>
                      {place?.name ?? '?'}<span className="text-hmi-muted">-{step.placeLayer}L</span>
                    </span>
                    <span className="text-hmi-muted text-[10px] font-mono">{fmtMm(step.startX)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-hmi-accent tabular-nums">{fmt(total)}</span>
                    <span className="text-hmi-muted text-[10px]">{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="bg-hmi-card/50 px-2 pb-2 border-t border-hmi-border/40">
                    <table className="w-full text-xs mt-1">
                      <tbody>
                        {steps.map((s, j) => (
                          <tr key={j} className="border-t border-hmi-border/30">
                            <td className="py-0.5 flex items-center gap-1.5">
                              <AxisBadge axis={s.axis} />
                              <span className="text-hmi-secondary">{s.name}</span>
                            </td>
                            <td className="text-right text-hmi-muted font-mono tabular-nums">{fmtMm(s.distance)}</td>
                            <td className="text-right font-mono text-hmi-primary tabular-nums">{fmt(s.duration)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-2.5 pt-2 border-t border-hmi-border flex justify-between items-center">
          <span className="text-sm font-semibold font-display tracking-wide text-hmi-secondary">總計</span>
          <span className="font-mono font-bold text-hmi-accent tabular-nums">{fmt(grandTotal)}</span>
        </div>
        <div className="flex justify-between text-[10px] text-hmi-muted font-mono mt-0.5">
          <span>序列</span><span className="tabular-nums">{fmt(flow.grandSequentialTotal)}</span>
        </div>
        <div className="flex justify-between text-[10px] text-hmi-muted font-mono">
          <span>疊加</span><span className="tabular-nums">{fmt(flow.grandConcurrentTotal)}</span>
        </div>
      </div>
    )
  }

  return null
}
