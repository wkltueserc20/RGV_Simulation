// ─── Axis motion parameters ─────────────────────────────────────────────────

export interface AxisParams {
  maxSpeed: number   // mm/s
  accel: number      // mm/s²
  decel: number      // mm/s²
}

// ─── RGV ─────────────────────────────────────────────────────────────────────

export type MotionMode = 'sequential' | 'concurrent'

export interface RGVConfig {
  length: number        // mm
  width: number         // mm
  height: number        // mm
  startPosition: number // mm from track start
  travelHeight: number  // mm — fork Z height during horizontal travel
  motionMode: MotionMode
  travel: AxisParams    // X axis — horizontal travel
  lift: AxisParams      // Z axis — fork lift
  fork: AxisParams      // Y axis — fork extend/retract
}

// ─── Track ───────────────────────────────────────────────────────────────────

export interface TrackConfig {
  length: number // mm
  width: number  // mm
}

// ─── Storage ─────────────────────────────────────────────────────────────────

export interface StorageLayer {
  pickHeight: number  // mm — fork height when picking
  pickDepth: number   // mm — fork extend distance when picking
  placeHeight: number // mm — fork height when placing
  placeDepth: number  // mm — fork extend distance when placing
}

export type StorageSide = 'left' | 'right'
export type LayerCount = 1 | 2

export interface StorageLocation {
  id: string
  name: string
  position: number       // mm along track (from left end)
  side: StorageSide
  layers: LayerCount
  layer1: StorageLayer
  layer2: StorageLayer   // only used when layers === 2
}

// ─── Time Calculation ────────────────────────────────────────────────────────

export interface StepResult {
  name: string
  axis: 'X' | 'Z' | 'Y'
  distance: number   // mm
  duration: number   // seconds
  startAt: number    // seconds (0 for sequential — only meaningful in concurrent)
}

export interface TaskResult {
  pickStorageId: string
  pickLayer: 1 | 2
  placeStorageId: string
  placeLayer: 1 | 2
  sequentialSteps: StepResult[]
  concurrentSteps: StepResult[]
  sequentialTotal: number  // seconds
  concurrentTotal: number  // seconds
}

// ─── History ─────────────────────────────────────────────────────────────────

export interface HistoryEntry {
  id: string
  timestamp: number        // Unix ms
  pickStorageName: string
  pickLayer: 1 | 2
  placeStorageName: string
  placeLayer: 1 | 2
  sequentialTotal: number
  concurrentTotal: number
}

// ─── Animation ───────────────────────────────────────────────────────────────

export interface AnimationState {
  rgvX: number    // mm along track
  forkZ: number   // mm (fork height)
  forkY: number   // mm (fork extension)
  phase: string   // current step name
  done: boolean
}

export type SpeedMultiplier = 1 | 2 | 5 | 10

// ─── App State ───────────────────────────────────────────────────────────────

export interface AppState {
  rgv: RGVConfig
  track: TrackConfig
  storages: StorageLocation[]
  history: HistoryEntry[]
  lastResult: TaskResult | null
}
