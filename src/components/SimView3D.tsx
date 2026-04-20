import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Grid, Html } from '@react-three/drei'
import * as THREE from 'three'
import type { AppState, AnimationState } from '../types'

// ─── Scale: 1 mm → 0.001 Three.js world unit ─────────────────────────────────
const S = 0.001

// ─── Light-mode color palette ─────────────────────────────────────────────────
const C = {
  bg:           '#F0F4F8',
  track:        '#B0C4D8',
  trackE:       '#7090B0',
  storageDef:   '#C8D8E8',
  storageDefE:  '#8090A0',
  storagePick:  '#90C0F0',
  storagePickE: '#4090D0',
  storagePlace: '#80D8A8',
  storagePlaceE:'#30A060',
  rgv:          '#1A6FC4',
  rgvE:         '#0A4080',
  mast:         '#7090B0',
  mastE:        '#4060A0',
  carriage:     '#E07000',
  carriageE:    '#A04000',
  tine:         '#F0A000',
  tineE:        '#A06000',
} as const

// ─── Track ────────────────────────────────────────────────────────────────────
function TrackMesh({ length, width }: { length: number; width: number }) {
  return (
    <mesh position={[length * S / 2, -0.015, 0]} receiveShadow>
      <boxGeometry args={[length * S, 0.03, width * S]} />
      <meshStandardMaterial color={C.track} emissive={C.trackE} roughness={0.7} metalness={0.2} />
    </mesh>
  )
}

// ─── Storage meshes ───────────────────────────────────────────────────────────
interface StorageMeshesProps {
  storages: AppState['storages']
  trackWidth: number
  highlightPickId: string
  highlightPlaceId: string
}

const LABEL_STYLE: React.CSSProperties = {
  fontSize: '9px',
  fontFamily: "'JetBrains Mono', monospace",
  whiteSpace: 'nowrap',
  pointerEvents: 'none',
  background: 'rgba(240,244,248,0.90)',
  padding: '1px 5px',
  borderRadius: '2px',
}

function StorageMeshes({ storages, trackWidth, highlightPickId, highlightPlaceId }: StorageMeshesProps) {
  const GAP = (trackWidth / 2 + 80) * S

  return (
    <>
      {storages.map(s => {
        const isPick  = s.id === highlightPickId
        const isPlace = s.id === highlightPlaceId
        const cx      = s.position * S
        const sDepth  = s.depth * S
        const sWidth  = s.width * S
        const dir     = s.side === 'left' ? 1 : -1
        const cz      = dir * (GAP + sDepth / 2)

        const color    = isPick ? C.storagePick  : isPlace ? C.storagePlace  : C.storageDef
        const emissive = isPick ? C.storagePickE : isPlace ? C.storagePlaceE : C.storageDefE
        const lblCol   = isPick ? '#0078D4' : isPlace ? '#047857' : '#4A6080'

        const h1   = s.layer1.placeHeight * S
        const topH = s.layers === 2 ? s.layer2.placeHeight * S : h1
        const h2   = s.layers === 2 ? topH - h1 : 0

        return (
          <group key={s.id}>
            {/* Layer 1 — semi-transparent to see fork entering */}
            <mesh position={[cx, h1 / 2, cz]} receiveShadow castShadow>
              <boxGeometry args={[sWidth, h1, sDepth]} />
              <meshStandardMaterial color={color} emissive={emissive}
                roughness={0.5} metalness={0.2} transparent opacity={0.4} depthWrite={false} />
            </mesh>

            {/* Layer 2 */}
            {s.layers === 2 && h2 > 0 && (
              <mesh position={[cx, h1 + h2 / 2, cz]} receiveShadow castShadow>
                <boxGeometry args={[sWidth, h2, sDepth]} />
                <meshStandardMaterial color={color} emissive={emissive}
                  roughness={0.5} metalness={0.2} transparent opacity={0.3} depthWrite={false} />
              </mesh>
            )}

            {/* Layer divider */}
            {s.layers === 2 && (
              <mesh position={[cx, h1, cz]}>
                <boxGeometry args={[sWidth + 0.002, 0.003, sDepth + 0.002]} />
                <meshStandardMaterial color={lblCol} emissive={lblCol} transparent opacity={0.4} />
              </mesh>
            )}

            {/* Name label */}
            <Html position={[cx, topH + 0.07, cz]} center zIndexRange={[0, 0]}>
              <div style={{ ...LABEL_STYLE, color: lblCol, border: `1px solid ${lblCol}60` }}>
                {s.name}
              </div>
            </Html>
          </group>
        )
      })}
    </>
  )
}

