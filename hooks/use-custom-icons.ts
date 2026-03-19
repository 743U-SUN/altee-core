import useSWR from 'swr'
import { getPublicCustomIcons } from '@/app/actions/content/icon-actions'
import type { CustomIcon } from '@/app/actions/admin/icon-actions'

/**
 * カスタムアイコン取得用SWRフック
 * 複数コンポーネント間でキャッシュを共有
 */
export function useCustomIcons() {
  return useSWR<CustomIcon[]>('custom-icons', async () => {
    const result = await getPublicCustomIcons()
    return result.success && result.icons ? result.icons : []
  })
}

/**
 * カスタムアイコンからアイコン選択状態を解決
 */
export function resolveIconSelection(
  customIcons: CustomIcon[],
  iconSelection: string
): {
  iconType: 'preset' | 'custom' | 'lucide'
  lucideIconName?: string
  customIconUrl?: string
  iconKey?: string
} {
  if (iconSelection.startsWith('custom:')) {
    const iconId = iconSelection.replace('custom:', '')
    const found = customIcons.find((ic) => ic.id === iconId)
    if (found) {
      return { iconType: 'custom', customIconUrl: found.url }
    }
  } else if (iconSelection) {
    return { iconType: 'lucide', lucideIconName: iconSelection }
  }
  return { iconType: 'preset' }
}

/**
 * IconSelector用のselectedIcon値を構築
 */
export function getSelectedIconValue(
  customIcons: CustomIcon[],
  iconType: string,
  lucideIconName?: string,
  customIconUrl?: string
): string {
  if (iconType === 'lucide' && lucideIconName) return lucideIconName
  if (iconType === 'custom' && customIconUrl) {
    const found = customIcons.find((ic) => ic.url === customIconUrl)
    return found ? `custom:${found.id}` : ''
  }
  return ''
}
