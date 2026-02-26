# Phase 6: 残りテーマ作成 - 詳細計画

> **親計画**: [2026-platform-overhaul.md](./2026-platform-overhaul.md)
> **作成日**: 2026-02-26
> **ステータス**: **スキップ**
> **依存関係**: Phase 5（ダッシュボード）完了後

---

## 決定事項

**Phase 6はスキップします。**

### 理由

1. **現在の9テーマで十分**: Claymorphic (3), Minimal (3), Pastel Dream (3) で幅広いユースケースをカバー
2. **動的テーマ取得済み**: Phase 5でThemePresetSelectorが動的取得に対応済み。後からテーマ追加が容易
3. **YAGNI原則**: 必要になるまで作らない。ユーザーフィードバックを得てから追加テーマを検討
4. **リスク軽減**: 全体計画のリスク管理に記載の「最小10種で開始」方針に合致

---

## 現在のテーマ一覧（9種類）

| ファミリー | バリエーション | テーマID | ベース |
|------------|----------------|----------|--------|
| **Claymorphic** | Warm（デフォルト） | `claymorphic-warm` | neumorphic |
| | Cool | `claymorphic-cool` | neumorphic |
| | Dark | `claymorphic-dark` | neumorphic |
| **Minimal** | White | `minimal-white` | flat |
| | Gray | `minimal-gray` | flat |
| | Black | `minimal-black` | flat |
| **Pastel Dream** | Pink | `pastel-dream-pink` | flat |
| | Mint | `pastel-dream-mint` | flat |
| | Blue | `pastel-dream-blue` | flat |

### テーマの特徴

- **Claymorphic**: ニューモーフィズム風の柔らかい立体感。VTuber・配信者向けに最適
- **Minimal**: シンプルでプロフェッショナル。ビジネス用途にも対応
- **Pastel Dream**: かわいいパステルカラー。女性配信者に人気が予想される

---

## 将来のテーマ追加ガイド

Phase 6をスキップしても、後からテーマを追加する手順は以下の通りです。

### テーマ追加手順

#### ステップ 1: プリセットファイルを作成

`lib/themes/presets/new-theme.ts` を作成:

```typescript
import type { ThemePreset, ThemeColorPalette, ThemeDecorations } from '../types'

// 装飾設定
const newThemeDecorations: ThemeDecorations = {
  badge: 'pill',
  divider: 'line',
  iconContainer: 'circle',
  cardHover: 'lift',
  cornerDecor: 'none',
}

// カラーパレット
const variant1Palette: ThemeColorPalette = {
  name: 'variant1',
  displayName: 'バリエーション1',
  primary: '#000000',
  secondary: '#000000',
  accent: '#000000',
  background: '#ffffff',
  cardBackground: '#ffffff',
  text: {
    primary: '#000000',
    secondary: '#666666',
    accent: '#000000',
  }
}

// CSS変数生成
function generateVariables(palette: ThemeColorPalette): Record<string, string> {
  return {
    '--theme-bg': palette.background,
    '--theme-card-bg': palette.cardBackground,
    '--theme-card-shadow': '0 2px 8px rgba(0, 0, 0, 0.1)',
    '--theme-card-border': 'none',
    '--theme-card-radius': '12px',
    '--theme-text-primary': palette.text.primary,
    '--theme-text-secondary': palette.text.secondary,
    '--theme-text-accent': palette.text.accent,
    '--theme-accent-bg': `${palette.accent}15`,
    '--theme-accent-border': `${palette.accent}30`,
    '--theme-stat-bg': palette.cardBackground,
    '--theme-stat-border': 'none',
    '--theme-stat-shadow': '0 2px 4px rgba(0, 0, 0, 0.05)',
    '--theme-bar-bg': `${palette.secondary}30`,
    '--theme-image-bg': `linear-gradient(135deg, ${palette.primary}10, ${palette.secondary}10)`,
    '--theme-header-bg': palette.primary,
    '--theme-header-text': '#ffffff',
    '--theme-header-shadow': '0 2px 4px rgba(0, 0, 0, 0.1)',
  }
}

// テーマプリセット
export const newThemeVariant1: ThemePreset = {
  id: 'new-theme-variant1',
  name: 'New Theme',
  colorVariant: 'variant1',
  displayName: 'New Theme - バリエーション1',
  description: 'テーマの説明',
  base: 'flat',
  palette: variant1Palette,
  decorations: newThemeDecorations,
  variables: generateVariables(variant1Palette),
}

export const newThemeThemes: ThemePreset[] = [newThemeVariant1]
```

