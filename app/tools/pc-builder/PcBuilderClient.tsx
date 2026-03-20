'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { useGuestPcBuild } from '@/hooks/use-guest-pc-build'
import { PartsListCard } from './components/PartsListCard'
import { AddPartForm } from './components/AddPartForm'
import { CompatibilityCheckCard } from './components/CompatibilityCheckCard'
import Link from 'next/link'

export function PcBuilderClient() {
  const { build, isLoaded, addPart, removePart, totalPrice, clearBuild } = useGuestPcBuild()
  const [showAddForm, setShowAddForm] = useState(false)

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PartsListCard
        parts={build.parts}
        totalPrice={totalPrice}
        onAddClick={() => setShowAddForm(true)}
        onRemovePart={removePart}
      />

      {showAddForm && (
        <AddPartForm
          onAddPart={addPart}
          onClose={() => setShowAddForm(false)}
        />
      )}

      {build.parts.length >= 2 && (
        <CompatibilityCheckCard parts={build.parts} />
      )}

      {/* アクション */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {build.parts.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearBuild}>
              すべてクリア
            </Button>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          <Link href="/auth/signin" className="text-primary hover:underline">
            ログイン
          </Link>
          するとビルドを保存できます
        </div>
      </div>
    </div>
  )
}
