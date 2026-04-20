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
  position: number       // mm along track (from left end), center point
  side: StorageSide
  layers: LayerCount
  width: number          // mm along track direction
  depth: number          // mm perpendicular to track (into shelf)
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

// ─── Flow Task ────────────────────────────────────────────────────────────────

export interface FlowStep {
  pickStorageId: string
  pickLayer: 1 | 2
  placeStorageId: string
  placeLayer: 1 | 2
}

export interface FlowStepResult {
  pickStorageId: string
  pickLayer: 1 | 2
  placeStorageId: string
  placeLayer: 1 | 2
  startX: number           // RGV X at start of this step
  endX: number             // RGV X at end (= placeStorage.position)
  sequentialSteps: StepResult[]
  concurrentSteps: StepResult[]
  sequentialTotal: number
  concurrentTotal: number
}

export interface FlowTaskResult {
  steps: FlowStepResult[]
  grandSequentialTotal: number
  grandConcurrentTotal: number
}

// ─── History ─────────────────────────────────────────────────────────────────

export interface SingleHistoryEntry {
  type: 'single'
  id: string
  timestamp: number
  pickStorageName: string
  pickLayer: 1 | 2
  placeStorageName: string
  placeLayer: 1 | 2
  sequentialTotal: number
  concurrentTotal: number
}

export interface FlowHistoryStep {
  pickStorageName: string
  pickLayer: 1 | 2
  placeStorageName: string
  placeLayer: 1 | 2
  nextPickStorageName?: string  // for "移動 庫B → 庫C" display
  sequentialTotal: number
  concurrentTotal: number
}

export interface FlowHistoryEntry {
  type: 'flow'
  id: string
  timestamp: number
  steps: FlowHistoryStep[]
  grandSequentialTotal: number
  grandConcurrentTotal: number
}

export type HistoryEntry = SingleHistoryEntry | FlowHistoryEntry

// ─── Animation ───────────────────────────────────────────────────────────────

export interface AnimationState {
  rgvX: number    // mm along track
  forkZ: number   // mm (fork height)
  forkY: number   // mm (fork extension)
  phase: string   // current step name
  done: boolean
  pickLayerHasGoods?: boolean  // injected by App — travels with anim so RGVAssembly reads it from animRef
}

export type SpeedMultiplier = 1 | 2 | 5 | 10

// ─── App State ───────────────────────────────────────────────────────────────

export interface AppState {
  rgv: RGVConfig
  track: TrackConfig
  storages: StorageLocation[]
  history: HistoryEntry[]
  lastResult: TaskResult | null
  lastFlowResult: FlowTaskResult | null
}
