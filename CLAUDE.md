# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案概述(重要:這個專案有三個名字)

- 產品名:**RoamSplit**(多人旅遊分帳工具)
- 本機資料夾:`~/Documents/roamsplit`
- GitHub 儲存庫:**wshin14j/split-trip**(2026-07-06 從 heyyysia 帳號過戶到使用者個人帳號 wshin14j)

三個名字指的都是同一個專案,不要混淆。

## 架構

- **單檔應用**:整個 app 就是 `index.html`(約 4400 行,HTML/CSS/JS 全部在裡面,沒有框架、沒有建置工具)。`preview.html` 是簡短的預覽/宣傳頁
- **金額計算鐵律(2026-07-06 起)**:所有金額一律經過共用引擎 `calcExp(e,t)` / `calcTrip(t)`(在 index.html 工具函數區,用最大餘數法保證整數加總一致;尾差以 createdAt 為種子逐筆輪流分配)。網頁、PDF 匯出、CSV 匯出全部取用引擎的整數結果。**絕對不要**在任何顯示處自行 `Math.round`/`toFixed` 重算分攤——那正是過去「表格差一元、各處對不上」的病因。規格:PDF/CSV 的群組 TTL 含公費餘額退款(刻意設計),網頁總支出不含,兩者差額=公費餘額屬預期
- **強制驗收(使用者明確要求,不可跳過)**:任何涉及金額、分攤、匯出的修改,完成後**必須**開啟 `index.html#selftest`(本機起 server 後帶 #selftest 開頁)執行內建自我驗收,**八項全綠才算完成**;有紅色就是改壞了別處,禁止宣稱完成或發佈。這是為了根絕「改 A 壞 B、改 B 壞 A」的鬼打牆——使用者深惡痛絕此情況。修改策略一律「改引擎、驗全局」,禁止在個別顯示處打補丁
- **資料儲存與同步**:分帳資料存在使用者瀏覽器的 **localStorage**,同時透過 **Firebase Realtime Database**(`fbWrite`/`fbListen`,SSE 即時監聽)雲端同步——任何人修改行程,其他開過同一行程的裝置會即時更新,**不是純離線單機**。分享行程用 **pako** 壓縮後塞進網址的 hash(`location.hash`),對方打開連結即可載入並加入同步
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
