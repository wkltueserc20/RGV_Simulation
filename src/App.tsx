import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import type { StepResult } from './types'

// Lazy-load SimView3D so Three.js (~170 KB gzip) only loads when switched to 3D
const SimView3D = lazy(() => import('./components/SimView3D'))

type ViewMode = '2d' | '3d'

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
  const { state, dispatch } = useApp()
  const [animState, setAnimState] = useState<AnimationState | null>(null)
  const [sideTab, setSideTab] = useState<SideTab>('rgv')
  const [openStorageId, setOpenStorageId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [importError, setImportError] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('2d')

  const exportConfig = useCallback(() => {
    const data = JSON.stringify({ version: 1, rgv: state.rgv, track: state.track, storages: state.storages }, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'rgv-config.json'
    a.click()
    URL.revokeObjectURL(url)
  }, [state.rgv, state.track, state.storages])

  const importConfig = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const parsed = JSON.parse(reader.result as string)
          if (!parsed.rgv || !parsed.track || !Array.isArray(parsed.storages)) {
            throw new Error('格式錯誤')
          }
          dispatch({ type: 'LOAD_CONFIG', payload: { rgv: parsed.rgv, track: parsed.track, storages: parsed.storages } })
        } catch {
          setImportError('檔案格式錯誤，請選擇正確的設定檔')
          setTimeout(() => setImportError(''), 3000)
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }, [dispatch])

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

  // Simulation always treats the pick storage as having goods — no persistent state needed.
  // pickLayerHasGoods=true makes the cargo box appear on the fork during carrying phases ④-⑩.
  const onSingleFrame = useCallback((s: AnimationState) => {
    setAnimState({ ...s, pickLayerHasGoods: true })
  }, [])

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

  // Snapshot storages at the moment flowResult changes — animation positions don't
  // depend on hasGoods, so we must NOT re-derive flowAnimSteps whenever a storage
  // hasGoods update is dispatched (that would reset the player mid-animation).
  type FlowAnimStep = {
    stepResult: NonNullable<typeof flowResult>['steps'][number]
    pickStorage: typeof state.storages[number]
    placeStorage: typeof state.storages[number]
    travelHeight: number
  }
  const [flowAnimSteps, setFlowAnimSteps] = useState<FlowAnimStep[] | null>(null)

  useEffect(() => {
    if (!flowResult) { setFlowAnimSteps(null); return }
    setFlowAnimSteps(
      flowResult.steps
        .map(sr => {
          const pick = state.storages.find(s => s.id === sr.pickStorageId)
          const place = state.storages.find(s => s.id === sr.placeStorageId)
          if (!pick || !place) return null
          return { stepResult: sr, pickStorage: pick, placeStorage: place, travelHeight: state.rgv.travelHeight }
        })
        .filter((x): x is FlowAnimStep => x !== null)
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flowResult, state.rgv.travelHeight])  // intentionally excludes state.storages

  const onFlowFrame = useCallback((s: AnimationState, idx: number) => {
    // pickLayerHasGoods=true: cargo box always visible on fork during carrying phases ④-⑩
    setAnimState({ ...s, pickLayerHasGoods: true })
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
    <div className="h-screen bg-hmi-base flex flex-col font-sans">

      {/* ── Header ──────────────────────────────────────── */}
      <header className="bg-hmi-panel border-b border-hmi-border px-4 py-2 flex items-center gap-3 shrink-0 shadow-panel">
        {/* Logo mark */}
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-sm bg-hmi-accent/20 border border-hmi-accent/40 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="5" width="12" height="4" rx="1" fill="#00C8FF" opacity="0.3" />
              <rect x="1" y="5" width="12" height="4" rx="1" stroke="#00C8FF" strokeWidth="0.8" />
              <rect x="4" y="3" width="3" height="8" rx="0.5" fill="#00C8FF" opacity="0.6" />
              <circle cx="7" cy="7" r="1.2" fill="#00C8FF" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-bold font-display tracking-widest hmi-title-shimmer leading-none">
              RGV 模擬系統
            </div>
            <div className="text-[10px] text-hmi-muted font-mono tracking-widest leading-tight mt-0.5">
              RAIL GUIDED VEHICLE SIMULATOR
            </div>
          </div>
        </div>

        {/* Status dot */}
        <div className="flex items-center gap-1.5 ml-2">
          <div className="w-1.5 h-1.5 rounded-full bg-hmi-success shadow-glow-y" />
          <span className="text-[10px] text-hmi-muted font-mono tracking-wide">READY</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {importError && (
            <span className="text-xs text-hmi-error font-mono bg-hmi-error/10 border border-hmi-error/30 px-2 py-0.5 rounded">
              {importError}
            </span>
          )}
          <button onClick={exportConfig} className="hmi-btn-ghost">
            ↓ 匯出
          </button>
          <button onClick={importConfig} className="hmi-btn-ghost">
            ↑ 匯入
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Left sidebar ────────────────────────────── */}
        <aside className={`bg-hmi-panel border-r border-hmi-border flex flex-col flex-shrink-0 transition-all duration-200 ${sidebarOpen ? 'w-80' : 'w-12'}`}>
          {sidebarOpen ? (
            <>
              {/* Tab bar */}
              <div className="flex border-b border-hmi-border shrink-0">
                {([
                  { key: 'rgv',     label: 'RGV' },
                  { key: 'track',   label: '軌道' },
                  { key: 'storage', label: `庫位 (${state.storages.length})` },
                ] as { key: SideTab; label: string }[]).map(t => (
                  <button
                    key={t.key}
                    onClick={() => setSideTab(t.key)}
                    className={`flex-1 py-2 text-xs font-semibold font-display tracking-wide transition-all duration-150 ${
                      sideTab === t.key
                        ? 'border-b-2 border-hmi-accent text-hmi-accent'
                        : 'text-hmi-secondary hover:text-hmi-primary hover:bg-hmi-elevated'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="px-2 text-hmi-muted hover:text-hmi-secondary hover:bg-hmi-elevated border-l border-hmi-border transition-colors"
                  title="收合側欄"
                >
                  ◀
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3">
                {sideTab === 'rgv'     && <RGVConfigPanel />}
                {sideTab === 'track'   && <TrackConfigPanel />}
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
                className="w-8 h-8 flex items-center justify-center text-hmi-muted hover:text-hmi-secondary hover:bg-hmi-elevated rounded transition-colors"
                title="展開側欄"
              >
                ▶
              </button>
            </div>
          )}
        </aside>

        {/* ── Main area ───────────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-3 space-y-3 bg-hmi-base">

          <TaskPanel onResult={handleResult} />

          {/* Simulation view */}
          <div className="bg-hmi-panel rounded-lg border border-hmi-border p-3 space-y-2.5">
            {/* Header row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-hmi-accent rounded-full" />
                <span className="hmi-title">模擬視圖</span>
              </div>
              <div className="flex items-center gap-2">
                {isFlowMode && flowResult && (
                  <div className="text-xs text-hmi-secondary font-mono bg-hmi-card border border-hmi-border px-2 py-0.5 rounded">
                    STEP&nbsp;
                    <span className="text-hmi-accent">{flowAnimStepIndex + 1}</span>
                    &nbsp;/&nbsp;{flowResult.steps.length}
                  </div>
                )}
                {/* 2D / 3D view toggle */}
                <div className="flex rounded border border-hmi-border overflow-hidden text-xs">
                  {(['2d', '3d'] as ViewMode[]).map((m, i) => (
                    <button
                      key={m}
                      onClick={() => setViewMode(m)}
                      className={`px-2.5 py-0.5 font-display tracking-widest uppercase transition-all duration-150 ${
                        i > 0 ? 'border-l border-hmi-border' : ''
                      } ${
                        viewMode === m
                          ? 'bg-hmi-accent text-hmi-base font-bold shadow-glow-sm'
                          : 'text-hmi-secondary hover:bg-hmi-elevated hover:text-hmi-primary'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 2D view: TopView + SideView */}
            {viewMode === '2d' && (
              <>
                <TopViewSVG
                  state={state}
                  anim={animState}
                  highlightPickId={svgPickId}
                  highlightPlaceId={svgPlaceId}
                  onStorageClick={handleStorageClick}
                />
                <div className="flex gap-2 items-start">
                  <div className="w-72 flex-shrink-0">
                    <SideViewSVG
                      state={state}
                      anim={animState}
                      flowStepIndex={isFlowMode ? flowAnimStepIndex : undefined}
                    />
                  </div>
                </div>
              </>
            )}

            {/* 3D view: React Three Fiber scene */}
            {viewMode === '3d' && (
              <Suspense
                fallback={
                  <div className="w-full border border-hmi-border rounded-lg flex items-center justify-center"
                       style={{ height: '340px', background: '#F2F5F9' }}>
                    <div className="flex items-center gap-2 text-hmi-secondary font-mono text-xs">
                      <span className="w-2 h-2 rounded-full bg-hmi-accent animate-pulse" />
                      載入 3D 場景...
                    </div>
                  </div>
                }
              >
                <SimView3D
                  state={state}
                  anim={animState}
                  highlightPickId={svgPickId}
                  highlightPlaceId={svgPlaceId}
                />
              </Suspense>
            )}

            {/* Animation controls — always visible regardless of view mode */}
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
