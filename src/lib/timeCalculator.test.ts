import { describe, it, expect } from 'vitest'
import { calcMoveTime, calcSequentialTask, calcConcurrentTask } from './timeCalculator'
import type { RGVConfig, StorageLocation, StepResult } from '../types'

const axis = (maxSpeed: number, accel: number, decel: number) => ({ maxSpeed, accel, decel })

describe('calcMoveTime', () => {
  it('returns 0 for zero distance', () => {
    expect(calcMoveTime(0, axis(1000, 500, 500))).toBe(0)
  })

  it('returns 0 for negative distance', () => {
    expect(calcMoveTime(-100, axis(1000, 500, 500))).toBe(0)
  })

  it('trapezoidal profile — symmetric accel/decel', () => {
    // v=1000, a=500, d=500
    // d_acc = 1000²/(2*500) = 1000, d_dec = 1000
    // distance=5000 >= 2000 → trapezoidal
    // t = 1000/500 + (5000-2000)/1000 + 1000/500 = 2 + 3 + 2 = 7
    const t = calcMoveTime(5000, axis(1000, 500, 500))
    expect(t).toBeCloseTo(7.0, 5)
  })

  it('triangular profile — distance too short to reach max speed', () => {
    // v=1000, a=500, d=500
    // d_acc=1000, d_dec=1000, total=2000 > distance=500 → triangular
    // v_peak = sqrt(2*500*500*500/1000) = sqrt(250000) = 500
    // t = 500/500 + 500/500 = 2.0
    const t = calcMoveTime(500, axis(1000, 500, 500))
    expect(t).toBeCloseTo(2.0, 5)
  })

  it('trapezoidal profile — asymmetric accel/decel', () => {
    // v=600, a=300, d=200
    // d_acc = 600²/(2*300) = 600, d_dec = 600²/(2*200) = 900
    // total_ramp = 1500, distance=3000 >= 1500 → trapezoidal
    // t = 600/300 + (3000-1500)/600 + 600/200 = 2 + 2.5 + 3 = 7.5
    const t = calcMoveTime(3000, axis(600, 300, 200))
    expect(t).toBeCloseTo(7.5, 5)
  })

  it('triangular profile — asymmetric accel/decel', () => {
    // v=600, a=300, d=200, distance=100
    // v_peak = sqrt(2*100*300*200/(300+200)) = sqrt(24000) ≈ 154.92
    // t = 154.92/300 + 154.92/200 ≈ 0.5164 + 0.7746 ≈ 1.291
    const vPeak = Math.sqrt((2 * 100 * 300 * 200) / (300 + 200))
    const expected = vPeak / 300 + vPeak / 200
    const t = calcMoveTime(100, axis(600, 300, 200))
    expect(t).toBeCloseTo(expected, 5)
  })

  it('exactly at boundary between triangular and trapezoidal', () => {
    // v=1000, a=500, d=500 → boundary at distance=2000
    const t = calcMoveTime(2000, axis(1000, 500, 500))
    // t = 1000/500 + 0 + 1000/500 = 4.0
    expect(t).toBeCloseTo(4.0, 5)
  })
})

describe('calcSequentialTask — 12 steps', () => {
  const rgv: RGVConfig = {
    length: 1200, width: 800, height: 600,
    startPosition: 0, travelHeight: 0, motionMode: 'sequential',
    travel: axis(1000, 500, 500),
    lift: axis(200, 100, 100),
    fork: axis(300, 200, 200),
  }
  const pickStorage: StorageLocation = {
    id: 'A', name: 'A', position: 2000, side: 'left', layers: 1,
    layer1: { pickHeight: 200, pickDepth: 800, placeHeight: 400, placeDepth: 800 },
    layer2: { pickHeight: 200, pickDepth: 800, placeHeight: 400, placeDepth: 800 },
  }
  const placeStorage: StorageLocation = {
    id: 'B', name: 'B', position: 5000, side: 'right', layers: 1,
    layer1: { pickHeight: 300, pickDepth: 600, placeHeight: 500, placeDepth: 600 },
    layer2: { pickHeight: 300, pickDepth: 600, placeHeight: 500, placeDepth: 600 },
  }

  it('produces exactly 12 steps', () => {
    const steps = calcSequentialTask(rgv, pickStorage, 1, placeStorage, 1)
    expect(steps).toHaveLength(12)
  })

  it('step axes follow X Z Y Z Y Z X Z Y Z Y Z pattern', () => {
    const steps = calcSequentialTask(rgv, pickStorage, 1, placeStorage, 1)
    const axes = steps.map(s => s.axis)
    expect(axes).toEqual(['X','Z','Y','Z','Y','Z','X','Z','Y','Z','Y','Z'])
  })

  it('step ④ distance = |pick.placeHeight - pick.pickHeight| (lift-off)', () => {
    const steps = calcSequentialTask(rgv, pickStorage, 1, placeStorage, 1)
    // pick.layer1.placeHeight=400, pick.layer1.pickHeight=200 → |400-200|=200
    expect(steps[3].distance).toBe(200)
  })

  it('step ⑩ distance = |place.placeHeight - place.pickHeight| (set-down)', () => {
    const steps = calcSequentialTask(rgv, pickStorage, 1, placeStorage, 1)
    // place.layer1.placeHeight=500, place.layer1.pickHeight=300 → |500-300|=200
    expect(steps[9].distance).toBe(200)
  })

  it('concurrent total <= sequential total', () => {
    const seq = calcSequentialTask(rgv, pickStorage, 1, placeStorage, 1)
    const con = calcConcurrentTask(rgv, pickStorage, 1, placeStorage, 1)
    const seqTotal = seq.reduce((s: number, r: StepResult) => s + r.duration, 0)
    const conTotal = Math.max(...con.map((r: StepResult) => r.startAt + r.duration))
    expect(conTotal).toBeLessThanOrEqual(seqTotal + 0.001)
  })
})