// ─── RGV + Fork assembly ──────────────────────────────────────────────────────
interface RGVAssemblyProps {
  rgv: AppState['rgv']
  anim: AnimationState | null
  storages: AppState['storages']
  highlightPickId: string
  highlightPlaceId: string
}

function RGVAssembly({ rgv, anim, storages, highlightPickId, highlightPlaceId }: RGVAssemblyProps) {
  // Synchronous refs — lag-free imperative updates
  const animRef         = useRef<AnimationState | null>(anim)
  const storagesRef     = useRef(storages)
  const hlPickRef       = useRef(highlightPickId)
  const hlPlaceRef      = useRef(highlightPlaceId)
  animRef.current       = anim
  storagesRef.current   = storages
  hlPickRef.current     = highlightPickId
  hlPlaceRef.current    = highlightPlaceId

  // Mesh refs
  const bodyRef     = useRef<THREE.Mesh>(null!)
  const mastRef     = useRef<THREE.Mesh>(null!)
  const carriageRef = useRef<THREE.Mesh>(null!)
  const tine1Ref    = useRef<THREE.Mesh>(null!)
  const tine2Ref    = useRef<THREE.Mesh>(null!)
  const cargoRef    = useRef<THREE.Mesh>(null!)

  // ── Geometry constants ────────────────────────────────────────────────────
  const BL = rgv.length * S
  const BH = rgv.height * S
  const BD = rgv.width  * S

  const MAST_HALF_H = 1.5
  const MAST_W      = 0.04
  const CARR_H      = 0.06
  const TINE_H      = 0.05   // tine cross-section height (Y)
  const TINE_W      = 0.10   // tine cross-section width (X)
  const BASE_LEN    = BD     // resting tine length = RGV width, centered on body
  const GOODS_H     = 0.15   // cargo box height (~150mm)
  const GOODS_D     = BD * 0.7  // cargo box depth in Z

  // Fork tine separation in X direction (along track)
  // FORK_SPAN = (rgv.width - 200mm), centred on RGV body X centre
  const FORK_SPAN = Math.max(0, rgv.width - 200) * S
  const HALF_SPAN = FORK_SPAN / 2

  // Last known fork extension direction: +1 → +Z (left storage), -1 → -Z (right storage)
  const forkDirRef = useRef<number>(1)
  // Track previous forkY to detect start-of-extension moment
  const prevFyRef  = useRef<number>(0)

  useFrame(() => {
    const a   = animRef.current
    const rx  = (a?.rgvX ?? rgv.startPosition) * S
    const fz  = (a?.forkZ ?? rgv.travelHeight) * S
    const fy  = (a?.forkY ?? 0) * S
    const tl  = BASE_LEN + fy
    const phase = a?.phase ?? ''

    const retracted = fy < 0.001

    // ── Update fork direction ONLY at the moment extension begins ──────────
    // This avoids the jump: direction changes while tines are invisible (fy=0).
    if (!retracted && prevFyRef.current < 0.001) {
      const isPickPhase  = phase.includes('取料') || phase.includes('離架') || phase.includes('載貨')
      const isPlacePhase = phase.includes('放料') || phase.includes('入架') || phase.includes('空載')
      if (isPickPhase) {
        const pick = storagesRef.current.find(s => s.id === hlPickRef.current)
        if (pick) forkDirRef.current = pick.side === 'right' ? -1 : 1
      } else if (isPlacePhase) {
        const place = storagesRef.current.find(s => s.id === hlPlaceRef.current)
        if (place) forkDirRef.current = place.side === 'right' ? -1 : 1
      }
    }
    prevFyRef.current = fy

    const dir   = forkDirRef.current
    // When fy=0: tineZ = dir*(BD/2 + 0 - BD/2) = 0 → tine centered, no jump
    const tineZ = dir * (BD / 2 + fy / 2 - BASE_LEN / 2)
    const tineY = fz - CARR_H / 2 + TINE_H / 2

    // ── Body ──────────────────────────────────────────────────────────────
    bodyRef.current.position.set(rx, BH / 2, 0)

    // ── Mast — centred on body X ──────────────────────────────────────────
    mastRef.current.position.set(rx, MAST_HALF_H, 0)

    // ── Carriage — rides up/down on mast ─────────────────────────────────
    carriageRef.current.position.set(rx, fz, 0)

    // ── Tine 1 — at (rx - HALF_SPAN), extends in Z ───────────────────────
    tine1Ref.current.position.set(rx - HALF_SPAN, tineY, tineZ)
    tine1Ref.current.scale.z = tl / BASE_LEN

    // ── Tine 2 — at (rx + HALF_SPAN), same Z direction ───────────────────
    tine2Ref.current.position.set(rx + HALF_SPAN, tineY, tineZ)
    tine2Ref.current.scale.z = tl / BASE_LEN

    // ── Cargo — visible during carrying phases ④ through ⑩ ───────────────
    // pickLayerHasGoods is injected into AnimationState by App.tsx onFrame callbacks
    // so it always travels with the anim and is immediately current via animRef.
    const hasGoods = a?.pickLayerHasGoods ?? false
    const firstChar = phase.charCodeAt(0)
    const isCarryingPhase = firstChar >= 0x2463 && firstChar <= 0x2469  // ④-⑩
    const isCarrying = hasGoods && isCarryingPhase
    cargoRef.current.visible = isCarrying
    if (isCarrying) {
      cargoRef.current.position.set(rx, fz + TINE_H / 2 + GOODS_H / 2, tineZ)
    }
  })

  // ── Initial JSX positions (before first useFrame) ─────────────────────────
  const ix  = rgv.startPosition * S
  const ifz = rgv.travelHeight  * S
  const initTineZ = 0  // BASE_LEN = BD, so dir*(BD/2 - BD/2) = 0 → centered in body

  return (
    <>
      {/* Body — semi-transparent so fork tines are visible through it */}
      <mesh ref={bodyRef} position={[ix, BH / 2, 0]} castShadow>
        <boxGeometry args={[BL, BH, BD]} />
        <meshStandardMaterial color={C.rgv} emissive={C.rgvE}
          emissiveIntensity={0.6} roughness={0.3} metalness={0.5}
          transparent opacity={0.35} depthWrite={false} />
      </mesh>

      {/* Mast — vertical column at RGV X centre */}
      <mesh ref={mastRef} position={[ix, MAST_HALF_H, 0]} castShadow>
        <boxGeometry args={[MAST_W, MAST_HALF_H * 2, MAST_W]} />
        <meshStandardMaterial color={C.mast} emissive={C.mastE} roughness={0.7} metalness={0.4} />
      </mesh>

      {/* Carriage — horizontal beam spanning tine width */}
      <mesh ref={carriageRef} position={[ix, ifz, 0]} castShadow>
        <boxGeometry args={[FORK_SPAN + TINE_W * 2, CARR_H, MAST_W * 1.5]} />
        <meshStandardMaterial color={C.carriage} emissive={C.carriageE}
          emissiveIntensity={0.8} roughness={0.3} metalness={0.5} />
      </mesh>

      {/* Tine 1 — negative X side */}
      <mesh ref={tine1Ref}
        position={[ix - HALF_SPAN, ifz - CARR_H / 2 + TINE_H / 2, initTineZ]}
        castShadow>
        <boxGeometry args={[TINE_W, TINE_H, BASE_LEN]} />
        <meshStandardMaterial color={C.tine} emissive={C.tineE}
          emissiveIntensity={0.8} roughness={0.2} metalness={0.6} />
      </mesh>

      {/* Tine 2 — positive X side */}
      <mesh ref={tine2Ref}
        position={[ix + HALF_SPAN, ifz - CARR_H / 2 + TINE_H / 2, initTineZ]}
        castShadow>
        <boxGeometry args={[TINE_W, TINE_H, BASE_LEN]} />
        <meshStandardMaterial color={C.tine} emissive={C.tineE}
          emissiveIntensity={0.8} roughness={0.2} metalness={0.6} />
      </mesh>

      {/* Cargo box — rides on fork during carrying phases ④-⑩ */}
      <mesh ref={cargoRef}
        position={[ix, ifz + TINE_H / 2 + GOODS_H / 2, 0]}
        visible={false}
        castShadow>
        <boxGeometry args={[FORK_SPAN + TINE_W, GOODS_H, GOODS_D]} />
        <meshStandardMaterial color="#D97706" emissive="#A05000"
          emissiveIntensity={0.6} roughness={0.5} metalness={0.1} />
      </mesh>
    </>
  )
}

