# RGV 模擬系統

Rail Guided Vehicle 行走模擬與時間計算工具

**線上展示：** https://wkltueserc20.github.io/RGV_Simulation/

## 功能

- **RGV 設定** — 長寬高、初始位置、行走高度、三軸（行走/升降/進退）各自的最高速、加速度、減速度（可折疊）
- **軌道設定** — 長度、寬度
- **庫位管理** — 雙側配置（左/右）、1～2 層、每層取料高度/深度與放料高度/深度；支援批次設定尺寸與深度
- **庫位尺寸** — 每個庫位可設定寬度（沿軌道方向）與深度（垂直軌道方向），俯視圖與側視圖同步顯示實際比例
- **時間計算** — 含加減速的物理模型（梯形/三角速度曲線），支援序列與疊加兩種模式
- **流程任務** — 可設定多步驟連續取放（A→B→C→D...），RGV 從上一步終點接續出發
- **SVG 動畫** — 俯視圖（全寬，RGV 沿軌道移動、庫位依尺寸比例顯示）+ 側視圖（叉臂升降/進退、庫位輪廓）
- **歷史紀錄** — 每次模擬結果自動儲存
- **側欄可收合** — 設定欄可收合以擴大模擬視圖

## 完整作業工序（12 步）

```
① 行走到取料位置
② 升至取料高度
③ 牙叉伸入（取料）
④ 升至帶貨高度（離架）
⑤ 牙叉退回（載貨）
⑥ 降至行走高度
⑦ 行走到放料位置
⑧ 升至放料高度
⑨ 牙叉伸入（放料）
⑩ 降至落架高度（入架）
⑪ 牙叉退回（空載）
⑫ 降至行走高度
```

## 下載桌面版

前往 [Releases](https://github.com/wkltueserc20/RGV_Simulation/releases) 下載最新版 `rgv-simulation.exe`，直接執行即可（需 Windows 10/11，已預裝 WebView2）。

## 本地執行（Web 版）

```bash
npm install
npm run dev
```

## 桌面版開發（Tauri + Rust）

前置需求：[Rust（rustup）](https://rustup.rs)

```bash
# 開發模式（視窗 + hot reload）
npm run tauri:dev

# 打包發布（產出於 src-tauri/target/release/）
npm run tauri:build
```

## 技術棧

React 18 · TypeScript · SVG · Tailwind CSS · Vite · Tauri 2（Rust）
