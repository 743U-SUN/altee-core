import { getUserList } from "@/app/actions/user-management"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserPagination } from "./UserPagination"
import { UserRole } from "@prisma/client"
import Link from "next/link"

interface UserListProps {
  currentPage: number
  search?: string
  role?: UserRole
  isActive?: boolean
  createdFrom?: Date
  createdTo?: Date
}

export async function UserList({ 
  currentPage, 
  search, 
  role, 
  isActive, 
  createdFrom, 
  createdTo 
}: UserListProps) {
  try {
    const filters = {
      ...(search && { search }),
      ...(role && { role }),
      ...(isActive !== undefined && { isActive }),
      ...(createdFrom && { createdFrom }),
      ...(createdTo && { createdTo }),
    }
    
    const { users, totalCount, totalPages } = await getUserList(
      filters,
      { page: currentPage, limit: 20 }
    )

    if (users.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          登録されているユーザーがありません
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ユーザー</TableHead>
              <TableHead>メールアドレス</TableHead>
              <TableHead>ロール</TableHead>
              <TableHead>状態</TableHead>
              <TableHead>アカウント連携</TableHead>
              <TableHead>登録日</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.image || undefined} alt={user.name || "User"} />
                    <AvatarFallback>
                      {user.name ? user.name.slice(0, 2).toUpperCase() : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{user.name || "名前未設定"}</div>
                    <div className="text-sm text-muted-foreground">ID: {user.id}</div>
                  </div>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant={user.role === "ADMIN" ? "destructive" : user.role === "USER" ? "default" : "secondary"}>
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={user.isActive ? "default" : "secondary"}>
                    {user.isActive ? "アクティブ" : "非アクティブ"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {user._count.accounts > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {user._count.accounts}個のアカウント
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  {new Date(user.createdAt).toLocaleDateString("ja-JP")}
                </TableCell>
                <TableCell>
                  <Link 
                    href={`/admin/users/${user.id}`}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    詳細
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        <UserPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          baseUrl="/admin/users"
          search={search}
          role={role}
          isActive={isActive?.toString()}
          createdFrom={createdFrom?.toISOString().split('T')[0]}
          createdTo={createdTo?.toISOString().split('T')[0]}
        />
      </div>
    )
  } catch (error) {
    console.error("UserList error:", error)
    return (
      <div className="text-center py-8 text-red-500">
        ユーザー一覧の読み込みに失敗しました
      </div>
    )
  }
}