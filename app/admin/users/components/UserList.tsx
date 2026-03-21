import { getUserList } from "@/app/actions/admin/user-management"
import { resolveAvatarUrl } from "@/lib/avatar-utils"
import { UserListClient } from "./UserListClient"
import { UserRole } from "@prisma/client"

interface UserListProps {
  currentPage: number
  search?: string
  role?: UserRole
  isActive?: boolean
  createdFrom?: string
  createdTo?: string
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
    
    const { users: rawUsers, totalCount, totalPages } = await getUserList(
      filters,
      { page: currentPage, limit: 20 }
    )

    const users = rawUsers.map(u => ({
      ...u,
      // CharacterInfo の表示名・アイコンを展開してクライアントに渡す
      characterName: u.characterInfo?.characterName ?? null,
      iconImageUrl: resolveAvatarUrl(u.characterInfo?.iconImageKey, u.image),
      accountType: u.accountType,
      createdAt: u.createdAt.toISOString(),
    }))

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
  } catch {
    return (
      <div className="text-center py-8 text-red-500">
        ユーザー一覧の読み込みに失敗しました
      </div>
    )
  }
}