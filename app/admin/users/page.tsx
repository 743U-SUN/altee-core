import { Suspense } from "react"
import { UserList } from "./components/UserList"
import { UserSearch } from "./components/UserSearch"
import { CsvExportButton } from "./components/CsvExportButton"
import dynamic from "next/dynamic"

// Dynamic import for UserFilters to reduce initial bundle size
const UserFilters = dynamic(() => import("./components/UserFilters").then(mod => ({ default: mod.UserFilters })), {
  loading: () => <div className="h-10 w-20 bg-gray-200 rounded-md animate-pulse" />
})
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UserRole } from "@prisma/client"

interface UsersPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const params = await searchParams
  const currentPage = Number(params.page) || 1
  const search = typeof params.search === "string" ? params.search : ""
  const role = typeof params.role === "string" && ["ADMIN", "USER", "GUEST"].includes(params.role) 
    ? params.role as UserRole 
    : undefined
  const isActive = params.isActive === "true" ? true : params.isActive === "false" ? false : undefined
  const createdFrom = typeof params.createdFrom === "string" ? new Date(params.createdFrom) : undefined
  const createdTo = typeof params.createdTo === "string" ? new Date(params.createdTo) : undefined

  return (
    <div className="container mx-auto p-6 flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">ユーザー管理</h1>
      </div>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>登録ユーザー一覧</CardTitle>
          <div className="flex gap-2">
            <CsvExportButton
              search={search}
              role={role}
              isActive={isActive}
              createdFrom={createdFrom}
              createdTo={createdTo}
            />
            <UserSearch />
            <UserFilters />
          </div>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="text-center py-8">読み込み中...</div>}>
            <UserList 
              currentPage={currentPage} 
              search={search}
              role={role}
              isActive={isActive}
              createdFrom={createdFrom}
              createdTo={createdTo}
            />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}