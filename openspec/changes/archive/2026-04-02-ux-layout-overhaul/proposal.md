# UX Layout Overhaul

## 問題

1. 左側設定欄捲動時整個視窗跟著動（`min-h-screen` bug）
2. 左側三個區塊全部展開後過長，需要大量捲動才能找到設定
3. 「執行模擬」按鈕埋在 SVG 動畫下方，操作動線倒置
4. 俯視圖與側視圖上下疊放，佔用右側大量垂直空間
5. AxisParams 三欄標籤在 288px 側邊欄裡截斷

## 解法

**P0** — `App.tsx` root div 改 `h-screen`，讓 aside / main 各自獨立捲動

**P1** — TaskPanel 移到右側最頂端，改為橫向緊湊佈局（取料→放料→執行 一排）

**P2** — 左側改 Tab 設計：`[RGV 設定] [軌道] [庫位]`，每次只顯示一個區塊，各自獨立捲動

**P3** — 俯視圖與側視圖改為左右並排（`grid-cols-2`）

**P4** — 左側欄加寬 `w-72` → `w-80`（288px → 320px）

## Non-goals

- 不改 SVG 動畫邏輯
- 不改時間計算引擎
- 不改資料結構與 localStorage

## 影響檔案

- `src/App.tsx` — 主佈局重構
- `src/components/RGVConfig.tsx` — 移除 collapse header（Tab 取代）
- `src/components/TrackConfig.tsx` — 移除 collapse header
- `src/components/StorageManager.tsx` — 移除 collapse header，簡化 header
- `src/components/TaskPanel.tsx` — 改橫向緊湊佈局
