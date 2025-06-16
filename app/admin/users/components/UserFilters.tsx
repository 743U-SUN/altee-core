"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { Filter, X, CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"

export function UserFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [role, setRole] = useState(searchParams.get("role") || "all")
  const [isActive, setIsActive] = useState(searchParams.get("isActive") || "all")
  const [createdFrom, setCreatedFrom] = useState<Date | undefined>(
    searchParams.get("createdFrom") ? new Date(searchParams.get("createdFrom")!) : undefined
  )
  const [createdTo, setCreatedTo] = useState<Date | undefined>(
    searchParams.get("createdTo") ? new Date(searchParams.get("createdTo")!) : undefined
  )

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams)
    
    // フィルターを適用
    if (role && role !== "all") {
      params.set("role", role)
    } else {
      params.delete("role")
    }
    
    if (isActive && isActive !== "all") {
      params.set("isActive", isActive)
    } else {
      params.delete("isActive")
    }
    
    if (createdFrom) {
      params.set("createdFrom", createdFrom.toISOString().split('T')[0])
    } else {
      params.delete("createdFrom")
    }
    
    if (createdTo) {
      params.set("createdTo", createdTo.toISOString().split('T')[0])
    } else {
      params.delete("createdTo")
    }
    
    // フィルター適用時はページを1に戻す
    params.delete("page")
    
    router.push(`/admin/users?${params.toString()}`)
  }

  const clearFilters = () => {
    setRole("all")
    setIsActive("all")
    setCreatedFrom(undefined)
    setCreatedTo(undefined)
    
    const params = new URLSearchParams(searchParams)
    params.delete("role")
    params.delete("isActive")
    params.delete("createdFrom")
    params.delete("createdTo")
    params.delete("page")
    
    router.push(`/admin/users?${params.toString()}`)
  }

  const hasActiveFilters = (role && role !== "all") || (isActive && isActive !== "all") || createdFrom || createdTo

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="relative">
          <Filter className="h-4 w-4 mr-2" />
          フィルター
          {hasActiveFilters && (
            <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
              •
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">フィルター条件</h4>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                クリア
              </Button>
            )}
          </div>
          
          {/* ロールフィルター */}
          <div className="space-y-2">
            <Label htmlFor="role-filter">ロール</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger id="role-filter">
                <SelectValue placeholder="すべてのロール" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべてのロール</SelectItem>
                <SelectItem value="ADMIN">管理者</SelectItem>
                <SelectItem value="USER">ユーザー</SelectItem>
                <SelectItem value="GUEST">ゲスト</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* 状態フィルター */}
          <div className="space-y-2">
            <Label htmlFor="status-filter">状態</Label>
            <Select value={isActive} onValueChange={setIsActive}>
              <SelectTrigger id="status-filter">
                <SelectValue placeholder="すべての状態" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべての状態</SelectItem>
                <SelectItem value="true">アクティブ</SelectItem>
                <SelectItem value="false">非アクティブ</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* 登録日フィルター */}
          <div className="space-y-2">
            <Label>登録日</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">開始日</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {createdFrom ? format(createdFrom, "yyyy/MM/dd", { locale: ja }) : "選択"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" side="top">
                    <Calendar
                      mode="single"
                      selected={createdFrom}
                      onSelect={setCreatedFrom}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">終了日</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {createdTo ? format(createdTo, "yyyy/MM/dd", { locale: ja }) : "選択"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" side="top">
                    <Calendar
                      mode="single"
                      selected={createdTo}
                      onSelect={setCreatedTo}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 pt-2">
            <Button onClick={applyFilters} className="flex-1">
              適用
            </Button>
            <Button variant="outline" onClick={clearFilters}>
              リセット
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}