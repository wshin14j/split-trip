# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案概述(重要:這個專案有三個名字)

- 產品名:**RoamSplit**(多人旅遊分帳工具)
- 本機資料夾:`~/Documents/roamsplit`
- GitHub 儲存庫:**wshin14j/split-trip**(2026-07-06 從 heyyysia 帳號過戶到使用者個人帳號 wshin14j)

三個名字指的都是同一個專案,不要混淆。

## 架構

- **單檔應用**:整個 app 就是 `index.html`(約 4400 行,HTML/CSS/JS 全部在裡面,沒有框架、沒有建置工具)。`preview.html` 是簡短的預覽/宣傳頁
- **金額計算鐵律(2026-07-06 起)**:所有金額一律經過共用引擎 `calcExp(e,t)` / `calcTrip(t)`(在 index.html 工具函數區,用最大餘數法保證整數加總一致)。網頁、PDF 匯出、CSV 匯出全部取用引擎的整數結果。**絕對不要**在任何顯示處自行 `Math.round`/`toFixed` 重算分攤——那正是過去「表格差一元、各處對不上」的病因。規格:PDF/CSV 的群組 TTL 含公費餘額退款(刻意設計),網頁總支出不含,兩者差額=公費餘額屬預期
- **沒有後端、沒有資料庫**:分帳資料存在使用者瀏覽器的 **localStorage**;分享行程用 **pako** 壓縮後塞進網址的 hash(`location.hash`),對方打開連結即可載入
- 修改時注意:所有功能都在同一個檔案裡,改動前先確認影響範圍,改完務必本機測試

## 常用指令

```bash
# 本機預覽
python3 -m http.server 8000
# 開 http://localhost:8000
```

## 部署

- 正式網址:**https://roamsplit.pages.dev**(Cloudflare Pages,push 到 main 自動部署)
- Cloudflare 的 git 連結已於 2026-07-06 重新接到 wshin14j/split-trip(過戶後重設),自動部署正常。Cloudflare 帳號用的是 wenchenlee1127@gmail.com
- 使用者用 GitHub Desktop 操作 git(登入 wshin14j 帳號)
