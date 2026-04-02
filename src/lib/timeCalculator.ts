import type {
  AxisParams, RGVConfig, StorageLocation, StepResult, TaskResult, AnimationState
} from '../types'

// ─── Core physics ────────────────────────────────────────────────────────────

/**
 * Calculate travel time for a single axis move with trapezoidal / triangular
 * velocity profile.
 */
export function calcMoveTime(distance: number, axis: AxisParams): number {
  if (distance <= 0) return 0

  const { maxSpeed: v, accel: a, decel: d } = axis
  const dAcc = (v * v) / (2 * a)
  const dDec = (v * v) / (2 * d)

  if (distance >= dAcc + dDec) {
    // Trapezoidal profile — reaches max speed
    return v / a + (distance - dAcc - dDec) / v + v / d
  } else {
    // Triangular profile — never reaches max speed
    const vPeak = Math.sqrt((2 * distance * a * d) / (a + d))
    return vPeak / a + vPeak / d
  }
}

// ─── 12-step sequence definition ─────────────────────────────────────────────
//
// Z-axis position timeline:
//   start  → travelHeight
//   ① X    → travelHeight  (horizontal travel, Z unchanged)
//   ② Z    → pickHeight    (lift to pick height)
//   ③ Y    → pickHeight    (fork extends)
//   ④ Z    → placeHeight   (lift goods off shelf — NEW)
//   ⑤ Y    → placeHeight   (fork retracts with goods)
//   ⑥ Z    → travelHeight  (lower to travel height, from placeHeight)
//   ⑦ X    → travelHeight  (horizontal travel)
//   ⑧ Z    → placeHeight   (lift to place height)
//   ⑨ Y    → placeHeight   (fork extends)
//   ⑩ Z    → pickHeight    (lower goods onto shelf — NEW)
//   ⑪ Y    → pickHeight    (fork retracts, empty)
//   ⑫ Z    → travelHeight  (lower to travel height, from pickHeight)

interface LayerData {
  pickHeight: number
  pickDepth: number
  placeHeight: number
  placeDepth: number
}

function buildSteps(
  rgv: RGVConfig,
  travelToPickDist: number,
  travelToPlaceDist: number,
  pick: LayerData,
  place: LayerData,
): Array<{ name: string; axis: 'X' | 'Z' | 'Y'; distance: number }> {
  const th = rgv.travelHeight
  // pick.pickHeight  = fork height to extend into pick shelf (under goods)
  // pick.placeHeight = fork height after lifting goods clear of pick shelf (lift-off)
  // place.placeHeight = fork height to extend into place shelf (above goods target)
  // place.pickHeight  = fork height after lowering goods onto place shelf (set-down)

  return [
    { name: '① 行走到取料位置',        axis: 'X', distance: travelToPickDist },
    { name: '② 升至取料高度',          axis: 'Z', distance: Math.abs(pick.pickHeight - th) },
    { name: '③ 牙叉伸入（取料）',      axis: 'Y', distance: pick.pickDepth },
    { name: '④ 升至帶貨高度（離架）',  axis: 'Z', distance: Math.abs(pick.placeHeight - pick.pickHeight) },
    { name: '⑤ 牙叉退回（載貨）',      axis: 'Y', distance: pick.pickDepth },
    { name: '⑥ 降至行走高度',          axis: 'Z', distance: Math.abs(pick.placeHeight - th) },
    { name: '⑦ 行走到放料位置',        axis: 'X', distance: travelToPlaceDist },
    { name: '⑧ 升至放料高度',          axis: 'Z', distance: Math.abs(place.placeHeight - th) },
    { name: '⑨ 牙叉伸入（放料）',      axis: 'Y', distance: place.placeDepth },
    { name: '⑩ 降至落架高度（入架）',  axis: 'Z', distance: Math.abs(place.placeHeight - place.pickHeight) },
    { name: '⑪ 牙叉退回（空載）',      axis: 'Y', distance: place.placeDepth },
    { name: '⑫ 降至行走高度',          axis: 'Z', distance: Math.abs(place.pickHeight - th) },
  ]
}

// ─── Sequential task ─────────────────────────────────────────────────────────

