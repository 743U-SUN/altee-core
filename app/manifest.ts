import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Altee Core - モバイルアプリ',
    short_name: 'Altee',
    description: 'VTuber・配信者向けプロフィールサービス',
    start_url: '/',
    display: 'standalone', // ブラウザUI完全非表示
    background_color: '#0f172a', // ダークモード基調
    theme_color: '#1e293b',
    orientation: 'portrait-primary',
    categories: ['productivity', 'utilities'],
    lang: 'ja',
    scope: '/',
    icons: [
      {
        src: '/pwa/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: '/pwa/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png'
      }
    ]
  }
}