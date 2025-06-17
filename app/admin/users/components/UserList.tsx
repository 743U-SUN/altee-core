import { getUserList } from "@/app/actions/user-management"
import { UserListClient } from "./UserListClient"
import { UserRole } from "@prisma/client"

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

    return (
      <UserListClient
        users={users}
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        search={search}
        role={role}
        isActive={isActive}
        createdFrom={createdFrom}
        createdTo={createdTo}
      />
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