# Cloudflare R2 カスタムドメイン設定ガイド

## 背景

現在R2の画像配信URLは `r2.dev` サブドメイン（`pub-xxx.r2.dev`）を使用中。
`r2.dev` にはレート制限があり、本番運用では独自ドメイン（`cdn.altee.me`）への切り替えが推奨される。

### 現在の構成

| 項目 | 値 |
|------|-----|
| ドメイン取得 | Xserver Domain (Xdomain) |
| ネームサーバー | さくらインターネット |
| R2バケット | `altee-images` |
| 現在の配信URL | `https://pub-3545e489531d41b58d69b4f9254ddb48.r2.dev` |
| 目標の配信URL | `https://cdn.altee.me` |

### 前提条件

Cloudflare R2のカスタムドメイン機能を使うには、**ドメインがCloudflareアカウントにゾーンとして追加されている必要がある**。
現在のようにさくらインターネットのネームサーバーを使っている状態では設定できない。

---

## 方針: ネームサーバーをCloudflareに変更する

**コスト**: 無料（Cloudflare Freeプランで可能）
**所要時間**: 設定10分 + DNS浸透 最大24時間

> 補足: ネームサーバーを変更せずにCNAMEで部分的にCloudflareを使う方法（Partial Setup）もあるが、
> Businessプラン（$200/月〜）が必要なため現実的でない。

---

## 手順

### Step 1: 現在のDNSレコードを記録する

さくらインターネットのDNS設定画面で、現在設定されている全DNSレコードを **スクリーンショットまたはテキストで保存** する。

記録すべき内容:
- Aレコード（さくらVPSのIPアドレス）
- CNAMEレコード
- TXTレコード（もしあれば）

> メールサービスは未使用のため、MXレコードの移行は不要。
> **この記録を怠ると、ウェブサイトが一時的にアクセス不能になるリスクがある。**

### Step 2: Cloudflareにドメインを追加する

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) にログイン
2. 「サイトを追加」をクリック
3. ドメイン名 `altee.me` を入力
4. **Freeプラン** を選択
5. Cloudflareが既存DNSレコードを自動スキャン → 検出されたレコードを確認
6. Step 1で記録したレコードと照合し、**不足しているレコードを手動追加**
   - 特にさくらVPSへのAレコード（`altee.me` → VPSのIPアドレス）を確認
7. Cloudflareが表示するネームサーバー2つをメモする（例: `xxx.ns.cloudflare.com`, `yyy.ns.cloudflare.com`）

### Step 3: Xserver Domain でネームサーバーを変更する

1. [Xserver Domain](https://www.xdomain.ne.jp/) にログイン
2. ドメイン管理 → 対象ドメインの「ネームサーバ設定」を開く
3. 「その他のサービスを利用する」にチェック
4. Cloudflareのネームサーバー2つを入力
5. 「確認」→「設定」で保存

### Step 4: Cloudflareでドメイン有効化を確認

1. Cloudflare Dashboardに戻る
2. 「ネームサーバをチェック」をクリック
3. 数分〜最大24時間でステータスが **「Active」** になる
4. 確認メールがCloudflareアカウントのメールアドレスに届く

> この時点でさくらインターネットのDNS設定は使われなくなり、
> Cloudflare側のDNSレコードが有効になる。
> さくらVPS自体は引き続き利用可能（DNSの向き先を変えただけで、サーバーは変わらない）。

### Step 5: R2バケットにカスタムドメインを接続

1. Cloudflare Dashboard → R2 → `altee-images` バケット
2. Settings → Custom Domains → 「Add」
3. `cdn.altee.me` を入力
4. DNSレコードの確認 → 「Connect Domain」
5. ステータスが「Initializing」→ **「Active」** になるのを確認

### Step 6: コード側の変更（環境変数のみ）

```bash
# .env.production（変更前）
NEXT_PUBLIC_STORAGE_URL=https://pub-3545e489531d41b58d69b4f9254ddb48.r2.dev

# .env.production（変更後）
NEXT_PUBLIC_STORAGE_URL=https://cdn.altee.me
```

コード変更は **一切不要**。
`getPublicUrl()`（`lib/image-uploader/get-public-url.ts`）が `NEXT_PUBLIC_STORAGE_URL` を参照しているため、環境変数だけで全画像のURLが切り替わる。

DBに保存されているのは `storageKey`（相対パス）であり、フルURLではないため **既存データのマイグレーションも不要**。

---

## 検証

1. Cloudflare Dashboardでカスタムドメインが「Active」であることを確認
2. ブラウザで `https://cdn.altee.me/user-icons/` 等にアクセスし、画像が表示されることを確認
3. `NEXT_PUBLIC_STORAGE_URL` を変更後、アプリをビルド・デプロイして全画像が正常に表示されることを確認

---

## 副次的メリット

- Cloudflareのプロキシ（オレンジ雲アイコン）を有効にすれば、さくらVPSのWebサイトにもCDN/WAF保護が適用される
- SSL証明書がCloudflareから自動発行される（R2カスタムドメイン含む）

## 参考リンク

- [Cloudflare R2 Public Buckets](https://developers.cloudflare.com/r2/buckets/public-buckets/)
- [Xserver Domain → Cloudflare ネームサーバー変更手順](https://kshida-blog.com/posts/set-my-domain-to-cloudflare-pages)
- [さくらインターネット → Cloudflare移行事例](https://www.sataku.jp/blogs/20240412_migrate_sakura_dns_to_cloudflare/)
