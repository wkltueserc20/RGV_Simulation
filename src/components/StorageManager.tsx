import { useState } from 'react'
import { useApp } from '../context/AppContext'
import type { StorageLocation } from '../types'
import StorageCard, { defaultLayer } from './StorageCard'

let idCounter = Date.now()
const nextId = () => `s${idCounter++}`

export default function StorageManager() {
  const { state, dispatch } = useApp()
  const [open, setOpen] = useState(true)

  const addStorage = () => {
    const newStorage: StorageLocation = {
      id: nextId(),
      name: `庫${String.fromCharCode(65 + state.storages.length)}`,
      position: 0,
      side: 'left',
      layers: 1,
      layer1: { ...defaultLayer },
      layer2: { ...defaultLayer, pickHeight: 1200, placeHeight: 1220 },
    }
    dispatch({ type: 'ADD_STORAGE', payload: newStorage })
  }

  return (
    <div className="border border-gray-200 rounded-lg mb-2">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex justify-between items-center px-3 py-2 text-sm font-semibold bg-gray-50 rounded-lg"
      >
        <span>庫位管理 ({state.storages.length})</span>
        <span>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="p-2">
          <button
            onClick={addStorage}
            className="w-full mb-2 py-1.5 text-sm rounded bg-blue-500 hover:bg-blue-600 text-white font-medium"
          >
            + 新增庫位
          </button>
          {state.storages.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-2">尚無庫位</p>
          )}
          {state.storages.map(s => (
            <StorageCard key={s.id} storage={s} />
          ))}
        </div>
      )}
    </div>
  )
}
