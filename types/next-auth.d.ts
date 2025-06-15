import { DefaultSession, DefaultUser } from "next-auth"
import { JWT, DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: 'USER' | 'ADMIN'
      isActive: boolean
      profileImages: {
        google?: string | null
        discord?: string | null
        preferred?: string | null
        custom?: string | null
      }
    } & DefaultSession["user"]
  }

  interface User {
    role: 'USER' | 'ADMIN'
    isActive: boolean
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
    role: 'USER' | 'ADMIN'
    isActive: boolean
  }
}