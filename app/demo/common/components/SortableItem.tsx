'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { GripVertical, Edit3, Save, Trash2, Loader2 } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { SortableItem as SortableItemType, SortableListConfig, ItemState } from './types';

interface SortableItemProps<T extends SortableItemType> {
  item: T;
  index: number;
  config: SortableListConfig<T>;
  state: ItemState;
  onEdit: (itemId: string, updates: Partial<T>) => Promise<void>;
  onDelete: (itemId: string) => Promise<void>;
  onToggleEdit: (itemId: string) => void;
  onUpdateTempValue: (itemId: string, fieldKey: string, value: string) => void;
}

export function SortableItem<T extends SortableItemType>({
  item,
  index,
  config,
  state,
  onEdit,
  onDelete,
  onToggleEdit,
  onUpdateTempValue,
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

  const isEditing = state.isEditing[item.id] || false;
  const isSaving = state.isSaving[item.id] || false;
  const isDeleting = state.isDeleting[item.id] || false;
  const tempValues = state.tempValues[item.id] || {};

  // バリデーション
  const validateAndSave = async () => {
    const updates: Partial<T> = {};
    let hasError = false;

    for (const field of config.editableFields) {
      const value = tempValues[field.key]?.trim() || '';
      
      // 必須チェック
      if (!value) {
        // toast.error(`${field.label}を入力してください`);
        hasError = true;
        break;
      }

      // 文字数チェック
      if (field.maxLength && value.length > field.maxLength) {
        // toast.error(`${field.label}は${field.maxLength}文字以内で入力してください`);
        hasError = true;
        break;
      }

      // カスタムバリデーション
      if (field.validation) {
        const error = field.validation(value);
        if (error) {
          // toast.error(error);
          hasError = true;
          break;
        }
      }

      (updates as Record<string, string>)[field.key] = value;
    }

    if (!hasError) {
      await onEdit(item.id, updates);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      validateAndSave();
    } else if (e.key === 'Escape') {
      // 元の値に戻す
      config.editableFields.forEach(field => {
        onUpdateTempValue(item.id, field.key, (item as Record<string, unknown>)[field.key] as string || '');
      });
      onToggleEdit(item.id);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-lg border ${
        isDragging ? 'border-primary' : 'border-gray-200'
      } p-4 md:p-6`}
    >
      {/* ヘッダー */}
      <div className="flex items-center gap-4 mb-4">
        {/* ドラッグハンドル & インデックス */}
        <div 
          className="flex items-center gap-2 cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5 text-gray-400" />
          <div className="w-8 h-8 bg-primary/10 text-primary text-sm font-medium rounded-full flex items-center justify-center">
            {index + 1}
          </div>
        </div>

        {/* アイテム名表示 */}
        <div className="flex-1">
          <h3 className="text-lg font-medium text-gray-900">
            {config.itemDisplayName(item, index)}
          </h3>
        </div>

        {/* 操作ボタン */}
        <div className="flex items-center gap-2">
          {isEditing ? (
            <Button
              size="sm"
              onClick={validateAndSave}
              disabled={isSaving}
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleEdit(item.id)}
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <Edit3 className="h-4 w-4" />
            </Button>
          )}

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
      </div>

      {/* 編集フィールド */}
      {isEditing && (
        <div 
          className="space-y-4 border-t border-gray-200 pt-4"
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {config.editableFields.map((field) => (
            <div key={field.key}>
              <Label htmlFor={`${item.id}-${field.key}`} className="text-sm font-medium text-gray-700">
                {field.label}
                {field.maxLength && ` (${field.maxLength}文字以内)`}
              </Label>
              
              {field.type === 'textarea' ? (
                <Textarea
                  id={`${item.id}-${field.key}`}
                  value={tempValues[field.key] || ''}
                  onChange={(e) => onUpdateTempValue(item.id, field.key, e.target.value)}
                  placeholder={field.placeholder}
                  maxLength={field.maxLength}
                  rows={4}
                  className="mt-1 resize-none"
                  onKeyDown={(e) => handleKeyDown(e)}
                />
              ) : (
                <Input
                  id={`${item.id}-${field.key}`}
                  value={tempValues[field.key] || ''}
                  onChange={(e) => onUpdateTempValue(item.id, field.key, e.target.value)}
                  placeholder={field.placeholder}
                  maxLength={field.maxLength}
                  className="mt-1"
                  onKeyDown={(e) => handleKeyDown(e)}
                />
              )}
              
              {field.maxLength && (
                <div className="text-xs text-gray-500 mt-1">
                  {(tempValues[field.key] || '').length}/{field.maxLength}文字
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}