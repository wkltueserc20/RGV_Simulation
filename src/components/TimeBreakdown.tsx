import { useState } from 'react'
import { useApp } from '../context/AppContext'

const fmt = (s: number) => s.toFixed(2) + 's'
const fmtMm = (mm: number) => mm.toFixed(0) + 'mm'

const axisColor: Record<string, string> = {
  X: 'bg-blue-100 text-blue-700',
  Z: 'bg-orange-100 text-orange-700',
  Y: 'bg-green-100 text-green-700',
}

export default function TimeBreakdown() {
  const { state } = useApp()
  const [expandedStep, setExpandedStep] = useState<number | null>(null)

  // ── Single mode ──
  if (state.lastResult) {
    const result = state.lastResult
    const isConc = state.rgv.motionMode === 'concurrent'
    const steps = isConc ? result.concurrentSteps : result.sequentialSteps
    const total = isConc ? result.concurrentTotal : result.sequentialTotal

    return (
      <div className="border border-gray-200 rounded-lg p-3">
        <div className="text-sm font-semibold text-gray-700 mb-2">
          時間明細
          <span className="ml-2 text-xs font-normal text-gray-400">
            ({isConc ? '疊加模式' : '序列模式'})
          </span>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-400 border-b">
              <th className="text-left pb-1">步驟</th>
              <th className="text-right pb-1">距離</th>
              {isConc && <th className="text-right pb-1">開始</th>}
              <th className="text-right pb-1">時間</th>
            </tr>
          </thead>
          <tbody>
            {steps.map((s, i) => (
              <tr key={i} className="border-b border-gray-50">
                <td className="py-0.5 flex items-center gap-1">
                  <span className={`text-xs px-1 rounded font-mono ${axisColor[s.axis]}`}>{s.axis}</span>
                  {s.name}
                </td>
                <td className="text-right text-gray-500">{fmtMm(s.distance)}</td>
                {isConc && <td className="text-right text-gray-400">{fmt(s.startAt)}</td>}
                <td className="text-right font-mono">{fmt(s.duration)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-semibold text-sm">
              <td colSpan={isConc ? 3 : 2} className="pt-2 text-gray-600">總計</td>
              <td className="pt-2 text-right text-blue-600">{fmt(total)}</td>
            </tr>
            <tr className="text-xs text-gray-400">
              <td colSpan={isConc ? 3 : 2}>序列總計</td>
              <td className="text-right">{fmt(result.sequentialTotal)}</td>
            </tr>
            <tr className="text-xs text-gray-400">
              <td colSpan={isConc ? 3 : 2}>疊加總計</td>
              <td className="text-right">{fmt(result.concurrentTotal)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    )
  }

  // ── Flow mode ──
  if (state.lastFlowResult) {
    const flow = state.lastFlowResult
    const isConc = state.rgv.motionMode === 'concurrent'
    const grandTotal = isConc ? flow.grandConcurrentTotal : flow.grandSequentialTotal

    return (
      <div className="border border-gray-200 rounded-lg p-3">
        <div className="text-sm font-semibold text-gray-700 mb-2">
          流程時間明細
          <span className="ml-2 text-xs font-normal text-gray-400">
            ({isConc ? '疊加模式' : '序列模式'})
          </span>
        </div>

        <div className="space-y-1">
          {flow.steps.map((step, i) => {
            const pick = state.storages.find(s => s.id === step.pickStorageId)
            const place = state.storages.find(s => s.id === step.placeStorageId)
            const total = isConc ? step.concurrentTotal : step.sequentialTotal
            const steps = isConc ? step.concurrentSteps : step.sequentialSteps
            const isExpanded = expandedStep === i

            return (
              <div key={i} className="border border-gray-100 rounded">
                <button
                  onClick={() => setExpandedStep(isExpanded ? null : i)}
                  className="w-full flex items-center justify-between px-2 py-1.5 text-xs hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 font-semibold w-4">{i + 1}</span>
                    <span className="font-medium text-gray-700">
                      {pick?.name ?? '?'}-{step.pickLayer}層 → {place?.name ?? '?'}-{step.placeLayer}層
                    </span>
                    <span className="text-gray-400 text-xs">出發 {fmtMm(step.startX)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-blue-600">{fmt(total)}</span>
                    <span className="text-gray-400">{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-2 pb-2">
                    <table className="w-full text-xs">
                      <tbody>
                        {steps.map((s, j) => (
                          <tr key={j} className="border-t border-gray-50">
                            <td className="py-0.5 flex items-center gap-1">
                              <span className={`px-1 rounded font-mono ${axisColor[s.axis]}`}>{s.axis}</span>
                              {s.name}
                            </td>
                            <td className="text-right text-gray-400">{fmtMm(s.distance)}</td>
                            <td className="text-right font-mono text-gray-600">{fmt(s.duration)}</td>
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

        <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between text-sm font-semibold">
          <span className="text-gray-600">總計</span>
          <span className="text-blue-600">{fmt(grandTotal)}</span>
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-0.5">
          <span>序列總計</span><span>{fmt(flow.grandSequentialTotal)}</span>
        </div>
        <div className="flex justify-between text-xs text-gray-400">
          <span>疊加總計</span><span>{fmt(flow.grandConcurrentTotal)}</span>
        </div>
      </div>
    )
  }

  return null
}
