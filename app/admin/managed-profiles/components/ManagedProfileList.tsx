import { getManagedProfiles } from "@/app/actions/admin/managed-profile-actions"
import { resolveAvatarUrl } from "@/lib/avatar-utils"
import { ManagedProfileListClient } from "./ManagedProfileListClient"
import { ManagedProfilePagination } from "./ManagedProfilePagination"

interface ManagedProfileListProps {
  currentPage: number
  search?: string
}

export async function ManagedProfileList({ currentPage, search }: ManagedProfileListProps) {
  try {
    const filters = {
      ...(search && { search }),
    }

    const { profiles: rawProfiles, totalCount, totalPages } = await getManagedProfiles(
      filters,
      { page: currentPage, limit: 20 }
    )

    const profiles = rawProfiles.map((p) => ({
      ...p,
      characterName: p.characterInfo?.characterName ?? null,
      iconImageUrl: resolveAvatarUrl(p.characterInfo?.iconImageKey, null),
      createdAt: p.createdAt.toISOString(),
    }))

    return (
      <ManagedProfileListClient
        profiles={profiles}
        search={search}
        pagination={
          <ManagedProfilePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            search={search}
          />
        }
      />
    )
  } catch (error) {
    console.error("ManagedProfileList error:", { page: currentPage, search, error })
    return (
      <div className="text-center py-8 text-red-500">
        プロフィール一覧の読み込みに失敗しました
      </div>
    )
  }
}
