# Storage Size — 庫位尺寸可調整

## 需求

每個庫位新增兩個尺寸欄位，SVG 俯視圖與側視圖同步顯示實際比例大小。

- `width` (mm)：沿軌道 X 方向的佔位寬度，預設 300
- `depth` (mm)：垂直軌道方向的深度，預設 500

## 改動說明

### types/index.ts
`StorageLocation` 加入 `width: number` 與 `depth: number`

### context/AppContext.tsx
新增庫位時的預設值加入 `width: 300, depth: 500`

### components/StorageCard.tsx
設定面板加兩個 NumberInput — 「寬度 (mm)」「深度 (mm)」

### components/TopViewSVG.tsx
- `STORAGE_W` 改為動態：`storage.width / track.length * (SVG_W - 2 * PADDING)`
- `STORAGE_H` 改為動態：`storage.depth / 1500 * 95`（參考基準 1500mm，可用 Y 空間 95 units）
- 矩形 X 位置改用 `toSvgX(position) - svg_w / 2`（中心點語義不變）

### components/SideViewSVG.tsx
- 加入庫位輪廓矩形（淡灰色，半透明背景層）
  - X：叉臂起點 → `storage.depth * DEPTH_SCALE`
  - Y：地板 → 最高層的 placeHeight
- 2 層時加分層線

## Non-goals
- 不影響時間計算邏輯
- 不改 position 語義（維持中心點）
