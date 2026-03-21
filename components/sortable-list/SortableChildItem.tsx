'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { InlineEdit } from '@/components/inline-edit';
import { AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { GripVertical, Trash2, Loader2, MessageSquare } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'sonner';

import {
  SortableParentItem,
  SortableChildItem as SortableChildItemType,
  NestedSortableListConfig,
  ItemState
} from './types';

interface SortableChildItemProps<TParent extends SortableParentItem, TChild extends SortableChildItemType> {
  childItem: TChild;
  index: number;
  config: NestedSortableListConfig<TParent, TChild>;
  childState: ItemState;
  onEdit: (itemId: string, updates: Partial<TChild>) => Promise<void>;
  onDelete: (itemId: string) => Promise<void>;
}

function SortableChildItemComponent<TParent extends SortableParentItem, TChild extends SortableChildItemType>({
  childItem,
  index,
  config,
  childState,
  onEdit,
  onDelete,
}: SortableChildItemProps<TParent, TChild>) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: childItem.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    border: 'var(--theme-card-border, 1px solid hsl(var(--border)))',
  };

  const isDeleting = childState.isDeleting[childItem.id] || false;

  // フィールド単位の保存ハンドラー
  const handleFieldSave = async (fieldKey: string, newValue: string) => {
    // バリデーション実行
    const field = config.childConfig.editableFields.find(f => f.key === fieldKey);
    if (field?.validation) {
      const error = field.validation(newValue);
      if (error) {
        toast.error(error);
        throw new Error(error); // InlineEditが元の値に戻す
      }
    }

    // 1フィールドだけ更新
    const updates = { [fieldKey]: newValue } as Partial<TChild>;
    await onEdit(childItem.id, updates);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border border-x-0 border-b-0 hover:bg-muted/50 ${isDragging ? 'opacity-50' : ''}`}
    >
      <AccordionItem
        key={childItem.id}
        value={childItem.id}
        className="border-0"
      >
        <div className="relative flex items-stretch">
          {/* ドラッグハンドル */}
          <div
            className="flex items-center px-2 text-muted-foreground cursor-grab active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </div>

          {/* アコーディオントリガー */}
          <div className="flex-1">
            <AccordionTrigger className="hover:no-underline w-full px-4 py-4 pr-24 [&[data-state=open]>svg]:rotate-180">
              <div className="flex items-center space-x-2 text-left min-w-0 flex-1">
                <MessageSquare className="h-4 w-4 text-blue-500 flex-shrink-0" />
                <span className="text-sm font-medium overflow-hidden text-ellipsis whitespace-nowrap">
                  {config.childConfig.itemDisplayName(childItem, index)}
                </span>
              </div>
            </AccordionTrigger>
          </div>

          {/* 削除ボタンのみ */}
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-2 z-10">
            {config.childConfig.onDelete && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(childItem.id);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                disabled={isDeleting}
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs text-red-600 hover:text-red-700"
              >
                {isDeleting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Trash2 className="h-3 w-3" />
                )}
              </Button>
            )}
          </div>
        </div>

        <AccordionContent
          className="px-4 pb-4 ml-10"
        >
          <div
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="space-y-4">
              {config.childConfig.editableFields.map((field) => (
                <div key={field.key}>
                  <Label
                    htmlFor={`${childItem.id}-${field.key}`}
                    className="text-xs font-medium mb-2 block"
                    style={{ color: 'var(--theme-text-primary, hsl(var(--card-foreground)))' }}
                  >
                    {field.label}
                    {field.maxLength && ` (${field.maxLength}文字以内)`}
                  </Label>

                  <InlineEdit
                    value={(childItem as Record<string, unknown>)[field.key] as string || ''}
                    onSave={(newValue) => handleFieldSave(field.key, newValue)}
                    placeholder={field.placeholder}
                    multiline={field.type === 'textarea'}
                    maxLength={field.maxLength}
                    rows={field.type === 'textarea' ? 4 : undefined}
                  />
                </div>
              ))}
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </div>
  );
}

export const SortableChildItem = SortableChildItemComponent as <TParent extends SortableParentItem, TChild extends SortableChildItemType>(
  props: SortableChildItemProps<TParent, TChild>
) => React.ReactElement;
