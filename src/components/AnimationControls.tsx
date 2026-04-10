import type { SpeedMultiplier } from '../types'

interface Props {
  playing: boolean
  elapsed: number
  totalTime: number
  speed: SpeedMultiplier
  hasResult: boolean
  onPlay: () => void
  onPause: () => void
  onReset: () => void
  onSpeed: (s: SpeedMultiplier) => void
}

const SPEEDS: SpeedMultiplier[] = [1, 2, 5, 10]

export default function AnimationControls({
  playing, elapsed, totalTime, speed, hasResult,
  onPlay, onPause, onReset, onSpeed,
}: Props) {
  const progress = totalTime > 0 ? Math.min(elapsed / totalTime, 1) : 0

  return (
    <div className="flex flex-col gap-1">
      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-3 cursor-pointer">
        <div
          className="bg-blue-500 h-3 rounded-full transition-none"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <div className="flex items-center gap-2">
        {/* Play / Pause */}
        <button
          onClick={playing ? onPause : onPlay}
          disabled={!hasResult}
          className="px-3 py-1 text-sm rounded bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {playing ? '⏸ 暫停' : '▶ 播放'}
        </button>
        <button
          onClick={onReset}
          disabled={!hasResult}
          className="px-2 py-1 text-sm rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ↺ 重置
        </button>

        {/* Speed selector */}
        <div className="flex gap-0.5 ml-auto">
          {SPEEDS.map(s => (
            <button
              key={s}
              onClick={() => onSpeed(s)}
              className={`px-2 py-0.5 text-xs rounded ${
                speed === s
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Time display */}
        <span className="text-xs text-gray-400 font-mono ml-1">
          {elapsed.toFixed(1)}s / {totalTime.toFixed(1)}s
        </span>
      </div>
    </div>
  )
}
