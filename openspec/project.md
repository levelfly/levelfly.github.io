# Project Context

## Purpose

levelfly.github.io 是個人專用的 GitHub Pages 靜態網站集合，用於託管各種實用工具和資訊整理頁面。主要服務於家庭生活需求，包含旅遊攻略、比價工具、資訊整理等。

## Tech Stack

- HTML5 / CSS3 / Vanilla JavaScript
- GitHub Pages 靜態託管
- JSON 資料檔案
- 響應式設計（手機優先）

## Project Conventions

### Code Style

- 使用繁體中文作為主要語言
- HTML/CSS/JS 檔案使用 UTF-8 編碼
- 縮排使用 2 空格
- 命名使用 kebab-case（檔案）和 camelCase（JavaScript 變數）

### Architecture Patterns

- 單頁應用或多頁靜態網站
- 資料與呈現分離（JSON + JavaScript 渲染）
- 元件化 CSS（可重用的樣式類別）
- 漸進增強（基本功能不依賴 JavaScript）

### Testing Strategy

- 手動測試為主
- 瀏覽器相容性測試（Chrome、Safari、Firefox）
- 手機裝置測試（iOS Safari、Android Chrome）

### Git Workflow

- 主分支：master
- 功能分支：feature/[feature-name]
- 直接推送到 master 進行部署
- Commit message 使用繁體中文或英文皆可

## Domain Context

### 現有專案

| 專案 | 用途 | 狀態 |
|------|------|------|
| `tainan-family-trip/` | 台南親子旅遊攻略 | 維護中 |
| `tainan-car-rental/` | 台南租車比較指南 | 維護中 |
| `restaurant-finder/` | 餐廳搜尋工具 | 維護中 |

### 目標用戶

- 主要：家庭成員
- 使用情境：旅遊規劃、資訊查詢
- 裝置：手機為主、平板和桌機為輔

## Important Constraints

- **私人使用**：網站內容僅供家庭使用，不作商業用途
- **靜態託管**：GitHub Pages 限制，無後端伺服器
- **離線需求**：部分功能需支援離線瀏覽
- **圖片資源**：可下載圖片至本地使用（私人用途）

## External Dependencies

- GitHub Pages（託管）
- Google Fonts（字體）
- Google Maps Embed API（地圖，選用）
