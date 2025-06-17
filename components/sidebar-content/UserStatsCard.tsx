import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users } from "lucide-react"
import { AdminStats } from "@/app/actions/admin-stats"

interface UserStatsCardProps {
  stats: AdminStats
}

export function UserStatsCard({ stats }: UserStatsCardProps) {

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Users className="size-4" />
          ユーザー統計
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* 基本統計 */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">総ユーザー数</span>
          <span className="text-sm font-medium">{stats.totalUsers.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">アクティブ</span>
          <span className="text-sm font-medium">{stats.activeUsers.toLocaleString()}</span>
        </div>
        
        {/* 新規登録数 */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">新規（今日）</span>
          <span className="text-sm font-medium">{stats.newUsersToday}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">新規（今週）</span>
          <span className="text-sm font-medium">{stats.newUsersThisWeek}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">新規（今月）</span>
          <span className="text-sm font-medium">{stats.newUsersThisMonth}</span>
        </div>
        
        {/* ロール別統計 */}
        <div className="pt-2 border-t">
          <div className="text-xs text-muted-foreground mb-2">ロール別</div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">管理者</span>
              <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                {stats.usersByRole.ADMIN}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">ユーザー</span>
              <Badge variant="default" className="text-xs px-1.5 py-0.5">
                {stats.usersByRole.USER}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">ゲスト</span>
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                {stats.usersByRole.GUEST}
              </Badge>
            </div>
          </div>
        </div>
        
        {/* OAuth連携統計 */}
        <div className="pt-2 border-t">
          <div className="text-xs text-muted-foreground mb-2">OAuth連携</div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Google</span>
              <span className="text-xs font-medium">{stats.oauthConnections.google}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Discord</span>
              <span className="text-xs font-medium">{stats.oauthConnections.discord}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">連携済み</span>
              <span className="text-xs font-medium">
                {stats.oauthConnections.totalConnected}/{stats.oauthConnections.totalUsers}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}