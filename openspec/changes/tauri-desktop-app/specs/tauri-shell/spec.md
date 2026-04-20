## ADDED Requirements

### Requirement: Tauri 應用程式殼層結構
專案 SHALL 包含完整的 Tauri v2 殼層，包括 `src-tauri/Cargo.toml`、`src-tauri/tauri.conf.json`、`src-tauri/src/main.rs`、`src-tauri/src/lib.rs`、`src-tauri/build.rs`，以及 `src-tauri/capabilities/` 目錄。

#### Scenario: Cargo 設定正確
- **WHEN** 執行 `cargo check` 於 `src-tauri/` 目錄
- **THEN** 不產生任何錯誤，依賴解析成功

#### Scenario: Tauri 設定包含正確 bundle 識別碼
- **WHEN** 讀取 `tauri.conf.json`
- **THEN** `bundle.identifier` 為 `com.chingtech.rgv-simulator`，`productName` 為 `RGV 模擬系統`

### Requirement: 開發與建構 npm 腳本
`package.json` SHALL 包含 `tauri:dev` 與 `tauri:build` 腳本，分別對應 `tauri dev` 與 `tauri build` 指令。`@tauri-apps/cli` SHALL 列於 devDependencies，`@tauri-apps/api` SHALL 列於 dependencies。

#### Scenario: 開發腳本存在
- **WHEN** 執行 `npm run tauri:dev`
- **THEN** Tauri CLI 啟動 Vite dev server 並開啟桌面視窗

#### Scenario: 建構腳本存在
- **WHEN** 執行 `npm run tauri:build`
- **THEN** 產生平台原生安裝檔於 `src-tauri/target/release/bundle/`

### Requirement: 視窗尺寸設定
應用程式視窗 SHALL 預設寬 1280px、高 800px，最小寬 900px、最小高 600px，標題顯示為「RGV 模擬系統」。

#### Scenario: 視窗以正確尺寸開啟
- **WHEN** 啟動桌面應用程式
- **THEN** 視窗以 1280×800 開啟，標題列顯示「RGV 模擬系統」

#### Scenario: 視窗可縮小但有下限
- **WHEN** 使用者縮小視窗
- **THEN** 視窗不小於 900×600

### Requirement: Vite dev server 固定 port
在 Tauri 開發模式下，Vite dev server SHALL 監聽 port 1420，且不自動開啟瀏覽器（`open: false`）。

#### Scenario: Tauri dev 使用固定 port
- **WHEN** 執行 `npm run tauri:dev`
- **THEN** Vite 在 port 1420 啟動，Tauri 視窗連線至 `http://localhost:1420`

### Requirement: 現有 Web 工作流程不受影響
執行 `npm run dev` 與 `npm run build` 的行為 SHALL 與加入 Tauri 前完全相同。

#### Scenario: Web dev server 正常啟動
- **WHEN** 執行 `npm run dev`（不使用 Tauri）
- **THEN** Vite 正常啟動於預設 port（5173），行為與加入 Tauri 前一致
