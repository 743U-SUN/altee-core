"use client"

import { useState, useMemo, useCallback } from "react"
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
import { Checkbox } from "@/components/ui/checkbox"
import { UserPagination } from "./UserPagination"
import dynamic from "next/dynamic"

// Dynamic import for BulkActionsBar - only loaded when users are selected
const BulkActionsBar = dynamic(() => import("./BulkActionsBar").then(mod => ({ default: mod.BulkActionsBar })), {
  loading: () => <div className="h-16 bg-blue-50 rounded-lg animate-pulse" />
})
import { UserRole } from "@prisma/client"
import Link from "next/link"

interface User {
  id: string
  name: string | null
  email: string
  role: UserRole
  isActive: boolean
  image: string | null
  createdAt: Date
  _count: {
    accounts: number
  }
}

interface UserListClientProps {
  users: User[]
  currentPage: number
  totalPages: number
  totalCount: number
  search?: string
  role?: UserRole
  isActive?: boolean
  createdFrom?: Date
  createdTo?: Date
}

export function UserListClient({
  users,
  currentPage,
  totalPages,
  totalCount,
  search,
  role,
  isActive,
  createdFrom,
  createdTo
}: UserListClientProps) {
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedUsers(new Set(users.map(user => user.id)))
    } else {
      setSelectedUsers(new Set())
    }
  }, [users])

  const handleSelectUser = useCallback((userId: string, checked: boolean) => {
    setSelectedUsers(prev => {
      const newSelected = new Set(prev)
      if (checked) {
        newSelected.add(userId)
      } else {
        newSelected.delete(userId)
      }
      return newSelected
    })
  }, [])

  const { isAllSelected, isIndeterminate, selectedUsersArray, filteredSelectedUsers } = useMemo(() => {
    const selectedArray = Array.from(selectedUsers)
    const filteredSelected = users.filter(user => selectedUsers.has(user.id))
    
    return {
      isAllSelected: users.length > 0 && selectedUsers.size === users.length,
      isIndeterminate: selectedUsers.size > 0 && selectedUsers.size < users.length,
      selectedUsersArray: selectedArray,
      filteredSelectedUsers: filteredSelected
    }
  }, [users, selectedUsers])

  if (users.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        登録されているユーザーがありません
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 一括操作バー */}
      {selectedUsers.size > 0 && (
        <BulkActionsBar
          selectedUserIds={selectedUsersArray}
          selectedUsers={filteredSelectedUsers}
          onComplete={() => setSelectedUsers(new Set())}
        />
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox
                checked={isIndeterminate ? "indeterminate" : isAllSelected}
                onCheckedChange={handleSelectAll}
                aria-label="すべてのユーザーを選択"
              />
            </TableHead>
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
              <TableCell>
                <Checkbox
                  checked={selectedUsers.has(user.id)}
                  onCheckedChange={(checked) => handleSelectUser(user.id, checked === true)}
                  aria-label={`${user.name || user.email}を選択`}
                />
              </TableCell>
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
}