import type { BaseSectionProps, FAQData } from '@/types/profile-sections'
import type { OldFAQData } from '@/lib/faq-compat'
import { normalizeQuestions } from '@/lib/faq-compat'
import { ThemedCard } from '@/components/sections/_shared/ThemedCard'
import { Badge, Divider } from '@/components/decorations'
import { LUCIDE_ICON_MAP } from '@/lib/lucide-icons'

/**
 * FAQセクション
 * Q&Aを常時表示（アコーディオンなし）
 * ThemedCard + Badge + Divider統一版
 */
export function FAQSection({ section }: BaseSectionProps) {
  const data = section.data as FAQData | OldFAQData
  const questions = normalizeQuestions(data).toSorted(
    (a, b) => a.sortOrder - b.sortOrder
  )

  if (questions.length === 0) {
    return null
  }

  return (
    <ThemedCard showCornerDecor className="w-full mb-6">
      {section.title && (
        <Badge variant="accent" className="mb-4">
          {section.title}
        </Badge>
      )}

      <div className="space-y-0">
        {questions.map((q, index) => {
          const LucideIconComponent = q.iconName
            ? (LUCIDE_ICON_MAP[q.iconName] ?? null)
            : null

          return (
            <div key={q.id}>
              {index > 0 && <Divider className="my-4" />}
              <div className="flex items-start gap-3">
                {LucideIconComponent && (
                  <div className="mt-0.5 shrink-0 p-1.5 rounded-lg bg-[var(--theme-accent-bg,rgba(176,125,79,0.1))]">
                    <LucideIconComponent className="w-4 h-4 text-[var(--theme-text-accent,#b07d4f)]" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-[var(--theme-text-primary)] mb-1">
                    {q.question}
                  </p>
                  <p className="text-sm text-[var(--theme-text-secondary)] leading-relaxed">
                    {q.answer}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </ThemedCard>
  )
}
