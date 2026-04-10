import { useRef, useState, useCallback, useEffect } from 'react'
import type { FlowStepResult, AnimationState, SpeedMultiplier, StorageLocation, StepResult } from '../types'
import { getAnimationState } from '../lib/timeCalculator'

function withCumulativeStartAt(steps: StepResult[]): StepResult[] {
  let t = 0
  return steps.map(s => {
    const result = { ...s, startAt: t }
    t += s.duration
    return result
  })
}

interface FlowAnimStep {
  stepResult: FlowStepResult
  pickStorage: StorageLocation
  placeStorage: StorageLocation
  travelHeight: number
}

interface FlowPlayerOptions {
  flowSteps: FlowAnimStep[] | null
  rgvStartX: number
  onFrame: (state: AnimationState, stepIndex: number) => void
}

interface FlowPlayerControls {
  playing: boolean
  elapsed: number       // global elapsed across all steps
  totalTime: number
  speed: SpeedMultiplier
  currentStepIndex: number
  play: () => void
  pause: () => void
  reset: () => void
  setSpeed: (s: SpeedMultiplier) => void
}

function stepTotalTime(step: FlowStepResult) {
  return step.sequentialSteps.reduce((sum, s) => sum + s.duration, 0)
}

export function useFlowAnimationPlayer({
  flowSteps,
  rgvStartX,
  onFrame,
}: FlowPlayerOptions): FlowPlayerControls {
  const [playing, setPlaying] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [speed, setSpeedState] = useState<SpeedMultiplier>(1)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)

  const rafRef = useRef<number>(0)
  const lastTsRef = useRef<number>(0)
  const elapsedRef = useRef<number>(0)
  const stepIndexRef = useRef<number>(0)
  const speedRef = useRef<SpeedMultiplier>(1)
  const flowStepsRef = useRef(flowSteps)
  const rgvStartXRef = useRef(rgvStartX)

  useEffect(() => { flowStepsRef.current = flowSteps }, [flowSteps])
  useEffect(() => { speedRef.current = speed }, [speed])
  useEffect(() => { rgvStartXRef.current = rgvStartX }, [rgvStartX])

  // Compute per-step start times (cumulative)
  const stepStartTimes: number[] = []
  const stepDurations: number[] = []
  let cumulative = 0
  if (flowSteps) {
    for (const fs of flowSteps) {
      stepStartTimes.push(cumulative)
      const d = stepTotalTime(fs.stepResult)
      stepDurations.push(d)
      cumulative += d
    }
  }
  const totalTime = cumulative

  const stepStartTimesRef = useRef(stepStartTimes)
  const stepDurationsRef = useRef(stepDurations)
  useEffect(() => {
    stepStartTimesRef.current = stepStartTimes
    stepDurationsRef.current = stepDurations
  })

  const getFrameAt = useCallback((globalElapsed: number) => {
    const steps = flowStepsRef.current
    if (!steps || steps.length === 0) return

    const starts = stepStartTimesRef.current
    const durs = stepDurationsRef.current

    // Find which step we're in
    let idx = steps.length - 1
    for (let i = 0; i < steps.length; i++) {
      if (globalElapsed < starts[i] + durs[i]) { idx = i; break }
    }

    const fs = steps[idx]
    const localElapsed = globalElapsed - starts[idx]

    const pick = fs.pickStorage
    const place = fs.placeStorage
    const pickLayerData = fs.stepResult.pickLayer === 1 ? pick.layer1 : pick.layer2
    const placeLayerData = fs.stepResult.placeLayer === 1 ? place.layer1 : place.layer2

    const animState = getAnimationState(
      withCumulativeStartAt(fs.stepResult.sequentialSteps),
      localElapsed,
      fs.stepResult.startX,
      pick.position,
      place.position,
      fs.travelHeight,
      pickLayerData.pickHeight,
      pickLayerData.placeHeight,
      placeLayerData.placeHeight,
      placeLayerData.pickHeight,
    )

    stepIndexRef.current = idx
    setCurrentStepIndex(idx)
    onFrame(animState, idx)
    return animState
  }, [onFrame])

  const tick = useCallback((ts: number) => {
    const steps = flowStepsRef.current
    if (!steps) return
    const total = stepStartTimesRef.current.reduce((s, _, i) => s + stepDurationsRef.current[i], 0)
    const dt = lastTsRef.current ? (ts - lastTsRef.current) / 1000 : 0
    lastTsRef.current = ts
    elapsedRef.current = Math.min(elapsedRef.current + dt * speedRef.current, total)
    setElapsed(elapsedRef.current)

    getFrameAt(elapsedRef.current)

    if (elapsedRef.current >= total) {
      setPlaying(false)
      return
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [getFrameAt])

  const play = useCallback(() => {
    if (!flowSteps || flowSteps.length === 0) return
    if (elapsedRef.current >= totalTime && totalTime > 0) {
      elapsedRef.current = 0
      setElapsed(0)
      setCurrentStepIndex(0)
    }
    lastTsRef.current = 0
    setPlaying(true)
    rafRef.current = requestAnimationFrame(tick)
  }, [flowSteps, totalTime, tick])

  const pause = useCallback(() => {
    setPlaying(false)
    cancelAnimationFrame(rafRef.current)
    lastTsRef.current = 0
  }, [])

  const reset = useCallback(() => {
    pause()
    elapsedRef.current = 0
    setElapsed(0)
    setCurrentStepIndex(0)
    stepIndexRef.current = 0
    getFrameAt(0)
  }, [pause, getFrameAt])

  const setSpeed = useCallback((s: SpeedMultiplier) => {
    setSpeedState(s)
    speedRef.current = s
  }, [])

  useEffect(() => () => cancelAnimationFrame(rafRef.current), [])

  useEffect(() => {
    elapsedRef.current = 0
    setElapsed(0)
    setPlaying(false)
    setCurrentStepIndex(0)
    cancelAnimationFrame(rafRef.current)
  }, [flowSteps])

  return { playing, elapsed, totalTime, speed, currentStepIndex, play, pause, reset, setSpeed }
}
