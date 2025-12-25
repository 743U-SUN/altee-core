'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { InlineEdit } from '@/components/ui/inline-edit';
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
  onUpdateChildState: (parentId: string, newState: Partial<ItemState>) => void;
  onToggleAccordion: (parentId: string) => void;
}

function SortableParentItemComponent<TParent extends SortableParentItemType, TChild extends SortableChildItem>({
  parentItem,
  index,
  config,
  parentState,
  childState,
  onEditParent,
  onDeleteParent,
  onUpdateChildState,
  onToggleAccordion,
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
  };

  const isDeleting = parentState.isDeleting[parentItem.id] || false;
  const childItems = config.getChildItems(parentItem.id);

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
      className={`bg-card rounded-lg border ${
        isDragging ? 'border-primary' : 'border-border'
      } p-2 md:p-6`}
    >
      {/* 親アイテムのヘッダー */}
      <div className="flex items-center gap-4 mb-4">
        {/* ドラッグハンドル & インデックス */}
        <div
          className="flex items-center gap-2 cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
          <div className="w-8 h-8 bg-primary/10 text-primary text-sm font-medium rounded-full flex items-center justify-center">
            {index + 1}
          </div>
        </div>

        {/* 親アイテム名表示 */}
        <div className="flex-1">
          <h3 className="text-lg font-medium text-card-foreground">
            {config.parentConfig.itemDisplayName(parentItem, index)}
          </h3>
        </div>

        {/* 削除ボタン */}
        {config.parentConfig.onDelete && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDeleteParent(parentItem.id)}
            disabled={isDeleting}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
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

      {/* InlineEdit編集フィールド（常に表示） */}
      <div
        className="space-y-4 mb-4"
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {config.parentConfig.editableFields.map((field) => (
          <div key={field.key}>
            <Label htmlFor={`${parentItem.id}-${field.key}`} className="text-sm font-medium text-card-foreground mb-2 block">
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

      {/* 子アイテムリスト（アコーディオン内） */}
      <Accordion
        type="single"
        collapsible
        value={childState.accordionOpen[parentItem.id] ? parentItem.id : undefined}
        onValueChange={() => onToggleAccordion(parentItem.id)}
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
