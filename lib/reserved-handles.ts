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
  
  // 機能系
  'settings',
  'help',
  'about',
  'contact',
  'support',
  'blog',
  'news',
  'faq',
  'links',
  
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