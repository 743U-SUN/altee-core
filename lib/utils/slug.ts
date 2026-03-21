/**
 * スラッグ生成ユーティリティ
 * 日本語・英数字を含む文字列からURLフレンドリーなスラッグを生成する
 */

/**
 * 文字列からスラッグを生成
 * - 英小文字・数字・日本語（ひらがな・カタカナ・漢字）はそのまま保持
 * - それ以外の文字はハイフンに変換
 * - 連続するハイフンは1つに圧縮
 * - 先頭・末尾のハイフンを除去
 *
 * @param input 変換元の文字列
 * @param maxLength 最大文字数（デフォルト: 100）
 */
export function generateSlug(input: string, maxLength: number = 100): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, maxLength)
}