export function calcSequentialTask(
  rgv: RGVConfig,
  pickStorage: StorageLocation,
  pickLayer: 1 | 2,
  placeStorage: StorageLocation,
  placeLayer: 1 | 2,
): StepResult[] {
  const pick = pickLayer === 1 ? pickStorage.layer1 : pickStorage.layer2
  const place = placeLayer === 1 ? placeStorage.layer1 : placeStorage.layer2
  const travelToPickDist = Math.abs(pickStorage.position - rgv.startPosition)
  const travelToPlaceDist = Math.abs(placeStorage.position - pickStorage.position)

  return buildSteps(rgv, travelToPickDist, travelToPlaceDist, pick, place).map(s => ({
    ...s,
    duration: calcMoveTime(s.distance, s.axis === 'X' ? rgv.travel : s.axis === 'Z' ? rgv.lift : rgv.fork),
    startAt: 0,
  }))
}

// ─── Concurrent task ─────────────────────────────────────────────────────────
//
// Concurrency rules:
//   - X and Z can overlap (Z starts with X; they're independent axes)
//   - Y (fork) can only start after both X is settled AND Z is settled
//   - On retract, next Z and X start after Y finishes

export function calcConcurrentTask(
  rgv: RGVConfig,
  pickStorage: StorageLocation,
  pickLayer: 1 | 2,
  placeStorage: StorageLocation,
  placeLayer: 1 | 2,
): StepResult[] {
  const pick = pickLayer === 1 ? pickStorage.layer1 : pickStorage.layer2
  const place = placeLayer === 1 ? placeStorage.layer1 : placeStorage.layer2
  const travelToPickDist = Math.abs(pickStorage.position - rgv.startPosition)
  const travelToPlaceDist = Math.abs(placeStorage.position - pickStorage.position)

  const defs = buildSteps(rgv, travelToPickDist, travelToPlaceDist, pick, place)
  const dur = (i: number) => calcMoveTime(
    defs[i].distance,
    defs[i].axis === 'X' ? rgv.travel : defs[i].axis === 'Z' ? rgv.lift : rgv.fork,
  )

  // Calculate durations
  const d = defs.map((_, i) => dur(i))

  // startAt for each step (critical path)
  const s: number[] = new Array(12).fill(0)

  // ① X travel to pick — starts at 0
  s[0] = 0
  // ② Z lift to pick height — starts with ①
  s[1] = 0
  // ③ Y fork in (pick) — after both ① and ② settle
  s[2] = Math.max(s[0] + d[0], s[1] + d[1])
  // ④ Z lift to place height — after ③ fork in done
  s[3] = s[2] + d[2]
  // ⑤ Y fork retract (with load) — after ④ settles
  s[4] = s[3] + d[3]
  // ⑥ Z lower to travel height — after ⑤ retract done
  s[5] = s[4] + d[4]
  // ⑦ X travel to place — after ⑤ retract done (can run with ⑥)
  s[6] = s[4] + d[4]
  // ⑧ Z lift to place height — starts with ⑦
  s[7] = s[4] + d[4]
  // ⑨ Y fork in (place) — after both ⑦ and ⑧ settle
  s[8] = Math.max(s[6] + d[6], s[7] + d[7])
  // ⑩ Z lower to pick height — after ⑨ fork in done
  s[9] = s[8] + d[8]
  // ⑪ Y fork retract (empty) — after ⑩ settles
  s[10] = s[9] + d[9]
  // ⑫ Z lower to travel height — after ⑪ retract done
  s[11] = s[10] + d[10]

  return defs.map((def, i) => ({
    name: def.name,
    axis: def.axis,
    distance: def.distance,
    duration: d[i],
    startAt: s[i],
  }))
}

// ─── Full task calculation ────────────────────────────────────────────────────

export function calcTask(
  rgv: RGVConfig,
  pickStorage: StorageLocation,
  pickLayer: 1 | 2,
  placeStorage: StorageLocation,
  placeLayer: 1 | 2,
): TaskResult {
  const sequentialSteps = calcSequentialTask(rgv, pickStorage, pickLayer, placeStorage, placeLayer)
  const concurrentSteps = calcConcurrentTask(rgv, pickStorage, pickLayer, placeStorage, placeLayer)

  const sequentialTotal = sequentialSteps.reduce((sum, s) => sum + s.duration, 0)
  const concurrentTotal = Math.max(...concurrentSteps.map(s => s.startAt + s.duration))

  return {
    pickStorageId: pickStorage.id,
    pickLayer,
    placeStorageId: placeStorage.id,
    placeLayer,
    sequentialSteps,
    concurrentSteps,
    sequentialTotal,
    concurrentTotal,
  }
}

