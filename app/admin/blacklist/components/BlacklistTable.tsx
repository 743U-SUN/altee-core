import { getBlacklistedEmails } from "@/app/actions/blacklist"
import { BlacklistTableClient } from "./BlacklistTableClient"

export async function BlacklistTable() {
  const blacklistedEmails = await getBlacklistedEmails()

  return <BlacklistTableClient blacklistedEmails={blacklistedEmails} />
}