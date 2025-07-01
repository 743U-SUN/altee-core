import { DeviceCategory, CategoryAttribute, Device, UserDevice, DeviceAttribute, User } from '@prisma/client'

// デバイスカテゴリと属性を含む型
export type DeviceCategoryWithAttributes = DeviceCategory & {
  attributes: CategoryAttribute[]
}

// デバイス詳細情報の型
export type DeviceWithDetails = Device & {
  category: DeviceCategory & {
    attributes: CategoryAttribute[]
  }
  brand?: { id: string, name: string } | null
  userDevices: (UserDevice & {
    user: Pick<User, 'name' | 'handle'>
  })[]
  attributes: (DeviceAttribute & {
    categoryAttribute: CategoryAttribute
  })[]
}

// ユーザーデバイス詳細情報の型
export type UserDeviceWithDetails = UserDevice & {
  device: DeviceWithDetails
}

// ユーザー公開ページ用のデバイス詳細型（他ユーザー情報を含まない）
export type DeviceForUserPage = Device & {
  category: DeviceCategory
  brand?: { id: string, name: string } | null
  attributes: (DeviceAttribute & {
    categoryAttribute: CategoryAttribute
  })[]
}

// ユーザー公開ページ用のユーザーデバイス型
export type UserDeviceForPublicPage = UserDevice & {
  device: DeviceForUserPage
}

// Amazon OG データの型
export interface AmazonOgData {
  title?: string
  description?: string
  image?: string
}