'use client'

import { useState, useEffect, useRef } from 'react'
import type { PcPartType } from '@prisma/client'

export interface GuestPcPart {
  id: string
  partType: PcPartType
  name: string
  price?: number | null
  memo?: string | null
  itemId?: string | null
  specs?: Record<string, unknown> | null
  tdp?: number | null
}

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
      return JSON.parse(stored) as GuestPcBuild
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

  useEffect(() => {
    setBuild(loadFromStorage())
    setIsLoaded(true)
  }, [])

  // デバウンス付き localStorage 保存
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
