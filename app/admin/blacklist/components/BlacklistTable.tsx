import { getBlacklistedEmails } from "@/app/actions/admin/blacklist"
import { BlacklistTableClient } from "./BlacklistTableClient"

export async function BlacklistTable() {
  const blacklistedEmails = await getBlacklistedEmails()

  return (
    <BlacklistTableClient
      blacklistedEmails={blacklistedEmails.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
      }))}
    />
  )
}