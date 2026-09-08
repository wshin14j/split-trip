# CORE_RULES.md

本檔案是 Claude Code 與 Codex 共用的專案核心規則。

## 專案概述(重要:這個專案有三個名字)

- 產品名:**RoamSplit**(多人旅遊分帳工具)
- 本機資料夾:`~/Documents/VC專案/roamsplit`
- GitHub 儲存庫:**wshin14j/split-trip**(2026-07-06 從 heyyysia 帳號過戶到使用者個人帳號 wshin14j)

三個名字指的都是同一個專案,不要混淆。

## 架構

- **單檔應用**:整個 app 就是 `index.html`(約 4400 行,HTML/CSS/JS 全部在裡面,沒有框架、沒有建置工具)。`preview.html` 是簡短的預覽/宣傳頁
- **金額計算鐵律（2026-09-08 定案）**：所有金額一律經過共用引擎 `calcExp(e,t)` / `calcTrip(t)`，換匯、分攤、小計、總計與互欠全程保留完整小數；不要在個別報表另算一套。網頁、PDF、CSV 僅在最後顯示時各格四捨五入為整數，因此 `100 ÷ 3` 可顯示為 `33／33／33`，明細、分攤與顯示合計相加可能相差幾元。Excel 的儲存格與 SUM 公式保留完整小數，但套用 `#,##0` 顯示整數，按「增加小數位數」即可看真值。只有實際「誰付誰」的待付款餘額與轉帳建議，才經 `roundSettlementBalances`＋最大餘數法調整為整數，保證付款方與收款方加總一致、完成後歸零。**公款帳混合付款（2026-07-10 起）**：`calcExp` 回傳精確的 `fundPaid`，每人分攤拆成 `peerShares`（同伴份額，加總＝總額−fundPaid）與 `fundShares`（公費份額，加總＝fundPaid，逐人 peer＋fund＝shares）；`peerBal` 互欠只計 `peerShares` 與非公款實付。「跟公費的帳」／公款卡餘額／PDF／CSV 公款欄一律取 `fundShares` 或公款實付部分，**不要只用「paidBy 是字串且＝公款帳」判斷公費支出**，多人付款（paidBy 為物件）也可能含公款帳。PDF／CSV 的群組 TTL＝實際花費，**不含**公費餘額退款；剩餘退款只顯示在公款帳欄。報表恆等式對底層精確數值成立；不要要求各格四捨五入後的畫面數字仍逐欄完全相等。
- **強制驗收（使用者明確要求，不可跳過）**：任何涉及金額、分攤、匯出的修改，完成後**必須**開啟 `index.html#selftest` 執行內建自我驗收，**14 項全綠才算完成**（2026-09-08 起含精確分攤、整數轉帳歸零、PDF／CSV 整數顯示與精度提醒）；有紅色就禁止宣稱完成或發佈。修改策略一律「改引擎、驗全局」，禁止在個別顯示處另做一套分攤。
- **資料儲存與同步**:分帳資料存在使用者瀏覽器的 **localStorage**,同時透過 **Firebase Realtime Database**(`fbWrite`/`fbListen`,SSE 即時監聽)雲端同步——任何人修改行程,其他開過同一行程的裝置會即時更新,**不是純離線單機**。分享行程用 **pako** 壓縮後塞進網址的 hash(`location.hash`),對方打開連結即可載入並加入同步
- **PDF 列印(2026-07-07 修)**:`exportPDF` 開新視窗列印。明細表格外層是 `.tbl-scroll`(overflow-x:auto),螢幕可捲動,但**列印時 overflow 會把右側欄位裁掉留白**——這是舊版存出 PDF「右邊空白、調縮放也救不回」的病因(裁切發生在縮放之前)。修法:列印頁 CSS 設 `@page{size:A4 landscape}` + `@media print{.tbl-scroll{overflow:visible}}`,並用 JS `__fitAndPrint` 量測最寬表格、以 **zoom**(非 transform,zoom 才會改變佈局尺寸讓列印引擎正確排版)自動縮到 A4 橫向可列印寬(約 281mm)。**注意 Safari(WebKit)不理會 `@page{size:landscape}`,不會自動轉橫向,使用者需在列印對話框手動選橫向;Chrome 才會自動橫向。內容不全的問題靠 overflow:visible + zoom 已解決,方向是平台限制。**改這段務必確認所有成員/幣別欄都在頁寬內(可用 iframe + elementFromPoint 驗證欄位未被裁,截圖會被 preview 視口寬度誤導)
- **結算「成員花費與墊付總覽」卡片(2026-07-07 改版)**:每位成員可點開。**收合態**只顯示「總花費 + 應付/應收」(維持舊版,不可動)。**展開態**為三段式:①花費構成(5 項相加=總花費,其中會進同伴結算的「全員/部分/墊付」3 項金額標 `var(--accent)` 藍色)②跟同伴的帳(白底 2px 藍框突顯:我該分攤−已先付=應付/應收,應付紅、應收綠)③跟公費的帳(存入−用掉=可退回/需補繳)。程式在 `memberSummary` 的 `expandedRows`。**手機寬度關鍵**:成員列用 `flex-wrap:wrap`,展開內容放在 `flex-basis:100%` 子元素換行佔滿整卡寬——否則展開內容會擠在 avatar 右側窄欄、右邊金額被切。所有數字取自現有變數(psp/ppsp/proxySp/fsp/personalSp/netShare/netPaid/peerAdj/fp),未改引擎
- **匯率設定頁(2026-07-08 改版)**:`DEF` 預設匯率已更新為 2026 年 7 月市場值(來源 fawazahmed0/exchange-api,與 `fetchLiveRates` 同一份)。UI 優化:①輸入框 `.rate-input-wrap` 加邊框＋鉛筆 icon＋focus 藍框(可編輯感)②每列標「預設／已調整」狀態(`t.rates[c]` 與 `DEF[c]` 不同即已調整,框與數字轉藍)③右側「已調整 ↺」可點即重設回該幣別預設(`resetOneRate`)④改任何值即時偵測(`onRateInput`)並在頂部 sticky 顯示未儲存提示條⑤底部標匯率來源。**注意**:改 `DEF` 會影響「未曾在匯率頁按儲存、仍吃預設值」的行程換算;已存過 `t.rates` 的行程鎖住自己的值、不受影響
- 修改時注意:所有功能都在同一個檔案裡,改動前先確認影響範圍,改完務必本機測試

