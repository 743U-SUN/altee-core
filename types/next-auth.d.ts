import { DefaultSession } from "next-auth"
import { UserRole } from "@prisma/client"

// @auth/core の AdapterUser 型を拡張（PrismaAdapter との互換性のため）
declare module "@auth/core/adapters" {
  interface AdapterUser {
    role: UserRole
    isActive: boolean
  }
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: UserRole
      isActive: boolean
      handle?: string | null
      characterName?: string | null
      profileImages: {
        google?: string | null
        discord?: string | null
        preferred?: string | null
        custom?: string | null
      }
    } & DefaultSession["user"]
  }

  interface User {
    role: UserRole
    isActive: boolean
    handle?: string | null
    characterName?: string | null
    profileImages?: {
      google?: string | null
      discord?: string | null
      preferred?: string | null
      custom?: string | null
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole
    isActive: boolean
    handle?: string | null
    characterName?: string | null
  }
}