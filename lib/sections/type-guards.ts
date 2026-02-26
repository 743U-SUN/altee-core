/**
 * セクションデータの型ガード
 * Phase 2で lib/section-type-guards.ts から移行
 *
 * 型アサーション(as)の代わりに使用して型安全性を向上
 */

import type {
  ImageHeroData,
  ImageGrid2Data,
  ImageGrid3Data,
  ImageGridItem,
  FAQData,
  LinksData,
  ProfileCardData,
  CharacterProfileData,
  HeaderData,
  LongTextData,
  BarGraphData,
  CircularStatData,
  WeeklyScheduleData,
  YoutubeSectionData,
  TimelineData,
  VideoGallerySectionData,
  IconLinksData,
  LinkListData,
  ImageSectionData,
} from '@/types/profile-sections'

/**
 * 共通ヘルパー: オブジェクトであることを確認し、型を絞り込む
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/**
 * 共通ヘルパー: プロパティの型チェック
 */
function hasStringProp(obj: Record<string, unknown>, key: string, optional = false): boolean {
  if (optional) {
    return obj[key] === undefined || typeof obj[key] === 'string'
  }
  return typeof obj[key] === 'string'
}

function hasNumberProp(obj: Record<string, unknown>, key: string, optional = false): boolean {
  if (optional) {
    return obj[key] === undefined || typeof obj[key] === 'number'
  }
  return typeof obj[key] === 'number'
}

// ImageGridItem の型ガード
function isImageGridItem(item: unknown): item is ImageGridItem {
  if (!isRecord(item)) return false
  return (
    hasStringProp(item, 'id') &&
    hasNumberProp(item, 'sortOrder') &&
    hasStringProp(item, 'imageKey', true) &&
    hasStringProp(item, 'title', true) &&
    hasStringProp(item, 'subtitle', true) &&
    hasStringProp(item, 'overlayText', true) &&
    hasStringProp(item, 'linkUrl', true)
  )
}

// ImageHeroData の型ガード
export function isImageHeroData(data: unknown): data is ImageHeroData {
  if (!isRecord(data)) return false
  return data.item === undefined || isImageGridItem(data.item)
}

// ImageGrid2Data の型ガード
export function isImageGrid2Data(data: unknown): data is ImageGrid2Data {
  if (!isRecord(data)) return false
  if (!Array.isArray(data.items)) return false
  return data.items.length === 2 && data.items.every(isImageGridItem)
}

// ImageGrid3Data の型ガード
export function isImageGrid3Data(data: unknown): data is ImageGrid3Data {
  if (!isRecord(data)) return false
  if (!Array.isArray(data.items)) return false
  return data.items.length === 3 && data.items.every(isImageGridItem)
}

// FAQData の型ガード
export function isFAQData(data: unknown): data is FAQData {
  if (!isRecord(data)) return false
  if (!Array.isArray(data.questions)) return false
  return data.questions.every((q: unknown) => {
    if (!isRecord(q)) return false
    return (
      hasStringProp(q, 'id') &&
      hasStringProp(q, 'question') &&
      hasStringProp(q, 'answer') &&
      hasNumberProp(q, 'sortOrder')
    )
  })
}

// LinksData の型ガード
export function isLinksData(data: unknown): data is LinksData {
  if (!isRecord(data)) return false
  return Array.isArray(data.items)
}

// ProfileCardData の型ガード
export function isProfileCardData(data: unknown): data is ProfileCardData {
  if (!isRecord(data)) return false
  return hasStringProp(data, 'characterName') && hasStringProp(data, 'bio')
}

// CharacterProfileData の型ガード
export function isCharacterProfileData(data: unknown): data is CharacterProfileData {
  if (!isRecord(data)) return false
  return (
    hasStringProp(data, 'name') &&
    (data.characterPosition === 'left' || data.characterPosition === 'right') &&
    typeof data.showSocialLinks === 'boolean'
  )
}

// HeaderData の型ガード
export function isHeaderData(data: unknown): data is HeaderData {
  if (!isRecord(data)) return false
  return (
    hasStringProp(data, 'text') &&
    (data.level === 'h2' || data.level === 'h3' || data.level === 'h4')
  )
}

// LongTextData の型ガード
export function isLongTextData(data: unknown): data is LongTextData {
  if (!isRecord(data)) return false
  return hasStringProp(data, 'content')
}

// BarGraphData の型ガード
export function isBarGraphData(data: unknown): data is BarGraphData {
  if (!isRecord(data)) return false
  return Array.isArray(data.items)
}

// CircularStatData の型ガード
export function isCircularStatData(data: unknown): data is CircularStatData {
  if (!isRecord(data)) return false
  return Array.isArray(data.items)
}

// WeeklyScheduleData の型ガード
export function isWeeklyScheduleData(data: unknown): data is WeeklyScheduleData {
  if (!isRecord(data)) return false
  return (
    hasStringProp(data, 'startDate') &&
    Array.isArray(data.schedules) &&
    data.schedules.length === 7
  )
}

// YoutubeSectionData の型ガード
export function isYoutubeSectionData(data: unknown): data is YoutubeSectionData {
  if (!isRecord(data)) return false
  return hasStringProp(data, 'url') && hasStringProp(data, 'videoId')
}

// TimelineData の型ガード
export function isTimelineData(data: unknown): data is TimelineData {
  if (!isRecord(data)) return false
  return Array.isArray(data.items)
}

// VideoGallerySectionData の型ガード
export function isVideoGallerySectionData(data: unknown): data is VideoGallerySectionData {
  if (!isRecord(data)) return false
  return Array.isArray(data.items)
}

// IconLinksData の型ガード
export function isIconLinksData(data: unknown): data is IconLinksData {
  if (!isRecord(data)) return false
  return Array.isArray(data.items)
}

// LinkListData の型ガード
export function isLinkListData(data: unknown): data is LinkListData {
  if (!isRecord(data)) return false
  return Array.isArray(data.items)
}

// ImageSectionData の型ガード
export function isImageSectionData(data: unknown): data is ImageSectionData {
  // ImageSectionData は全てoptionalなので最低限のobjectチェックのみ
  return isRecord(data)
}

/**
 * セクションタイプに基づいてデータを安全に取得するヘルパー
 */
export function getSectionData<T>(
  sectionType: string,
  data: unknown,
  validator: (data: unknown) => data is T,
  defaultValue: T
): T {
  if (validator(data)) {
    return data
  }
  console.warn(`[getSectionData] Invalid data for section type: ${sectionType}`)
  return defaultValue
}
