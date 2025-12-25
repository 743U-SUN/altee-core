'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { InlineEdit } from '@/components/ui/inline-edit';
import { GripVertical, Trash2, Loader2 } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'sonner';

import { SortableItem as SortableItemType, SortableListConfig, ItemState } from './types';

interface SortableItemProps<T extends SortableItemType> {
  item: T;
  index: number;
  config: SortableListConfig<T>;
  state: ItemState;
  onEdit: (itemId: string, updates: Partial<T>) => Promise<void>;
  onDelete: (itemId: string) => Promise<void>;
}

export function SortableItem<T extends SortableItemType>({
  item,
  index,
  config,
  state,
  onEdit,
  onDelete,
}: SortableItemProps<T>) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isDeleting = state.isDeleting[item.id] || false;

  // フィールド単位の保存ハンドラー
  const handleFieldSave = async (fieldKey: string, newValue: string) => {
    // バリデーション実行
    const field = config.editableFields.find(f => f.key === fieldKey);
    if (field?.validation) {
      const error = field.validation(newValue);
      if (error) {
        toast.error(error);
        throw new Error(error); // InlineEditが元の値に戻す
      }
    }

    // 1フィールドだけ更新
    const updates = { [fieldKey]: newValue } as Partial<T>;
    await onEdit(item.id, updates);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-card rounded-lg border ${
        isDragging ? 'border-primary' : 'border-border'
      } p-4 md:p-6`}
    >
      {/* ヘッダー: ドラッグハンドルと削除ボタン */}
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

        {/* アイテム名表示 */}
        <div className="flex-1">
          <h3 className="text-lg font-medium text-card-foreground">
            {config.itemDisplayName(item, index)}
          </h3>
        </div>

        {/* 削除ボタンのみ */}
        {config.onDelete && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(item.id)}
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
        className="space-y-4"
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {config.editableFields.map((field) => (
          <div key={field.key}>
            <Label htmlFor={`${item.id}-${field.key}`} className="text-sm font-medium text-card-foreground mb-2 block">
              {field.label}
              {field.maxLength && ` (${field.maxLength}文字以内)`}
            </Label>

            <InlineEdit
              value={(item as Record<string, unknown>)[field.key] as string || ''}
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
  );
}