// ─── Animation state interpolation ───────────────────────────────────────────

/**
 * Given concurrent steps and elapsed time, interpolate:
 *   - RGV X position (mm along track)
 *   - Fork Z height (mm absolute)
 *   - Fork Y extension (mm)
 *
 * Z is tracked cumulatively through the 12-step sequence.
 */
export function getAnimationState(
  steps: StepResult[],
  elapsed: number,
  rgvStartX: number,
  pickStorageX: number,
  placeStorageX: number,
  travelHeight: number,
  pickPickHeight: number,   // pick storage: fork height to extend (under goods)
  pickPlaceHeight: number,  // pick storage: fork height after lifting goods clear
  placePlaceHeight: number, // place storage: fork height to extend above target
  placePickHeight: number,  // place storage: fork height after setting goods down
): AnimationState {
  const totalTime = Math.max(...steps.map(s => s.startAt + s.duration), 0)

  if (steps.length === 0 || totalTime === 0) {
    return { rgvX: rgvStartX, forkZ: travelHeight, forkY: 0, phase: '', done: false }
  }
  if (elapsed >= totalTime) {
    return { rgvX: placeStorageX, forkZ: travelHeight, forkY: 0, phase: '完成', done: true }
  }

  // Z-axis absolute position at the START and END of each of the 12 steps
  const zAtStart = [
    travelHeight,     // ① X travel to pick
    travelHeight,     // ② Z lift to pickPickHeight
    pickPickHeight,   // ③ Y extend (pick)
    pickPickHeight,   // ④ Z lift to pickPlaceHeight (lift-off)
    pickPlaceHeight,  // ⑤ Y retract (with load)
    pickPlaceHeight,  // ⑥ Z lower to travelHeight
    travelHeight,     // ⑦ X travel to place
    travelHeight,     // ⑧ Z lift to placePlaceHeight
    placePlaceHeight, // ⑨ Y extend (place)
    placePlaceHeight, // ⑩ Z lower to placePickHeight (set-down)
    placePickHeight,  // ⑪ Y retract (empty)
    placePickHeight,  // ⑫ Z lower to travelHeight
  ]
  const zAtEnd = [
    travelHeight,     // ① (X — Z unchanged)
    pickPickHeight,   // ②
    pickPickHeight,   // ③ (Y — Z unchanged)
    pickPlaceHeight,  // ④
    pickPlaceHeight,  // ⑤ (Y — Z unchanged)
    travelHeight,     // ⑥
    travelHeight,     // ⑦ (X — Z unchanged)
    placePlaceHeight, // ⑧
    placePlaceHeight, // ⑨ (Y — Z unchanged)
    placePickHeight,  // ⑩
    placePickHeight,  // ⑪ (Y — Z unchanged)
    travelHeight,     // ⑫
  ]

  let rgvX = rgvStartX
  let forkZ = travelHeight
  let forkY = 0
  let phase = ''

  // Find which step is active at `elapsed` and interpolate
  steps.forEach((s, i) => {
    const end = s.startAt + s.duration
    if (elapsed < s.startAt) return  // not started yet

    const t = Math.min(elapsed - s.startAt, s.duration)
    const progress = s.duration > 0 ? t / s.duration : 1
    const active = elapsed < end

    if (active && !phase) phase = s.name

    if (s.axis === 'X') {
      const fromX = i === 0 ? rgvStartX : pickStorageX
      const toX   = i === 0 ? pickStorageX : placeStorageX
      rgvX = lerp(fromX, toX, progress)
      if (elapsed >= end) rgvX = toX
    } else if (s.axis === 'Z') {
      forkZ = lerp(zAtStart[i], zAtEnd[i], progress)
      if (elapsed >= end) forkZ = zAtEnd[i]
    } else {
      // Y: extend then retract in pairs (0→depth→0)
      const isExtend = [2, 8].includes(i)   // steps ③ ⑨ are extends
      const depth = s.distance
      if (isExtend) {
        forkY = lerp(0, depth, progress)
        if (elapsed >= end) forkY = depth
      } else {
        forkY = lerp(depth, 0, progress)
        if (elapsed >= end) forkY = 0
      }
    }
  })

  return { rgvX, forkZ, forkY, phase, done: false }
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t))
}
