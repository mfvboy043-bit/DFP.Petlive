# GitHub Pages + Google OAuth（上線測試）

Petlive 是靜態站：Pages 必須從 **repo 根目錄** 發佈，才能同時提供 `/apps/web/` 與 `/modules/`。

正式網址形狀：

`https://<user>.github.io/<repo>/apps/web/`

## 手機為什麼 LAN IP 登不了？

Google OAuth **不接受** `http://192.168.x.x` 這類區網 IP 當「授權的 JavaScript 來源」（非 localhost 必須是 **https**）。

因此：

| 裝置 | 可用網址 |
|---|---|
| 電腦本機 | `http://127.0.0.1:5173/apps/web/` 或 `http://localhost:5173/apps/web/` |
| 手機 | 必須用 GitHub Pages 的 `https://…` |

請在 OAuth 用戶端加上：

```text
# 授權的 JavaScript 來源（不要加路徑、不要結尾 /）
http://127.0.0.1:5173
http://localhost:5173
https://<user>.github.io

# 授權的重新導向 URI（建議一併加上，同樣不要路徑）
http://127.0.0.1:5173
http://localhost:5173
https://<user>.github.io
```

**不要**在 Cursor 內建預覽裡測 Google 登入——選完帳號後常無法回跳。請用系統的 Chrome / Safari 開：

`http://127.0.0.1:5173/apps/web/`

不要指望加 `http://192.168.0.24:5173` 就能讓手機過——Google 會擋。

## 1. 啟用 Pages

1. 把專案推到 GitHub（目前本機若尚未 `git init`，先建立 repo 再 push）。
2. Settings → Pages → Build and deployment → Source: **GitHub Actions**。
3. 合併／推送後，workflow [`.github/workflows/pages.yml`](../.github/workflows/pages.yml) 會部署整份 repo。
4. 根目錄已放 [`.nojekyll`](../.nojekyll)，避免 Jekyll 吃掉底線路徑。

## 2. Google Cloud OAuth（免費）

1. 開 [Google Cloud Console](https://console.cloud.google.com/) → 新專案。
2. API 與服務 → 啟用 **Google Drive API**。
3. OAuth 同意畫面：External；測試使用者加入你的 Gmail。
4. 建立憑證 → **OAuth 用戶端 ID** → 應用程式類型 **網頁應用程式**。
5. **授權的 JavaScript 來源** 加入：
   - `http://localhost:5173`
   - `https://<user>.github.io`
6. **授權的重新導向 URI**（GIS token client 通常可不填；若 Console 強制，可加 Pages 網址）。
7. 複製 Client ID → 貼到 [`apps/web/config.public.js`](../apps/web/config.public.js) 的 `googleClientId`。
   - **不要**把 client secret 放進 repo（瀏覽器登入用不到）。

## 3. 驗收（飼主雲端）

1. 開啟 Pages 上的 `/apps/web/`。
2. 介紹頁右上「登入」或「用 Google 登入」。
3. 同意後，到 [Google Drive](https://drive.google.com) 應看到資料夾 **火龍果護照** 與檔案 `petlive-passport.json`。
4. 換裝置／無痕視窗同帳號登入 → 應讀回寵物主圖（不含大圖藥單／影像 data URL）。

## 4. 本機預覽

```bash
python3 -m http.server 5173 --bind 0.0.0.0 --directory .
# http://127.0.0.1:5173/apps/web/
```

OAuth 本機也要在 Client 的 JS 來源白名單裡有 `http://localhost:5173`。
