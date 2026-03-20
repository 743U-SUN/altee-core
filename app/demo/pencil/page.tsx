import {
  Zap,
  LayoutDashboard,
  Activity,
  Receipt,
  BarChart3,
  Settings,
  Headphones,
  ChevronsUpDown,
  Download,
  TrendingUp,
  TrendingDown,
  Droplets,
  Flame,
  Wallet,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const navItems = [
  { label: 'Overview', icon: LayoutDashboard, active: true },
  { label: 'Usage', icon: Activity, active: false },
  { label: 'Billing', icon: Receipt, active: false },
  { label: 'Reports', icon: BarChart3, active: false },
]

const accountItems = [
  { label: 'Settings', icon: Settings },
  { label: 'Support', icon: Headphones },
]

const statCards = [
  {
    label: 'Electricity',
    value: '842 kWh',
    icon: Zap,
    change: '+5.2%',
    trend: 'up' as const,
    positive: false,
  },
  {
    label: 'Water',
    value: '12.4 m³',
    icon: Droplets,
    change: '-2.1%',
    trend: 'down' as const,
    positive: true,
  },
  {
    label: 'Gas',
    value: '38.7 m³',
    icon: Flame,
    change: '+12.8%',
    trend: 'up' as const,
    positive: false,
  },
  {
    label: 'Current Bill',
    value: '$247.50',
    icon: Wallet,
    change: '+8.3%',
    trend: 'up' as const,
    positive: false,
  },
]

const usageHistory = [
  { date: 'Feb 27, 2026', type: 'Electricity', icon: Zap, usage: '28.4 kWh', cost: '$8.52', status: 'Normal' as const },
  { date: 'Feb 26, 2026', type: 'Water', icon: Droplets, usage: '0.42 m³', cost: '$3.15', status: 'Normal' as const },
  { date: 'Feb 25, 2026', type: 'Gas', icon: Flame, usage: '2.1 m³', cost: '$4.62', status: 'Normal' as const },
  { date: 'Feb 24, 2026', type: 'Electricity', icon: Zap, usage: '45.2 kWh', cost: '$13.56', status: 'High' as const },
  { date: 'Feb 23, 2026', type: 'Water', icon: Droplets, usage: '0.38 m³', cost: '$2.85', status: 'Normal' as const },
  { date: 'Feb 22, 2026', type: 'Gas', icon: Flame, usage: '1.8 m³', cost: '$3.96', status: 'Normal' as const },
]

export default function PencilDemoPage() {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="flex w-64 shrink-0 flex-col gap-4 border-r bg-sidebar p-2">
        {/* Brand Header */}
        <div className="flex items-center justify-between rounded-md p-2">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
              <Zap className="size-4 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-sidebar-foreground">UtilityPro</p>
              <p className="text-xs text-muted-foreground">Energy Dashboard</p>
            </div>
          </div>
          <ChevronsUpDown className="size-4 text-muted-foreground" />
        </div>

        {/* Main Nav */}
        <nav className="flex flex-1 flex-col gap-0.5">
          <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Main</p>
          {navItems.map((item) => (
            <a
              key={item.label}
              href="#"
              className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm ${
                item.active
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
              }`}
            >
              <item.icon className="size-4" />
              {item.label}
            </a>
          ))}

          <p className="mt-4 px-2 py-1.5 text-xs font-medium text-muted-foreground">Account</p>
          {accountItems.map((item) => (
            <a
              key={item.label}
              href="#"
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground hover:bg-sidebar-accent/50"
            >
              <item.icon className="size-4" />
              {item.label}
            </a>
          ))}
        </nav>

        {/* User Footer */}
        <div className="flex items-center justify-between rounded-md p-2">
          <div className="flex items-center gap-2">
            <Avatar className="size-8">
              <AvatarFallback className="bg-primary text-xs text-primary-foreground">SJ</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-sidebar-foreground">Sarah Johnson</p>
              <p className="text-xs text-muted-foreground">sarah@example.com</p>
            </div>
          </div>
          <ChevronsUpDown className="size-4 text-muted-foreground" />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex flex-1 flex-col gap-6 overflow-y-auto p-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
            <p className="text-sm text-muted-foreground">Monitor your utility usage and billing</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Feb 2026</span>
            <Button variant="outline" size="sm">
              <Download className="mr-2 size-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-4 gap-4">
          {statCards.map((card) => (
            <Card key={card.label} className="py-5">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.label}
                </CardTitle>
                <card.icon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="space-y-1">
                <p className="text-2xl font-bold">{card.value}</p>
                <div className="flex items-center gap-1">
                  {card.trend === 'up' ? (
                    <TrendingUp className={`size-3.5 ${card.positive ? 'text-green-600' : 'text-red-600'}`} />
                  ) : (
                    <TrendingDown className={`size-3.5 ${card.positive ? 'text-green-600' : 'text-red-600'}`} />
                  )}
                  <span className="text-xs text-muted-foreground">
                    {card.change} from last month
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Usage History */}
        <div className="flex flex-1 flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Usage History</h2>
            <Badge>Last 30 days</Badge>
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="px-3">Date</TableHead>
                  <TableHead className="px-3">Type</TableHead>
                  <TableHead className="px-3">Usage</TableHead>
                  <TableHead className="px-3">Cost</TableHead>
                  <TableHead className="px-3">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usageHistory.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell className="px-3">{row.date}</TableCell>
                    <TableCell className="px-3">
                      <div className="flex items-center gap-1.5">
                        <row.icon className="size-3.5 text-muted-foreground" />
                        {row.type}
                      </div>
                    </TableCell>
                    <TableCell className="px-3">{row.usage}</TableCell>
                    <TableCell className="px-3">{row.cost}</TableCell>
                    <TableCell className="px-3">
                      <Badge variant={row.status === 'High' ? 'destructive' : 'default'}>
                        {row.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Table Footer */}
            <div className="flex items-center justify-between border-t px-3 py-3">
              <p className="text-sm text-muted-foreground">Showing 6 of 30 records</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">Previous</Button>
                <Button variant="outline" size="sm">Next</Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
