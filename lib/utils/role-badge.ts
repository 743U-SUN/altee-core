import { UserRole } from '@prisma/client'

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline'

export function getRoleBadgeVariant(role: UserRole): BadgeVariant {
  switch (role) {
    case 'ADMIN':
      return 'destructive'
    case 'USER':
      return 'default'
    default:
      return 'secondary'
  }
}
