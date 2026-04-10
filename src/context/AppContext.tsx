import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import type {
  AppState, RGVConfig, TrackConfig, StorageLocation, HistoryEntry, TaskResult, FlowTaskResult
} from '../types'

// ─── Default values ──────────────────────────────────────────────────────────

const defaultAxis = { maxSpeed: 1000, accel: 500, decel: 500 }

const defaultState: AppState = {
  rgv: {
    length: 1200,
    width: 800,
    height: 600,
    startPosition: 0,
    travelHeight: 0,
    motionMode: 'sequential',
    travel: { maxSpeed: 1000, accel: 500, decel: 500 },
    lift: { maxSpeed: 200, accel: 100, decel: 100 },
    fork: { maxSpeed: 300, accel: 200, decel: 200 },
  },
  track: { length: 10000, width: 600 },
  storages: [],
  history: [],
  lastResult: null,
  lastFlowResult: null,
}

// ─── Actions ─────────────────────────────────────────────────────────────────

type Action =
  | { type: 'UPDATE_RGV'; payload: RGVConfig }
  | { type: 'UPDATE_TRACK'; payload: TrackConfig }
  | { type: 'ADD_STORAGE'; payload: StorageLocation }
  | { type: 'UPDATE_STORAGE'; payload: StorageLocation }
  | { type: 'DELETE_STORAGE'; payload: string }
  | { type: 'ADD_HISTORY'; payload: HistoryEntry }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'SET_LAST_RESULT'; payload: TaskResult | null }
  | { type: 'SET_LAST_FLOW_RESULT'; payload: FlowTaskResult | null }

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'UPDATE_RGV':
      return { ...state, rgv: action.payload }
    case 'UPDATE_TRACK':
      return { ...state, track: action.payload }
    case 'ADD_STORAGE':
      return { ...state, storages: [...state.storages, action.payload] }
    case 'UPDATE_STORAGE':
      return {
        ...state,
        storages: state.storages.map(s =>
          s.id === action.payload.id ? action.payload : s
        ),
      }
    case 'DELETE_STORAGE':
      return {
        ...state,
        storages: state.storages.filter(s => s.id !== action.payload),
      }
    case 'ADD_HISTORY': {
      const updated = [action.payload, ...state.history].slice(0, 100)
      return { ...state, history: updated }
    }
    case 'CLEAR_HISTORY':
      return { ...state, history: [] }
    case 'SET_LAST_RESULT':
      return { ...state, lastResult: action.payload, lastFlowResult: null }
    case 'SET_LAST_FLOW_RESULT':
      return { ...state, lastFlowResult: action.payload, lastResult: null }
    default:
      return state
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'rgv-simulation-state'

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState
    const parsed = JSON.parse(raw) as Partial<AppState>
    return {
      ...defaultState,
      ...parsed,
      storages: (parsed.storages ?? []).map(s => ({
        width: 600,
        depth: 500,
        ...s,
      })),
      lastResult: null,
      lastFlowResult: null,
    }
  } catch {
    return defaultState
  }
}

interface AppContextValue {
  state: AppState
  dispatch: React.Dispatch<Action>
}

// export defaultAxis so child components can use it for empty AxisParams fields
export { defaultAxis }

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)

  useEffect(() => {
    const { lastResult: _lr, ...persisted } = state
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted))
  }, [state])

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
