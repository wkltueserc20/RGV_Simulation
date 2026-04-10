# Simulation Layout — B+C 佈局優化

## 問題

模擬視圖（TopViewSVG + SideViewSVG）使用 `grid-cols-2` 並排，導致：
- 每個 SVG 只有約一半寬度，視圖非常扁（TopView 高度約 157px）
- 左側設定欄固定佔 320px，無法隱藏，壓縮模擬區空間

## 解法

### B — 重新排列視圖
- TopViewSVG 改為全寬（不再與 SideView 並排）
- SideViewSVG + AnimationControls 在 TopView 下方橫排
  - SideViewSVG 左側 (flex-1)
  - AnimationControls 右側（固定寬度，垂直排列）

### C — 左側欄可收合
- 左欄新增收合/展開切換按鈕
- 收合後寬度縮為 48px（只顯示 icon），展開時恢復 320px
- 使用 React state 控制，Tailwind transition 做過渡動畫

## 影響檔案

- `src/App.tsx` — 主要修改：sidebar state、layout 重排、AnimationControls 移位
- `src/components/AnimationControls.tsx`（若需要垂直版本）

## Non-goals

- 不修改 SVG 組件內部邏輯
- 不修改 TopViewSVG / SideViewSVG props
