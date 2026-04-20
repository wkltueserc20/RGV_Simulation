## Why

目前 RGV 模擬系統是純 Web 應用，需要瀏覽器才能執行，無法作為獨立的桌面程式發布。使用 Tauri（基於 Rust + Cargo）打包後，可將現有的 React/TypeScript 前端封裝成原生桌面執行檔（Windows .exe / macOS .app / Linux binary），讓使用者無需安裝瀏覽器或 Node.js 即可直接開啟。

## What Changes

- 新增 Tauri 專案結構（`src-tauri/` 目錄），包含 Rust Cargo 設定、Tauri 設定檔
- 新增 `src-tauri/src/main.rs` — Tauri 應用程式入口
- 新增 `src-tauri/Cargo.toml` — Rust 依賴管理
- 新增 `src-tauri/tauri.conf.json` — 視窗大小、應用名稱、打包設定
- 新增 `src-tauri/icons/` — 應用程式圖示（多尺寸）
- 修改 `package.json` — 新增 `tauri:dev`、`tauri:build` 指令
- 修改 `vite.config.ts` — 加入 Tauri 所需的 dev server 設定（port 固定、不自動開啟瀏覽器）

## Capabilities

### New Capabilities
- `tauri-shell`: Rust/Tauri 應用程式殼層，負責視窗管理與桌面整合

### Modified Capabilities
- （無需求層級變更，現有 Web 功能維持不變）

## Impact

- **新增依賴**：`@tauri-apps/cli`（devDependency）、`@tauri-apps/api`（dependency）
- **Rust 工具鏈**：需要本機安裝 Rust（rustup）及 Cargo
- **打包產出**：`src-tauri/target/release/bundle/` 下產生平台原生安裝檔
- **不影響**：現有 Web 版本（`npm run dev`、`npm run build`）維持不變