// ─── Full scene ───────────────────────────────────────────────────────────────
interface SceneProps {
  state: AppState
  anim: AnimationState | null
  highlightPickId: string
  highlightPlaceId: string
}

function Scene({ state, anim, highlightPickId, highlightPlaceId }: SceneProps) {
  const { track, storages, rgv } = state
  const tl = track.length * S
  const cx = tl / 2

  return (
    <>
      <color attach="background" args={[C.bg]} />
      <fog attach="fog" args={[C.bg, tl * 4, tl * 8]} />

      {/* ── Lighting for light-mode scene ── */}
      <ambientLight intensity={2.0} />
      <directionalLight
        position={[cx, tl * 0.5, tl * 0.5]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight
        position={[cx, -tl * 0.2, -tl * 0.3]}
        intensity={0.5}
      />
      {/* Subtle accent lights */}
      <pointLight position={[cx, 0.8, 0.6]} color="#4090D0" intensity={0.3} distance={tl * 2} />
      <pointLight position={[cx, 0.8, -0.6]} color="#4090D0" intensity={0.15} distance={tl * 2} />

      <OrbitControls
        target={[cx, 0.3, 0]}
        enableDamping
        dampingFactor={0.06}
        minDistance={0.3}
        maxDistance={tl * 3}
        maxPolarAngle={Math.PI / 2 + 0.1}
      />

      <Grid
        position={[cx, -0.001, 0]}
        args={[tl + 2, 5]}
        cellSize={0.2}
        cellThickness={0.4}
        cellColor="#A0B8D0"
        sectionSize={1}
        sectionThickness={0.8}
        sectionColor="#7090B0"
        fadeDistance={tl * 2}
        fadeStrength={1.5}
        followCamera={false}
        infiniteGrid={false}
      />

      <TrackMesh length={track.length} width={track.width} />

      <StorageMeshes
        storages={storages}
        trackWidth={track.width}
        highlightPickId={highlightPickId}
        highlightPlaceId={highlightPlaceId}
      />

      <RGVAssembly
        rgv={rgv}
        anim={anim}
        storages={storages}
        highlightPickId={highlightPickId}
        highlightPlaceId={highlightPlaceId}
      />
    </>
  )
}

// ─── Public component ─────────────────────────────────────────────────────────
export interface SimView3DProps {
  state: AppState
  anim: AnimationState | null
  highlightPickId?: string
  highlightPlaceId?: string
}

export default function SimView3D({
  state,
  anim,
  highlightPickId = '',
  highlightPlaceId = '',
}: SimView3DProps) {
  const tl = state.track.length * S

  const camPos: [number, number, number] = [
    tl / 2,
    Math.max(1.5, tl * 0.45),
    Math.max(2.0, tl * 0.65),
  ]

  return (
    <div
      className="w-full border border-hmi-border rounded-lg overflow-hidden"
      style={{ height: '340px', background: C.bg }}
    >
      <Canvas
        camera={{ position: camPos, fov: 50, near: 0.005, far: 200 }}
        shadows
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
      >
        <Scene
          state={state}
          anim={anim}
          highlightPickId={highlightPickId}
          highlightPlaceId={highlightPlaceId}
        />
      </Canvas>
    </div>
  )
}
