import { BaseLayout } from "@/components/layout/BaseLayout"

export default async function HandleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ handle: string }>
}) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { handle } = await params
  const secondSidebarContent = (
    <div className="relative h-full w-full overflow-hidden">
      {/* 背景画像 */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('https://picsum.photos/800/600?random=1')"
        }}
      >
        {/* オーバーレイ */}
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* コンテンツレイヤー */}
      <div className="relative z-10 h-full flex flex-col">
        {/* 左上の横長バナー */}
        <div className="p-6 pt-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg lg:max-w-xs md:max-w-52 max-w-40">
            <img 
              src="https://via.placeholder.com/210x70/4f46e5/ffffff?text=User+Banner" 
              alt="User Banner" 
              className="w-full h-auto rounded"
              style={{ aspectRatio: '3/1' }}
            />
          </div>
        </div>

        {/* メインコンテンツエリア */}
        <div className="flex flex-1 relative">
          {/* 左サイドのリンクアイコン */}
          <div className="absolute left-6 top-1/2 transform -translate-y-1/2 flex flex-col lg:gap-3 md:gap-2 gap-3 z-20">
            <a 
              href="#" 
              className="bg-white/70 backdrop-blur-sm lg:p-4 md:p-3 p-2 rounded-full shadow-lg hover:bg-white/90 transition-colors"
              title="Twitter"
            >
              <svg className="lg:w-7 lg:h-7 md:w-6 md:h-6 w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
              </svg>
            </a>
            <a 
              href="#" 
              className="bg-white/70 backdrop-blur-sm lg:p-4 md:p-3 p-2 rounded-full shadow-lg hover:bg-white/90 transition-colors"
              title="Instagram"
            >
              <svg className="lg:w-7 lg:h-7 md:w-6 md:h-6 w-5 h-5 text-pink-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.618 5.367 11.986 11.988 11.986s11.987-5.368 11.987-11.986C24.004 5.367 18.635.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.33-1.291C4.239 14.81 3.73 13.549 3.73 12.017c0-1.532.509-2.793 1.389-3.68.882-.801 2.033-1.291 3.33-1.291 1.297 0 2.448.49 3.329 1.291.881.887 1.39 2.148 1.39 3.68 0 1.532-.509 2.793-1.39 3.68-.881.801-2.032 1.291-3.329 1.291z"/>
              </svg>
            </a>
            <a 
              href="#" 
              className="bg-white/70 backdrop-blur-sm lg:p-4 md:p-3 p-2 rounded-full shadow-lg hover:bg-white/90 transition-colors"
              title="YouTube"
            >
              <svg className="lg:w-7 lg:h-7 md:w-6 md:h-6 w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
            <a 
              href="#" 
              className="bg-white/70 backdrop-blur-sm lg:p-4 md:p-3 p-2 rounded-full shadow-lg hover:bg-white/90 transition-colors"
              title="Discord"
            >
              <svg className="lg:w-7 lg:h-7 md:w-6 md:h-6 w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
            </a>
            <a 
              href="#" 
              className="bg-white/70 backdrop-blur-sm lg:p-4 md:p-3 p-2 rounded-full shadow-lg hover:bg-white/90 transition-colors"
              title="Website"
            >
              <svg className="lg:w-7 lg:h-7 md:w-6 md:h-6 w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/>
              </svg>
            </a>
          </div>

          {/* キャラクター画像エリア */}
          <div className="flex-1 flex justify-center items-end">
            <div className="bg-white/95 backdrop-blur-sm rounded-t-lg p-3 shadow-xl">
              <img 
                src="https://via.placeholder.com/432x768/8b5cf6/ffffff?text=Character" 
                alt="Character" 
                className="w-auto max-h-[48rem] h-[calc(100vh-16rem)] object-cover rounded"
                style={{ aspectRatio: '9/16' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <BaseLayout 
      variant="user-profile"
      overrides={{
        secondSidebar: {
          content: secondSidebarContent
        }
      }}
    >
      {children}
    </BaseLayout>
  )
}