'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { InlineEdit } from '@/components/inline-edit';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { GripVertical, Trash2, Loader2 } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'sonner';

import {
  SortableParentItem as SortableParentItemType,
  SortableChildItem,
  NestedSortableListConfig,
  ItemState
} from './types';
import { SortableChildList } from './SortableChildList';

interface SortableParentItemProps<TParent extends SortableParentItemType, TChild extends SortableChildItem> {
  parentItem: TParent;
  index: number;
  config: NestedSortableListConfig<TParent, TChild>;
  parentState: ItemState;
  childState: ItemState;
  onEditParent: (itemId: string, updates: Partial<TParent>) => Promise<void>;
  onDeleteParent: (itemId: string) => Promise<void>;
  onUpdateParentState: (newState: Partial<ItemState>) => void;
  onUpdateChildState: (parentId: string, newState: Partial<ItemState>) => void;
  onToggleChildListAccordion: (parentId: string, value: string) => void;
}

function SortableParentItemComponent<TParent extends SortableParentItemType, TChild extends SortableChildItem>({
  parentItem,
  index,
  config,
  parentState,
  childState,
  onEditParent,
  onDeleteParent,
  onUpdateParentState,
  onUpdateChildState,
  onToggleChildListAccordion,
}: SortableParentItemProps<TParent, TChild>) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: parentItem.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    background: 'var(--theme-card-bg, hsl(var(--card)))',
    border: isDragging
      ? '1px solid var(--theme-text-accent, hsl(var(--primary)))'
      : 'var(--theme-card-border, 1px solid hsl(var(--border)))',
    borderRadius: 'var(--theme-card-radius, 0.5rem)',
    boxShadow: 'var(--theme-card-shadow)',
  };

  const isDeleting = parentState.isDeleting[parentItem.id] || false;
  const childItems = config.getChildItems(parentItem.id);

  // 親フィールドのアコーディオン開閉状態（accordionOpenの特別なキーを使用）
  const parentFieldsAccordionKey = `${parentItem.id}_fields`;
  const isParentFieldsOpen = parentState.accordionOpen[parentFieldsAccordionKey] || false;

  // 親フィールドのアコーディオン開閉
  const handleParentFieldsAccordionChange = (value: string) => {
    const newAccordionState: { [itemId: string]: boolean } = { ...parentState.accordionOpen };

    if (value && value !== '') {
      // 開く
      newAccordionState[parentFieldsAccordionKey] = true;
    } else {
      // 閉じる
      delete newAccordionState[parentFieldsAccordionKey];
    }

    onUpdateParentState({
      accordionOpen: newAccordionState
    });
  };

  // フィールド単位の保存ハンドラー
  const handleFieldSave = async (fieldKey: string, newValue: string) => {
    // バリデーション実行
    const field = config.parentConfig.editableFields.find(f => f.key === fieldKey);
    if (field?.validation) {
      const error = field.validation(newValue);
      if (error) {
        toast.error(error);
        throw new Error(error); // InlineEditが元の値に戻す
      }
    }

    // 1フィールドだけ更新
    const updates = { [fieldKey]: newValue } as Partial<TParent>;
    await onEditParent(parentItem.id, updates);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border p-2 md:p-6"
    >
      {/* カテゴリー情報編集（アコーディオン） */}
      <Accordion
        type="single"
        collapsible
        value={isParentFieldsOpen ? parentFieldsAccordionKey : ''}
        onValueChange={handleParentFieldsAccordionChange}
        className="mb-4"
      >
        <AccordionItem value={parentFieldsAccordionKey} className="border-none">
          {/* 親アイテムのヘッダー（アコーディオントリガー含む） */}
          <div className="flex items-center gap-4 mb-4">
            {/* ドラッグハンドル & インデックス */}
            <div
              className="flex items-center gap-2 cursor-grab active:cursor-grabbing"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-5 w-5 text-muted-foreground" />
              <div
                className="w-8 h-8 text-sm font-medium rounded-full flex items-center justify-center"
                style={{
                  background: 'var(--theme-accent-bg, hsl(var(--primary) / 0.1))',
                  color: 'var(--theme-text-accent, hsl(var(--primary)))',
                }}
              >
                {index + 1}
              </div>
            </div>

            {/* 親アイテム名表示（アコーディオントリガー） - 横幅いっぱいに */}
            <div className="flex-1 min-w-0">
              <AccordionTrigger className="w-full hover:no-underline py-2">
                <h3
                  className="text-lg font-medium transition-colors text-left"
                  style={{ color: 'var(--theme-text-primary, hsl(var(--card-foreground)))' }}
                >
                  {config.parentConfig.itemDisplayName(parentItem, index)}
                </h3>
              </AccordionTrigger>
            </div>

            {/* 削除ボタン */}
            {config.parentConfig.onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteParent(parentItem.id);
                }}
                disabled={isDeleting}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>

          <AccordionContent>
            <div
              className="space-y-4 pb-4"
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {config.parentConfig.editableFields.map((field) => (
                <div key={field.key}>
                  <Label
                    htmlFor={`${parentItem.id}-${field.key}`}
                    className="text-sm font-medium mb-2 block"
                    style={{ color: 'var(--theme-text-primary, hsl(var(--card-foreground)))' }}
                  >
                    {field.label}
                    {field.maxLength && ` (${field.maxLength}文字以内)`}
                  </Label>

                  <InlineEdit
                    value={(parentItem as Record<string, unknown>)[field.key] as string || ''}
                    onSave={(newValue) => handleFieldSave(field.key, newValue)}
                    placeholder={field.placeholder}
                    multiline={field.type === 'textarea'}
                    maxLength={field.maxLength}
                    rows={field.type === 'textarea' ? 4 : undefined}
                  />
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* 子アイテムリスト（アコーディオン内） */}
      <Accordion
        type="single"
        collapsible
        value={childState.accordionOpen[parentItem.id] ? parentItem.id : ''}
        onValueChange={(value) => onToggleChildListAccordion(parentItem.id, value)}
      >
        <AccordionItem value={parentItem.id} className="border-none">
          <AccordionTrigger className="hover:no-underline py-2">
            <div className="text-sm font-medium">
              {config.childConfig.childListLabel?.(parentItem, childItems.length) || `子アイテム (${childItems.length}個)`}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <SortableChildList
              parentId={parentItem.id}
              childItems={childItems}
              config={config}
              childState={childState}
              onUpdateChildState={onUpdateChildState}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

// React.memoでメモ化して不要な再レンダリングを防ぐ
export const SortableParentItem = React.memo(SortableParentItemComponent) as <TParent extends SortableParentItemType, TChild extends SortableChildItem>(
  props: SortableParentItemProps<TParent, TChild>
) => React.ReactElement;
