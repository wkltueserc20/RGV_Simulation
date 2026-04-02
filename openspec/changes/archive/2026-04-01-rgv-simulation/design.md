## Context

全新建立的前端應用，無既有程式碼基礎。技術棧選定為 React + TypeScript + SVG + Tailwind CSS + Vite。系統為純前端，不需後端或資料庫。核心挑戰有三：

1. **物理時間計算準確性**：加減速模型需正確處理梯形與三角速度曲線兩種情況
2. **SVG 動畫的即時性**：動畫需忠實反映計算出的時間序列，並支援速度倍率
3. **疊加模式的關鍵路徑計算**：並行動作需以 timeline overlap 方式求最短總時間

## Goals / Non-Goals

**Goals:**
- 精確實作加減速物理模型（mm/s、mm/s²）
- 支援序列與疊加兩種動作模式
- 雙側庫位、1/2 層配置的完整管理
- SVG 動畫（俯視 + 側視）含速度倍率控制
- 單次作業時間明細 + 歷史紀錄

**Non-Goals:**
- 多台 RGV 同時作業（碰撞迴避）
- 後端 API 或資料持久化（localStorage 即可）
- 3D 視覺化
- 任務佇列（多步驟連續作業）
- 行動裝置響應式設計

## Decisions

### D1：時間計算引擎獨立為純函式模組

**決策**：將 `calcMoveTime` 及所有作業步驟計算放在 `src/lib/timeCalculator.ts`，完全與 React 無關。

**理由**：便於單元測試；動畫系統與計算系統可獨立演進；避免計算邏輯散落在元件中。

**替代方案**：在 React hook 內計算 → 難以測試，且計算觸發時機與渲染耦合。

---

### D2：動畫驅動方式採用 requestAnimationFrame + 時間軸映射

**決策**：計算出所有步驟的 `[startTime, endTime, fromValue, toValue]` 序列後，用 `requestAnimationFrame` 根據當前動畫時間（`elapsed × speedMultiplier`）插值計算各軸位置。

**理由**：
- 速度倍率只需修改時間縮放係數，無需重算
- 暫停/恢復只需記錄 offset
- 動畫狀態與 React state 解耦，避免不必要重渲染

**替代方案**：CSS transition → 無法精確控制多軸同步時序；Framer Motion → 過重，且難以自訂物理曲線。

---

### D3：疊加模式以 Timeline Segments 計算關鍵路徑

**決策**：將每個動作視為 `{ axis, startAt, duration }`，疊加規則為：
- 行走（X）與升降（Z）可重疊：升降在行走結束前 `overlap_z` 秒開始
- 進退（Y）必須在 X 靜止且 Z 到位後才能開始
- 總時間 = 最後一個動作的 `startAt + duration`

**替代方案**：純序列加總 → 已作為序列模式實作；事件驅動狀態機 → 過度複雜。

---

### D4：狀態管理使用 React Context + useReducer

**決策**：全局狀態（RGV 設定、軌道、庫位列表、歷史紀錄）放在一個 `AppContext`，以 `useReducer` 管理。動畫狀態（播放中、當前時間）用獨立的 `useAnimationPlayer` hook。

**理由**：避免 Redux 的樣板代碼；狀態結構清晰；useReducer 天然支援複雜狀態轉換。

---

### D5：資料持久化使用 localStorage

**決策**：每次 state 變更後，將設定序列化存入 `localStorage`，頁面重載後自動還原。

**理由**：純前端需求，無需後端。歷史紀錄也一併存入。

---

### D6：SVG 座標系統

**俯視圖**：以軌道左端為原點，X 軸向右為正（對應 RGV 行走方向）。庫位以 `position / trackLength × svgWidth` 映射到畫面 X 座標。左側庫位在軌道上方，右側在下方。

**側視圖**：以 RGV 底部為原點，Z 軸向上為正（牙叉高度），Y 軸向右為正（牙叉伸出方向）。

## Risks / Trade-offs

| 風險 | 緩解策略 |
|------|----------|
| 疊加模式時序計算有 edge case（極短距離/極高加速度）| 三角速度曲線公式需對 `d=0` 做防護，加單元測試覆蓋邊界 |
| SVG 動畫在低階裝置可能卡頓 | 動畫僅更新少數 SVG 屬性，不觸發 React re-render |
| localStorage 容量限制 | 歷史紀錄僅存最近 100 筆 |
| 用戶輸入非法值（負數、零速度）| 所有輸入欄位加入驗證，計算前檢查前置條件 |

## Migration Plan

全新專案，無遷移需求。部署方式：`vite build` 產出靜態檔案，可直接用瀏覽器開啟 `index.html`。

## Open Questions

（無。所有技術決策已在探索階段與使用者確認。）
