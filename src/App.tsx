import { useCallback, useState } from 'react'
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
import type { AnimationState } from './types'

function SimulationPage() {
  const { state } = useApp()
  const [animState, setAnimState] = useState<AnimationState | null>(null)

  const result = state.lastResult
  const pickStorage = state.storages.find(s => s.id === result?.pickStorageId)
  const placeStorage = state.storages.find(s => s.id === result?.placeStorageId)

  // Use concurrent steps for animation (shows full timeline)
  const animSteps = result?.concurrentSteps ?? null

  const onFrame = useCallback((s: AnimationState) => setAnimState(s), [])

  const pickLayerData = result
    ? (result.pickLayer === 1 ? pickStorage?.layer1 : pickStorage?.layer2)
    : undefined
  const placeLayerData = result
    ? (result.placeLayer === 1 ? placeStorage?.layer1 : placeStorage?.layer2)
    : undefined

  const player = useAnimationPlayer({
    steps: animSteps,
    rgvStartX: state.rgv.startPosition,
    pickStorageX: pickStorage?.position ?? 0,
    placeStorageX: placeStorage?.position ?? 0,
    travelHeight: state.rgv.travelHeight,
    pickPickHeight: pickLayerData?.pickHeight ?? 0,
    pickPlaceHeight: pickLayerData?.placeHeight ?? 0,
    placePlaceHeight: placeLayerData?.placeHeight ?? 0,
    placePickHeight: placeLayerData?.pickHeight ?? 0,
    onFrame,
  })

  const totalTime = animSteps
    ? Math.max(...animSteps.map(s => s.startAt + s.duration), 0)
    : 0

  const handleResult = useCallback(() => {
    setAnimState(null)
    player.reset()
  }, [player])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-3">
        <div className="text-lg font-bold text-blue-700">RGV 模擬系統</div>
        <div className="text-xs text-gray-400">Rail Guided Vehicle Simulator</div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Config Panel */}
        <aside className="w-72 bg-white border-r border-gray-200 overflow-y-auto p-3 flex-shrink-0">
          <RGVConfigPanel />
          <TrackConfigPanel />
          <StorageManager />
        </aside>

        {/* Right: Simulation + Results */}
        <main className="flex-1 overflow-y-auto p-3 space-y-3">
          {/* Simulation View */}
          <div className="bg-white rounded-lg border border-gray-200 p-3 space-y-2">
            <div className="text-sm font-semibold text-gray-700">模擬視圖</div>

            {/* Top view */}
            <TopViewSVG state={state} anim={animState} />

            {/* Animation controls */}
            <AnimationControls
              playing={player.playing}
              elapsed={player.elapsed}
              totalTime={totalTime}
              speed={player.speed}
              hasResult={!!result}
              onPlay={player.play}
              onPause={player.pause}
              onReset={player.reset}
              onSpeed={player.setSpeed}
            />

            {/* Side view */}
            <SideViewSVG state={state} anim={animState} />
          </div>

          {/* Task + Results */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            <div className="space-y-3">
              <TaskPanel onResult={handleResult} />
              <TimeBreakdown />
            </div>
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