## 常用指令

```bash
# 本機預覽
python3 -m http.server 8000
# 開 http://localhost:8000
```

## 部署

- 正式網址:**https://roamsplit.pages.dev**(Cloudflare Pages,push 到 main 自動部署)
- Cloudflare 的 git 連結已於 2026-07-06 重新接到 wshin14j/split-trip(過戶後重設),自動部署正常。Cloudflare 帳號 email 見私人文件（不寫在此檔,因為本檔會被部署成公開網頁）
- 使用者用 GitHub Desktop 操作 git(登入 wshin14j 帳號)
- **匯率即時來源(2026-07-09 定案)**:「取得即時匯率」與 `autoFillRate` 都用 **ExchangeRate-API**(`https://open.er-api.com/v6/latest/TWD`,免費免 key、前端直抓、有 CORS、每日更新、166 幣別含 OMR;回傳 base=TWD 的 `rates`,用 `1/rate` 換算成「1 外幣=X 台幣」)。來源透明(官網 exchangerate-api.com,彙整各國央行＋商業來源),比先前的 fawazahmed0(匿名、慢 2 天)好。**曾嘗試接台灣銀行「現金賣出」但失敗**:台銀有 JS challenge＋擋雲端 IP,Cloudflare 中繼取回 Challenge 頁(count:0);FinMind 需 token、依賴第三方,不採,已移除 `functions/bank-rates.js`。**結論:分帳用市場參考價比含銀行價差的現金賣出公允,勿再走台銀路線**
