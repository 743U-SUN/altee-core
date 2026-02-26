---
description: WSL2環境でChromeをCDPモードで起動し、browser_subagent で操作・スクリーンショット撮影を行うためのワークフロー
---

# Browser Subagent Setup & Usage

WSL2環境で `browser_subagent` を使用するためのセットアップ手順と、典型的な使用例です。

## 1. Chromeの起動（CDPモード）

まず、以下のコマンドでChromeをリモートデバッグモードで起動します。これを行わないと `browser_subagent` は接続できません。

// turbo
1. 既存のプロセスをクリーンアップして起動:
```bash
CHROME_BIN=$(which google-chrome-stable 2>/dev/null || which chromium-browser 2>/dev/null) && \
pkill -9 -f chrome 2>/dev/null; pkill -9 -f chromium 2>/dev/null; sleep 1; \
nohup $CHROME_BIN --remote-debugging-port=9222 --remote-debugging-address=127.0.0.1 --no-first-run --no-default-browser-check --user-data-dir="$HOME/.gemini/antigravity-browser-profile" > /dev/null 2>&1 &
```

// turbo
2. 接続確認（バージョン情報が取得できればOK）:
```bash
sleep 3 && curl -s http://127.0.0.1:9222/json/version | head -n 3
```

## 2. Browser Subagentの使用方法（Agent向け）

Chrome起動後、`browser_subagent` ツールを使用して検証を行います。

### 一般的なverify手順

Taskプロンプト（`Task` 引数）の例：

> Navigate to http://localhost:3000/YOUR_PATH.
> Locate the [TARGET ELEMENT].
> Take a screenshot to verify [DESIGN REQUIREMENTS].
> Save the screenshot as 'verification_artifact_name'.

### 注意点
- **WSL2特有:** `open_browser_url` ツールが失敗したとしても、Chromeがポート9222で起動していれば、`browser_subagent` は接続して動作する場合が多いです。エラーでも直ちに諦めず、`browser_subagent` の実行結果を確認してください。
- **Screenshot:** 生成されたスクリーンショットは、自動的にArtifactディレクトリに保存され、ユーザーに見せることができます。
