import { DefaultSession } from "next-auth"
import { UserRole } from "@prisma/client"

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