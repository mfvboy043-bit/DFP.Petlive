# Tailscale：在外面用手機開本機 Petlive

不公開上網。只有你 Tailscale 帳號裡的裝置進得去。

## 建議：用耐用預覽腳本（daemon，較不易斷）

在 repo root：

```bash
./deploy/start-preview.sh
```

這會用 **double-fork daemon**（PPID=1）跑預覽：Cursor／agent 結束後 server 仍會活著。  
並寫入 `deploy/preview-access.log`（可確認手機有沒有打進來）。

停止：

```bash
./deploy/stop-preview.sh
```

## 手動方式（舊）

```bash
cd ~/Desktop/petlive
python3 -m http.server 5173 --bind 0.0.0.0 --directory .
```

保持這個 Terminal **不要關**。  
注意：從 Cursor agent 開的 `http.server` 常會在任務結束後消失，或長時間後僵死。

## 查電腦的 Tailscale IP

```bash
/Applications/Tailscale.app/Contents/MacOS/Tailscale ip -4
```

## 手機開啟

### 同 Wi‑Fi（家裡）

用 **Wi‑Fi IP**（這台 Mac 通常是 `en1`），不要用 Ethernet `en0`：

```text
http://192.168.0.24:5173/apps/web/
```

（IP 以 `./deploy/start-preview.sh` 印出的為準。）

### 外面／4G（Tailscale）

1. iPhone Tailscale App → **Connected**（同一個帳號）  
2. Mac Tailscale 也要 Connected、預覽腳本要在跑  
3. 開：

```text
http://100.70.15.79:5173/apps/web/
```

（IP 以 `tailscale ip -4` 為準。）

第一次開成功後：分享 → 加入主畫面。

## 為何「一直斷線」

| 原因 | 症狀 | 處理 |
|---|---|---|
| Cursor／agent 結束殺掉 server | 突然連不上 | `./deploy/start-preview.sh` |
| `http.server` 僵死仍 LISTEN | Mac curl 空回應／偶發失敗 | 腳本健康檢查會重啟 |
| 用了 Ethernet IP、手機在 Wi‑Fi | 只有一種 IP 通 | 用 `en1` Wi‑Fi IP |
| iPhone Tailscale offline | 外面完全打不開 | 手機打開 Tailscale → Connected |
| 路由器隔離／訪客 Wi‑Fi | Mac curl 200，手機永遠沒進 log | 同 SSID，或用 Tailscale／熱點 |

看 `deploy/preview-access.log`：若沒有 Mobile Safari／iPhone UA，是網路問題，不是網頁壞掉。

## 市調當下 checklist

1. `./deploy/start-preview.sh` → HTTP 200  
2. 家裡：手機開 Wi‑Fi URL  
3. 外面：Mac + iPhone Tailscale 都 Connected → 開 Tailscale URL  
4. 仍失敗：看 `deploy/preview-access.log` 有無手機請求