#### ステップ 2: エクスポートに追加

`lib/themes/presets/index.ts`:
```typescript
export { newThemeVariant1, newThemeThemes } from './new-theme'
```

#### ステップ 3: レジストリに登録

`lib/themes/registry.ts`:
```typescript
import { newThemeThemes } from './presets'
registerThemes(newThemeThemes)
```

#### ステップ 4: メインエクスポートに追加

`lib/themes/index.ts`:
```typescript
export { newThemeVariant1, newThemeThemes } from './presets'
```

### UIへの反映

ThemePresetSelectorは`getThemesGroupedByName()`で動的に取得するため、**UIコードの変更は不要**です。

---

## 将来追加候補のテーマ

ユーザーフィードバックを得た後、以下のテーマを検討:

| ファミリー | ベース | カラー展開 | ターゲット |
|------------|--------|-----------|------------|
| **Cyberpunk** | glass | Neon, Matrix, Synthwave | ゲーマー、SF好き |
| **Gaming** | neumorphic | RGB, Fire, Ice | ゲーム配信者 |
| **Kawaii** | flat | Candy, Fairy, Dream | かわいい系配信者 |
| **Elegant** | neumorphic | Gold, Silver, Rose | 高級感を求めるユーザー |
| **Nature** | card | Forest, Ocean, Sunset | 落ち着いた雰囲気希望 |
| **Retro** | card | 80s, 90s, Pixel | レトロゲーム配信者 |
| **Pop Art** | flat | Primary, Neon, Mono | アート系配信者 |

### Glass効果（Cyberpunk等）の実装メモ

backdrop-filterは現在ほぼ全てのモダンブラウザで対応済み:
- Safari 9+ (2015年〜)
- Chrome 76+ (2019年〜)
- Firefox 103+ (2022年〜)
- Edge 79+ (2020年〜)

フォールバック不要で実装可能。

---

## Phase 7への影響

Phase 6をスキップすることで、Phase 7は以下のように調整:

### 元のPhase 7タスク

| ID | タスク | 状態 |
|----|--------|------|
| 7.1 | レスポンシブ調整 | 継続 |
| 7.2a | next/image sizes最適化 | 継続 |
| 7.2b | セクション遅延読み込み検証 | 継続 |
| 7.2c | テーマ計算の最適化 | 継続 |
| 7.3 | デモページ作成 | **調整**: `/demo/themes`は9テーマで実装 |
| 7.4 | ドキュメント | **追加**: テーマ追加ガイドを含める |

### 追加タスク

- テーマ追加手順のドキュメント化（本計画書をベースに）
- ユーザーからのテーマリクエスト収集の仕組み検討

---

## 検証チェックリスト

### Phase 6スキップ確認

- [x] 現在9テーマが正常に動作
- [x] ThemePresetSelectorで9テーマが表示される
- [x] 全9テーマの選択・適用が正常
- [x] プレビュー機能が全テーマで動作
- [ ] テーマ追加手順がドキュメント化されている（Phase 7で実施）

---

## まとめ

| 項目 | 決定 |
|------|------|
| Phase 6 | **スキップ** |
| 現在のテーマ数 | 9種類 |
| 将来の追加 | ユーザーフィードバック後に検討 |
| 追加方法 | 動的取得により容易（UIコード変更不要） |

---

**最終更新**: 2026-02-26
