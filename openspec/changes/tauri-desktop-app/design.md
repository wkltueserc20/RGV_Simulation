## Context

RGV 模擬系統目前以 Vite + React + TypeScript 建構，透過瀏覽器執行。Tauri 是以 Rust 為核心的桌面應用框架，使用系統原生 WebView（Windows: WebView2, macOS: WKWebView, Linux: WebKitGTK）呈現前端，不打包 Chromium，因此產出檔案小（Windows 約 3–5 MB）。

現有工具鏈：Node.js + npm + Vite。Tauri CLI 透過 npm 安裝，Rust 工具鏈透過 rustup 安裝。

## Goals / Non-Goals

**Goals:**
- 將現有 React 前端打包為 Windows/macOS/Linux 原生桌面應用
- 保留 `npm run dev` / `npm run build` 的 Web 工作流程不受影響
- 新增 `npm run tauri:dev`（開發）與 `npm run tauri:build`（打包）指令
- 設定合理的視窗大小（1280×800，最小 900×600）
- 使用 localStorage 的現有狀態持久化機制，桌面版完全兼容

**Non-Goals:**
- 不整合 Tauri 原生 API（檔案系統、系統通知等）到現有功能
- 不實作自動更新（updater plugin）
- 不處理程式碼簽章（需另外設定）

## Decisions

### 選擇 Tauri v2（而非 v1）
Tauri v2 於 2024 年 10 月正式發布，API 穩定且支援最新平台。v1 已進入維護模式。

**選擇 Tauri 而非 Electron 的原因：**
- Electron 打包 Chromium，最終約 80–150 MB；Tauri 使用系統 WebView，約 3–10 MB
- Rust 後端記憶體安全，適合長期維護

### vite.config.ts 修改策略
Tauri 要求 dev server 在固定 port（1420）運行，且不自動開啟瀏覽器。透過環境變數 `TAURI_ENV_DEBUG` 偵測 Tauri 環境，條件式套用設定，不影響純 Web 開發。

### src-tauri 結構
標準 Tauri v2 結構：
```
src-tauri/
  Cargo.toml       — workspace 設定，依賴 tauri 2.x
  build.rs         — Tauri 建構腳本
  tauri.conf.json  — 視窗、bundle、安全設定
  src/
    main.rs        — Tauri app builder（最小化）
    lib.rs         — run() 函式（供 main.rs 呼叫）
  icons/           — 多尺寸圖示（由 tauri icon 指令產生或手動放置）
  capabilities/    — 權限設定（Tauri v2）
```

### package.json 腳本
```json
"tauri:dev":   "tauri dev",
"tauri:build": "tauri build"
```
`@tauri-apps/cli` 放在 devDependencies，`@tauri-apps/api` 放在 dependencies。

## Risks / Trade-offs

- **Rust 工具鏈安裝**：使用者環境需先安裝 rustup 及 Rust stable toolchain。首次 `cargo build` 需下載編譯依賴（約需數分鐘）→ 於 README 說明前置需求。
- **Windows WebView2**：Windows 10/11 已預裝 WebView2；舊版 Windows 需額外安裝 → 打包設定使用 `webviewInstallMode: { type: "downloadBootstrapper" }` 自動處理。
- **Three.js / WebGL**：Tauri 使用系統 WebView，WebGL 支援程度視驅動而定。現有 3D 視圖在絕大多數現代系統上正常，但舊硬體可能降級。
- **localStorage 路徑**：桌面版的 localStorage 儲存在應用程式資料目錄，不與瀏覽器共用 → 符合預期，各環境獨立。

## Migration Plan

1. 安裝 Rust 工具鏈（rustup）
2. 執行 `npm install` 取得新增的 `@tauri-apps/cli`
3. 執行 `npm run tauri:dev` 驗證開發環境
4. 執行 `npm run tauri:build` 產生發布包
5. 發布包位於 `src-tauri/target/release/bundle/`

**回滾**：刪除 `src-tauri/` 目錄、還原 `package.json` 與 `vite.config.ts` 即可完全移除 Tauri，不影響 Web 版本。
