ユーザー個別ページは、 テーマオーバーライド方式でカスタムカラーを選べるようにする。

  // app/users/[userId]/layout.tsx
  const userThemes = {
    black: { iconBgColor: "bg-gray-900", headerBg: "bg-gray-800" },
    white: { iconBgColor: "bg-gray-100", headerBg: "bg-white" },
    orange: { iconBgColor: "bg-orange-500", headerBg: "bg-orange-50" },
    // ...
  }

  export default function UserLayout({ children }) {
    const userTheme = getUserTheme() // DBから取得

    return (
      <BaseLayout 
        variant="user-profile"
        overrides={{
          firstSidebar: {
            brand: {
              ...defaultBrand,
              iconBgColor: userThemes[userTheme].iconBgColor
            }
          }
        }}
      >
        {children}
      </BaseLayout>
    )
  }