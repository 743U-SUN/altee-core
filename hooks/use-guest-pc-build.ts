'use client'

import { useState, useEffect, useRef } from 'react'
import { z } from 'zod'

const pcPartTypeSchema = z.enum([
  'CPU',
  'GPU',
  'MOTHERBOARD',
  'RAM',
  'STORAGE',
  'PSU',
  'CASE',
  'COOLER',
  'OTHER',
])

const guestPcPartSchema = z.object({
  id: z.string(),
  partType: pcPartTypeSchema,
  name: z.string(),
  price: z.number().nullable().optional(),
  memo: z.string().nullable().optional(),
  itemId: z.string().nullable().optional(),
  specs: z.record(z.unknown()).nullable().optional(),
  tdp: z.number().nullable().optional(),
})

const guestPcBuildSchema = z.object({
  name: z.string(),
  parts: z.array(guestPcPartSchema),
})

export type GuestPcPart = z.infer<typeof guestPcPartSchema>

interface GuestPcBuild {
  name: string
  parts: GuestPcPart[]
}

const STORAGE_KEY = 'altee-guest-pc-build'
const SAVE_DEBOUNCE_MS = 300

function generateId(): string {
  return `guest-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function loadFromStorage(): GuestPcBuild {
  if (typeof window === 'undefined') {
    return { name: '', parts: [] }
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      const result = guestPcBuildSchema.safeParse(parsed)
      if (result.success) {
        return result.data
      }
    }
  } catch {
    // ignore
  }
  return { name: '', parts: [] }
}

function saveToStorage(build: GuestPcBuild) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(build))
  } catch {
    // ignore
  }
}

export function useGuestPcBuild() {
  const [build, setBuild] = useState<GuestPcBuild>({ name: '', parts: [] })
  const [isLoaded, setIsLoaded] = useState(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // localStorage から読み込み（クライアントのみ、ハイドレーション後）
  useEffect(() => {
    setBuild(loadFromStorage())
    setIsLoaded(true)
  }, [])

  // デバウンス付き localStorage 保存（初回読み込み完了後のみ）
  useEffect(() => {
    if (!isLoaded) return
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }
    saveTimerRef.current = setTimeout(() => {
      saveToStorage(build)
    }, SAVE_DEBOUNCE_MS)

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }
    }
  }, [build, isLoaded])

  const addPart = (part: Omit<GuestPcPart, 'id'>) => {
    setBuild((prev) => ({
      ...prev,
      parts: [...prev.parts, { ...part, id: generateId() }],
    }))
  }

  const removePart = (id: string) => {
    setBuild((prev) => ({
      ...prev,
      parts: prev.parts.filter((p) => p.id !== id),
    }))
  }

  const clearBuild = () => {
    setBuild({ name: '', parts: [] })
  }

  const totalPrice = build.parts.reduce((sum, p) => sum + (p.price ?? 0), 0)

  return {
    build,
    isLoaded,
    addPart,
    removePart,
    clearBuild,
    totalPrice,
  }
}
