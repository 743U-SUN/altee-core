/**
 * Handle予約語管理システム
 * システムで使用されるパスと重複しないように予約語を定義
 */

export const RESERVED_HANDLES = [
  // システム基盤
  'admin',
  'api',
  'auth',
  'dashboard',
  'user',
  'profile',
  'u',          // VTuber一覧ページ
  'g',          // グループ関連ページ
  '_next',      // Next.js内部ルート
  'serwist',    // PWA service worker route
  'sw',         // Service worker

  // 機能系
  'demo',       // デモ・テストページ
  'settings',
  'help',
  'about',
  'contact',
  'support',
  'blog',
  'news',
  'faq',
  'links',
  'posts',      // お知らせ統合ページ
  'articles',   // 管理者記事
  'lib',        // ライブラリ（リンク集、フォント、オーディション）
  'pc-builder', // PCビルダー
  'items',      // アイテムカタログ
  'tools',      // ツールページ（PC構成シミュレーター等）

  // 法的ページ
  'terms',
  'privacy',
  'legal',

  // その他の一般的な予約語
  'www',
  'mail',
  'email',
  'root',
  'system',
  'config',
  'public',
  'static',
  'assets',
  'images',
  'files',
  'uploads',
  'download',
  'downloads',

  // HTTP関連
  'get',
  'post',
  'put',
  'delete',
  'patch',
  'head',
  'options',

  // 将来の拡張用
  'shop',
  'store',
  'cart',
  'checkout',
  'search',
  'feed',
  'rss',
  'sitemap',
] as const;

/**
 * 指定されたhandleが予約語かどうかをチェック
 * @param handle チェックするhandle
 * @returns 予約語の場合true、そうでなければfalse
 */
export function isReservedHandle(handle: string): boolean {
  if (!handle || typeof handle !== 'string') {
    return true;
  }

  const lowerHandle = handle.toLowerCase();
  return (RESERVED_HANDLES as readonly string[]).includes(lowerHandle);
}

/**
 * 予約語の一覧を取得（開発・デバッグ用）
 * @returns 予約語の配列
 */
export function getReservedHandles(): readonly string[] {
  return RESERVED_HANDLES;
}