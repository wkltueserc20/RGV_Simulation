## 1. 安裝依賴與 npm 腳本

- [x] 1.1 在 `package.json` 的 devDependencies 加入 `@tauri-apps/cli`（`^2`）
- [x] 1.2 在 `package.json` 的 dependencies 加入 `@tauri-apps/api`（`^2`）
- [x] 1.3 在 `package.json` 的 `scripts` 加入 `"tauri:dev": "tauri dev"` 與 `"tauri:build": "tauri build"`
- [x] 1.4 執行 `npm install` 安裝新依賴

## 2. 建立 src-tauri 殼層結構

- [x] 2.1 建立 `src-tauri/` 目錄結構（`src/`、`icons/`、`capabilities/`）
- [x] 2.2 建立 `src-tauri/Cargo.toml`（workspace 設定，依賴 `tauri = "2"`、`tauri-build = "2"`）
- [x] 2.3 建立 `src-tauri/build.rs`（標準 Tauri 建構腳本）
- [x] 2.4 建立 `src-tauri/src/lib.rs`（`run()` 函式，使用 `tauri::Builder::default()`）
- [x] 2.5 建立 `src-tauri/src/main.rs`（呼叫 `lib::run()`，設定 `#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]`）

## 3. 設定 tauri.conf.json

- [x] 3.1 建立 `src-tauri/tauri.conf.json`，設定 `productName: "RGV 模擬系統"`
- [x] 3.2 設定視窗：`width: 1280`、`height: 800`、`minWidth: 900`、`minHeight: 600`、`title: "RGV 模擬系統"`
- [x] 3.3 設定 `bundle.identifier: "com.chingtech.rgv-simulator"`
- [x] 3.4 設定 `build.devUrl: "http://localhost:1420"`，`build.frontendDist: "../dist"`
- [x] 3.5 設定 `build.beforeDevCommand: "npm run dev"` 與 `build.beforeBuildCommand: "npm run build"`

## 4. 設定 Tauri 權限（capabilities）

- [x] 4.1 建立 `src-tauri/capabilities/default.json`，授予基本視窗操作權限（`core:default`）

## 5. 修改 vite.config.ts

- [x] 5.1 在 `vite.config.ts` 的 `server` 設定加入：Tauri 環境下 `port: 1420`、`strictPort: true`、`open: false`（透過 `process.env.TAURI_ENV_DEBUG` 判斷）

## 6. 加入 .gitignore 規則

- [x] 6.1 在 `.gitignore`（或建立如不存在）加入 `src-tauri/target/` 排除 Rust 編譯產物

## 7. 驗證

- [x] 7.1 執行 `cargo check` 於 `src-tauri/` 確認 Rust 設定無誤
- [x] 7.2 確認 `npm run dev` 仍正常啟動 Web dev server（不受 Tauri 影響）
