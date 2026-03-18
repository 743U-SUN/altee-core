import { ChevronDown } from 'lucide-react'
import { ThemedCard } from '@/components/sections/_shared/ThemedCard'
import { SectionBand } from '@/components/profile/SectionBand'
import { resolvePreset } from '@/lib/sections/background-utils'
import type { FaqCategoryWithQuestions } from '../page'
import type { SectionBackgroundPreset } from '@/types/profile-sections'

interface FAQAccordionProps {
  question: string
  answer: string
}

function FAQAccordion({ question, answer }: FAQAccordionProps) {
  return (
    <details className="group border-b border-[var(--theme-accent-border)] last:border-0 [&_summary::-webkit-details-marker]:hidden">
      <summary className="w-full text-left py-4 px-2 flex justify-between items-center cursor-pointer transition-colors hover:text-[var(--theme-text-accent)] list-none">
        <span className="font-bold text-[var(--theme-text-primary)] group-hover:text-[var(--theme-text-accent)] text-sm pr-4">
          Q. {question}
        </span>
        <ChevronDown
          className="w-5 h-5 shrink-0 text-[var(--theme-text-secondary)] transition-transform duration-300 group-open:rotate-180"
        />
      </summary>
      <div className="px-4 py-2 mb-4 bg-[var(--theme-accent-bg)] rounded-xl text-sm leading-relaxed text-[var(--theme-text-secondary)] animate-in fade-in slide-in-from-top-1 duration-200">
        <span className="font-bold text-[var(--theme-text-accent)] mr-2">A.</span>
        {answer}
      </div>
    </details>
  )
}

interface FAQPublicContentProps {
  categories: FaqCategoryWithQuestions[]
  presets: SectionBackgroundPreset[]
}

export function FAQPublicContent({ categories, presets }: FAQPublicContentProps) {
  if (categories.length === 0) {
    return (
      <ThemedCard>
        <p className="text-[var(--theme-text-secondary)] text-center py-4">
          FAQはまだありません。
        </p>
      </ThemedCard>
    )
  }

  return (
    <div className="space-y-0">
      {categories.map((category) => {
        const preset = resolvePreset(category.settings?.background, presets)
        return (
          <SectionBand key={category.id} settings={category.settings} preset={preset} fullBleed>
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-4">
              <ThemedCard className="p-0 overflow-hidden">
                {/* カテゴリヘッダー */}
                <div className="px-6 py-4 border-b border-[var(--theme-accent-border)]">
                  <h2 className="text-base font-bold text-[var(--theme-text-primary)]">
                    {category.name}
                  </h2>
                  {category.description && (
                    <p className="text-sm text-[var(--theme-text-secondary)] mt-1">
                      {category.description}
                    </p>
                  )}
                </div>

                {/* 質問リスト */}
                <div className="px-4">
                  {category.questions.length === 0 ? (
                    <p className="py-4 text-sm text-[var(--theme-text-secondary)] text-center">
                      質問はまだありません。
                    </p>
                  ) : (
                    category.questions.map((q) => (
                      <FAQAccordion
                        key={q.id}
                        question={q.question}
                        answer={q.answer}
                      />
                    ))
                  )}
                </div>
              </ThemedCard>
            </div>
          </SectionBand>
        )
      })}
    </div>
  )
}
