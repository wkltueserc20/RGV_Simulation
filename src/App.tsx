import { useCallback, useMemo, useState } from 'react'
import type { StepResult } from './types'

/** Convert sequential steps (all startAt=0) to animation-ready steps with cumulative startAt */
function withCumulativeStartAt(steps: StepResult[]): StepResult[] {
  let t = 0
  return steps.map(s => {
    const result = { ...s, startAt: t }
    t += s.duration
    return result
  })
}
import { AppProvider, useApp } from './context/AppContext'
import RGVConfigPanel from './components/RGVConfig'
import TrackConfigPanel from './components/TrackConfig'
import StorageManager from './components/StorageManager'
import TaskPanel from './components/TaskPanel'
import TimeBreakdown from './components/TimeBreakdown'
import HistoryLog from './components/HistoryLog'
import TopViewSVG from './components/TopViewSVG'
import SideViewSVG from './components/SideViewSVG'
import AnimationControls from './components/AnimationControls'
import { useAnimationPlayer } from './hooks/useAnimationPlayer'
import { useFlowAnimationPlayer } from './hooks/useFlowAnimationPlayer'
import type { AnimationState } from './types'

type SideTab = 'rgv' | 'track' | 'storage'

function SimulationPage() {
  const { state } = useApp()
  const [animState, setAnimState] = useState<AnimationState | null>(null)
  const [sideTab, setSideTab] = useState<SideTab>('rgv')
  const [openStorageId, setOpenStorageId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  // For flow mode: track which step is currently animating (for SVG highlighting)
  const [flowAnimStepIndex, setFlowAnimStepIndex] = useState(0)

  const handleStorageClick = useCallback((id: string) => {
    setSideTab('storage')
    setOpenStorageId(id)
  }, [])

  // ── Single mode ──
  const result = state.lastResult
  const pickStorage = state.storages.find(s => s.id === result?.pickStorageId)
  const placeStorage = state.storages.find(s => s.id === result?.placeStorageId)
  const animSteps = useMemo(
    () => result ? withCumulativeStartAt(result.sequentialSteps) : null,
    [result]
  )
  const pickLayerData = result ? (result.pickLayer === 1 ? pickStorage?.layer1 : pickStorage?.layer2) : undefined
  const placeLayerData = result ? (result.placeLayer === 1 ? placeStorage?.layer1 : placeStorage?.layer2) : undefined

  const onSingleFrame = useCallback((s: AnimationState) => setAnimState(s), [])

  const singlePlayer = useAnimationPlayer({
    steps: animSteps,
    rgvStartX: state.rgv.startPosition,
    pickStorageX: pickStorage?.position ?? 0,
    placeStorageX: placeStorage?.position ?? 0,
    travelHeight: state.rgv.travelHeight,
    pickPickHeight: pickLayerData?.pickHeight ?? 0,
    pickPlaceHeight: pickLayerData?.placeHeight ?? 0,
    placePlaceHeight: placeLayerData?.placeHeight ?? 0,
    placePickHeight: placeLayerData?.pickHeight ?? 0,
    onFrame: onSingleFrame,
  })

  const singleTotalTime = animSteps
    ? Math.max(...animSteps.map(s => s.startAt + s.duration), 0)
    : 0

  // ── Flow mode ──
  const flowResult = state.lastFlowResult
  const flowAnimSteps = useMemo(() => {
    if (!flowResult) return null
    return flowResult.steps
      .map(sr => {
        const pick = state.storages.find(s => s.id === sr.pickStorageId)
        const place = state.storages.find(s => s.id === sr.placeStorageId)
        if (!pick || !place) return null
        return { stepResult: sr, pickStorage: pick, placeStorage: place, travelHeight: state.rgv.travelHeight }
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
  }, [flowResult, state.storages, state.rgv.travelHeight])

  const onFlowFrame = useCallback((s: AnimationState, idx: number) => {
    setAnimState(s)
    setFlowAnimStepIndex(idx)
  }, [])

  const flowPlayer = useFlowAnimationPlayer({
    flowSteps: flowAnimSteps,
    rgvStartX: state.rgv.startPosition,
    onFrame: onFlowFrame,
  })

  // ── Active player ──
  const isFlowMode = !!flowResult
  const player = isFlowMode
    ? { playing: flowPlayer.playing, elapsed: flowPlayer.elapsed, speed: flowPlayer.speed, play: flowPlayer.play, pause: flowPlayer.pause, reset: flowPlayer.reset, setSpeed: flowPlayer.setSpeed }
    : { playing: singlePlayer.playing, elapsed: singlePlayer.elapsed, speed: singlePlayer.speed, play: singlePlayer.play, pause: singlePlayer.pause, reset: singlePlayer.reset, setSpeed: singlePlayer.setSpeed }

  const totalTime = isFlowMode ? flowPlayer.totalTime : singleTotalTime
  const hasResult = isFlowMode ? !!flowResult : !!result

  // SVG highlight IDs — for flow mode show current animated step's pick/place
  const svgPickId = isFlowMode
    ? (flowResult?.steps[flowAnimStepIndex]?.pickStorageId ?? '')
    : (result?.pickStorageId ?? '')
  const svgPlaceId = isFlowMode
    ? (flowResult?.steps[flowAnimStepIndex]?.placeStorageId ?? '')
    : (result?.placeStorageId ?? '')

  const handleResult = useCallback(() => {
    setAnimState(null)
    singlePlayer.reset()
    flowPlayer.reset()
    setFlowAnimStepIndex(0)
  }, [singlePlayer, flowPlayer])

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-3">
        <div className="text-lg font-bold text-blue-700">RGV 模擬系統</div>
        <div className="text-xs text-gray-400">Rail Guided Vehicle Simulator</div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Config Panel */}
        <aside className={`bg-white border-r border-gray-200 flex flex-col flex-shrink-0 transition-all duration-200 ${sidebarOpen ? 'w-80' : 'w-12'}`}>
          {sidebarOpen ? (
            <>
              <div className="flex border-b border-gray-200 shrink-0">
                {([
                  { key: 'rgv', label: 'RGV 設定' },
                  { key: 'track', label: '軌道' },
                  { key: 'storage', label: `庫位 (${state.storages.length})` },
                ] as { key: SideTab; label: string }[]).map(t => (
                  <button
                    key={t.key}
                    onClick={() => setSideTab(t.key)}
                    className={`flex-1 py-2 text-xs font-semibold transition-colors ${
                      sideTab === t.key
                        ? 'border-b-2 border-blue-500 text-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="px-2 text-gray-400 hover:text-gray-600 border-l border-gray-200"
                  title="收合側欄"
                >
                  ◀
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                {sideTab === 'rgv' && <RGVConfigPanel />}
                {sideTab === 'track' && <TrackConfigPanel />}
                {sideTab === 'storage' && (
                  <StorageManager
                    openStorageId={openStorageId}
                    onOpenChange={setOpenStorageId}
                  />
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center pt-2">
              <button
                onClick={() => setSidebarOpen(true)}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                title="展開側欄"
              >
                ▶
              </button>
            </div>
          )}
        </aside>

        {/* Right: Simulation + Results */}
        <main className="flex-1 overflow-y-auto p-3 space-y-3">
          <TaskPanel onResult={handleResult} />

          <div className="bg-white rounded-lg border border-gray-200 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-700">模擬視圖</div>
              {isFlowMode && flowResult && (
                <div className="text-xs text-gray-400">
                  步驟 {flowAnimStepIndex + 1}/{flowResult.steps.length}
                </div>
              )}
            </div>

            <TopViewSVG state={state} anim={animState} highlightPickId={svgPickId} highlightPlaceId={svgPlaceId} onStorageClick={handleStorageClick} />

            <AnimationControls
              playing={player.playing}
              elapsed={player.elapsed}
              totalTime={totalTime}
              speed={player.speed}
              hasResult={hasResult}
              onPlay={player.play}
              onPause={player.pause}
              onReset={player.reset}
              onSpeed={player.setSpeed}
            />

            <div className="flex gap-2 items-start">
              <div className="w-72 flex-shrink-0">
                <SideViewSVG state={state} anim={animState} flowStepIndex={isFlowMode ? flowAnimStepIndex : undefined} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            <TimeBreakdown />
            <HistoryLog />
          </div>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <SimulationPage />
    </AppProvider>
  )
}
