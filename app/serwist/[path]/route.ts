/**
 * Serwist Route Handler for Turbopack
 * Service Worker のルーティングを処理
 */

import { createSerwistRoute } from "@serwist/turbopack";

// ルートハンドラーとメタデータをエクスポート
export const {
  dynamic,
  dynamicParams,
  revalidate,
  generateStaticParams,
  GET,
} = createSerwistRoute({
  swSrc: "app/sw.ts",
  additionalPrecacheEntries: [],
});
