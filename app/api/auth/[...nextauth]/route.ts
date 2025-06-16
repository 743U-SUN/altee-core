import { handlers } from "@/auth"

export const { GET, POST } = handlers

// Prisma requires Node.js runtime, not Edge runtime
export const runtime = "nodejs"