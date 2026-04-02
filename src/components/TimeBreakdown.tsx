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
  const result = state.lastResult
  if (!result) return null

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
              {isConc && (
                <td className="text-right text-gray-400">{fmt(s.startAt)}</td>
              )}
              <td className="text-right font-mono">{fmt(s.duration)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="font-semibold text-sm">
            <td colSpan={isConc ? 3 : 2} className="pt-2 text-gray-600">總計</td>
            <td className="pt-2 text-right text-blue-600">{fmt(total)}</td>
          </tr>
          {/* always show both modes for comparison */}
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
