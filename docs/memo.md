ユーザー個別ページは、CSS変数の動的変更が一番シンプルです。

  // ユーザーカラー適用関数（これだけ）
  export function applyUserColors(colors: { primary: string, accent: string }) {
    const root = document.documentElement
    root.style.setProperty('--primary', colors.primary)
    root.style.setProperty('--accent', colors.accent)
  }

  // 使用方法
  applyUserColors({
    primary: '24 100% 50%',  // オレンジ
    accent: '24 80% 60%'
  })

  🔄 動作の仕組み

  1. ライト/ダークモード: next-themesがそのまま動作
  2. ユーザーカラー: 上記の関数で色だけ上書き

  💡 なぜこれがシンプルか

  - ✅ 新しいCSSクラス不要
  - ✅ next-themesの設定変更不要
  - ✅ 既存のshadcn/uiがそのまま動作
  - ✅ ライト/ダークと独立して管理

  実装例

  // app/users/[userId]/layout.tsx
  useEffect(() => {
    const userTheme = getUserTheme() // DBから取得

    applyUserColors({
      primary: userTheme.primaryColor,
      accent: userTheme.accentColor
    })
  }, [])

  これだけで、ライト/ダーク + ユーザーカラーの両方が動きます！