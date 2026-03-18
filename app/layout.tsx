import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter, Noto_Sans_JP, M_PLUS_Rounded_1c, Zen_Maru_Gothic } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { SerwistRegister } from "@/components/pwa/SerwistRegister";
import { NuqsAdapter } from 'nuqs/adapters/next/app';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ユーザープロフィール用フォント（next/fontでビルド時にセルフホスト）
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  display: "swap",
});

const mPlusRounded = M_PLUS_Rounded_1c({
  variable: "--font-m-plus-rounded",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const zenMaru = Zen_Maru_Gothic({
  variable: "--font-zen-maru",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: '#1e293b',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "Altee Core",
  description: "Modern web application with Next.js and shadcn/ui",
  manifest: '/manifest.json', // Next.jsが自動的にmanifest.tsを変換
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Altee Core',
  },
  icons: {
    icon: '/pwa/icon-192x192.png',
    apple: '/pwa/icon-192x192.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${notoSansJP.variable} ${mPlusRounded.variable} ${zenMaru.variable} antialiased`}
      >
        <NuqsAdapter>
          <SerwistRegister>
            <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              enableSystem
              disableTransitionOnChange
            >
              {children}
              <Toaster />
            </ThemeProvider>
          </SerwistRegister>
        </NuqsAdapter>
      </body>
    </html>
  );
}
