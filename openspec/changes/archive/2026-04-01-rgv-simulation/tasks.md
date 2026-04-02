## 1. 專案初始化

- [x] 1.1 使用 Vite 建立 React + TypeScript 專案（`npm create vite@latest`）
- [x] 1.2 安裝並設定 Tailwind CSS
- [x] 1.3 建立基本目錄結構：`src/lib/`、`src/components/`、`src/context/`、`src/hooks/`、`src/types/`
- [x] 1.4 定義所有 TypeScript 型別（`src/types/index.ts`）：RGV、Track、StorageLayer、StorageLocation、TaskResult、HistoryEntry

## 2. 狀態管理與持久化

- [x] 2.1 建立 `AppContext`（`src/context/AppContext.tsx`）：以 `useReducer` 管理 RGV、軌道、庫位列表、歷史紀錄
- [x] 2.2 實作 localStorage 持久化：state 變更時自動序列化，頁面載入時還原
- [x] 2.3 實作 reducer actions：updateRGV、updateTrack、addStorage、updateStorage、deleteStorage、addHistory、clearHistory

## 3. 時間計算引擎

- [x] 3.1 實作 `calcMoveTime(distance, vMax, accel, decel): number`（`src/lib/timeCalculator.ts`），處理梯形與三角速度曲線，以及 distance=0 邊界情況
- [x] 3.2 實作 `calcSequentialTask(rgv, pickStorage, pickLayer, placeStorage, placeLayer): StepResult[]`：計算 10 步驟各別時間
- [x] 3.3 實作 `calcConcurrentTask(rgv, pickStorage, pickLayer, placeStorage, placeLayer): StepResult[]`：計算疊加模式關鍵路徑，輸出每步驟的 `startAt` 與 `duration`
- [x] 3.4 為 `calcMoveTime` 撰寫測試案例（梯形、三角、零距離邊界）

## 4. 設定面板 — RGV 與軌道

- [x] 4.1 建立 `RGVConfig` 元件（`src/components/RGVConfig.tsx`）：長/寬/高、初始位置、動作模式選擇
- [x] 4.2 建立三軸參數輸入子元件 `AxisParams`：最高速、加速度、減速度輸入欄，含正數驗證
- [x] 4.3 建立 `TrackConfig` 元件（`src/components/TrackConfig.tsx`）：長度、寬度輸入，含驗證
- [x] 4.4 實作初始位置超出軌道的驗證邏輯

## 5. 庫位管理

- [x] 5.1 建立 `StorageManager` 元件（`src/components/StorageManager.tsx`）：庫位列表 + 新增按鈕
- [x] 5.2 建立 `StorageCard` 元件：顯示庫位資訊，可展開編輯
- [x] 5.3 實作庫位表單：名稱、X 位置、側邊（左/右）、層數（1/2）
- [x] 5.4 實作每層的取料高度/深度、放料高度/深度輸入（依層數動態顯示第2層欄位）
- [x] 5.5 實作刪除庫位（含確認對話框）

## 6. 任務面板

- [x] 6.1 建立 `TaskPanel` 元件（`src/components/TaskPanel.tsx`）：取料/放料庫位選單 + 層數選單
- [x] 6.2 實作「執行模擬」按鈕邏輯：驗證已選取料/放料庫位，呼叫計算引擎，更新結果與歷史
- [x] 6.3 實作缺少設定時的提示訊息

## 7. 結果面板

- [x] 7.1 建立 `TimeBreakdown` 元件（`src/components/TimeBreakdown.tsx`）：以表格顯示每步驟名稱、距離、時間
- [x] 7.2 在表格底部顯示序列總時間與疊加總時間
- [x] 7.3 建立 `HistoryLog` 元件（`src/components/HistoryLog.tsx`）：顯示歷史紀錄列表（取料→放料、兩種模式時間、時間戳）
- [x] 7.4 實作「清除歷史」按鈕（含確認）

## 8. 俯視圖 SVG

- [x] 8.1 建立 `TopViewSVG` 元件（`src/components/TopViewSVG.tsx`）：渲染軌道長方形，依 trackLength 比例映射座標
- [x] 8.2 渲染所有庫位（左側在上、右側在下），標示名稱與層數
- [x] 8.3 渲染 RGV 圖形（依 RGV 尺寸等比縮放），初始位置由設定決定
- [x] 8.4 實作目標庫位高亮效果（動畫進行中時標示取料/放料目標）

## 9. 側視圖 SVG

- [x] 9.1 建立 `SideViewSVG` 元件（`src/components/SideViewSVG.tsx`）：渲染 RGV 本體、牙叉、目標庫位格子輪廓
- [x] 9.2 渲染取料/放料高度參考線
- [x] 9.3 實作牙叉高度（Z 軸）與伸出量（Y 軸）的 SVG 屬性綁定

## 10. 動畫播放引擎

- [x] 10.1 建立 `useAnimationPlayer` hook（`src/hooks/useAnimationPlayer.ts`）：以 `requestAnimationFrame` 驅動，維護 `elapsed`（動畫時間）
- [x] 10.2 實作播放、暫停、重置控制，以及速度倍率（1x / 2x / 5x / 10x）
- [x] 10.3 實作 `getAnimationState(elapsed, steps): AnimationState`：根據當前時間插值計算 RGV X 位置、牙叉 Z 位置、牙叉 Y 位置
- [x] 10.4 將 `AnimationState` 傳入 `TopViewSVG` 與 `SideViewSVG`，驅動 SVG 屬性更新（不觸發 React re-render）
- [x] 10.5 建立播放控制列元件 `AnimationControls`（`src/components/AnimationControls.tsx`）

## 11. 整合與收尾

- [x] 11.1 組合主版面（`src/App.tsx`）：左側設定面板、右上模擬視圖、右下任務+結果
- [x] 11.2 確認序列模式與疊加模式計算結果正確（手動驗證邊界案例）
- [x] 11.3 確認動畫時間與計算時間同步（以 1x 速度驗證步驟①②的動畫持續時間）
- [x] 11.4 確認 localStorage 還原正常（重整頁面後設定與歷史不遺失）
- [x] 11.5 修正 UI 細節，確認所有輸入驗證正常運作
