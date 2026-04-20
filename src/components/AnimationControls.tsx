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
    <div className="flex flex-col gap-2">
      {/* Progress track */}
      <div className="w-full bg-hmi-card border border-hmi-border rounded-full h-2 overflow-hidden">
        <div
          className={`h-2 rounded-full transition-none bg-hmi-accent ${playing ? 'progress-playing' : ''}`}
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <div className="flex items-center gap-2">
        {/* Play / Pause */}
        <button
          onClick={playing ? onPause : onPlay}
          disabled={!hasResult}
          className="hmi-btn-primary px-3 py-1"
        >
          {playing ? '⏸ 暫停' : '▶ 播放'}
        </button>

        <button
          onClick={onReset}
          disabled={!hasResult}
          className="hmi-btn-icon"
        >
          ↺
        </button>

        {/* Speed */}
        <div className="flex gap-0.5 ml-auto">
          {SPEEDS.map(s => (
            <button
              key={s}
              onClick={() => onSpeed(s)}
              className={`px-2 py-0.5 text-xs rounded font-mono transition-all duration-150 ${
                speed === s
                  ? 'bg-hmi-accent text-hmi-base font-semibold shadow-glow-sm'
                  : 'bg-hmi-card border border-hmi-border text-hmi-secondary hover:bg-hmi-elevated hover:text-hmi-primary'
              }`}
            >
              {s}×
            </button>
          ))}
        </div>

        {/* Time readout */}
        <span className="text-xs text-hmi-secondary font-mono ml-1 tabular-nums">
          <span className="text-hmi-accent">{elapsed.toFixed(1)}</span>
          <span className="text-hmi-muted">s / </span>
          <span>{totalTime.toFixed(1)}s</span>
        </span>
      </div>
    </div>
  )
}
