import { useRef, useState, useCallback, useEffect } from 'react'
import type { StepResult, AnimationState, SpeedMultiplier } from '../types'
import { getAnimationState } from '../lib/timeCalculator'

interface AnimationPlayerOptions {
  steps: StepResult[] | null
  rgvStartX: number
  pickStorageX: number
  placeStorageX: number
  travelHeight: number
  pickPickHeight: number
  pickPlaceHeight: number
  placePlaceHeight: number
  placePickHeight: number
  onFrame: (state: AnimationState) => void
}

interface PlayerControls {
  playing: boolean
  elapsed: number
  speed: SpeedMultiplier
  play: () => void
  pause: () => void
  reset: () => void
  setSpeed: (s: SpeedMultiplier) => void
}

export function useAnimationPlayer({
  steps,
  rgvStartX,
  pickStorageX,
  placeStorageX,
  travelHeight,
  pickPickHeight,
  pickPlaceHeight,
  placePlaceHeight,
  placePickHeight,
  onFrame,
}: AnimationPlayerOptions): PlayerControls {
  const [playing, setPlaying] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [speed, setSpeedState] = useState<SpeedMultiplier>(1)

  const rafRef = useRef<number>(0)
  const lastTsRef = useRef<number>(0)
  const elapsedRef = useRef<number>(0)
  const speedRef = useRef<SpeedMultiplier>(1)
  const stepsRef = useRef(steps)
  const paramsRef = useRef({ rgvStartX, pickStorageX, placeStorageX, travelHeight, pickPickHeight, pickPlaceHeight, placePlaceHeight, placePickHeight })

  useEffect(() => { stepsRef.current = steps }, [steps])
  useEffect(() => { speedRef.current = speed }, [speed])
  useEffect(() => {
    paramsRef.current = { rgvStartX, pickStorageX, placeStorageX, travelHeight, pickPickHeight, pickPlaceHeight, placePlaceHeight, placePickHeight }
  }, [rgvStartX, pickStorageX, placeStorageX, travelHeight, pickPickHeight, pickPlaceHeight, placePlaceHeight, placePickHeight])

  const totalTime = steps
    ? Math.max(...steps.map(s => s.startAt + s.duration), 0)
    : 0

  const callGetState = useCallback((t: number) => {
    const p = paramsRef.current
    return getAnimationState(
      stepsRef.current ?? [],
      t,
      p.rgvStartX, p.pickStorageX, p.placeStorageX,
      p.travelHeight, p.pickPickHeight, p.pickPlaceHeight, p.placePlaceHeight, p.placePickHeight,
    )
  }, [])

  const tick = useCallback((ts: number) => {
    if (!stepsRef.current) return
    const dt = lastTsRef.current ? (ts - lastTsRef.current) / 1000 : 0
    lastTsRef.current = ts
    elapsedRef.current = Math.min(
      elapsedRef.current + dt * speedRef.current,
      Math.max(...stepsRef.current.map(s => s.startAt + s.duration), 0)
    )
    setElapsed(elapsedRef.current)

    const animState = callGetState(elapsedRef.current)
    onFrame(animState)

    if (animState.done) {
      setPlaying(false)
      return
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [callGetState, onFrame])

  const play = useCallback(() => {
    if (!steps || steps.length === 0) return
    if (elapsedRef.current >= totalTime && totalTime > 0) {
      elapsedRef.current = 0
      setElapsed(0)
    }
    lastTsRef.current = 0
    setPlaying(true)
    rafRef.current = requestAnimationFrame(tick)
  }, [steps, totalTime, tick])

  const pause = useCallback(() => {
    setPlaying(false)
    cancelAnimationFrame(rafRef.current)
    lastTsRef.current = 0
  }, [])

  const reset = useCallback(() => {
    pause()
    elapsedRef.current = 0
    setElapsed(0)
    onFrame(callGetState(0))
  }, [pause, callGetState, onFrame])

  const setSpeed = useCallback((s: SpeedMultiplier) => {
    setSpeedState(s)
    speedRef.current = s
  }, [])

  useEffect(() => () => cancelAnimationFrame(rafRef.current), [])

  useEffect(() => {
    elapsedRef.current = 0
    setElapsed(0)
    setPlaying(false)
    cancelAnimationFrame(rafRef.current)
  }, [steps])

  return { playing, elapsed, speed, play, pause, reset, setSpeed }
}
