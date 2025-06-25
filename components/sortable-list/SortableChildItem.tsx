'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { GripVertical, Save, Trash2, Loader2, MessageSquare } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
  onToggleEdit: (itemId: string) => void;
  onUpdateTempValue: (itemId: string, fieldKey: string, value: string) => void;
}

function SortableChildItemComponent<TParent extends SortableParentItem, TChild extends SortableChildItemType>({
  childItem,
  index,
  config,
  childState,
  onEdit,
  onDelete,
  onToggleEdit,
  onUpdateTempValue,
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
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  const isSaving = childState.isSaving[childItem.id] || false;
  const isDeleting = childState.isDeleting[childItem.id] || false;
  const tempValues = childState.tempValues[childItem.id] || {};
  
  // フィールドエラー状態管理
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // 単一フィールドのバリデーション
  const validateField = useCallback((fieldKey: string, value: string): string | null => {
    const field = config.childConfig.editableFields.find(f => f.key === fieldKey);
    if (!field) return null;

    // 必須チェック
    if (!value.trim()) {
      return `${field.label}は必須です`;
    }

    // 文字数チェック
    if (field.maxLength && value.length > field.maxLength) {
      return `${field.label}は${field.maxLength}文字以内で入力してください`;
    }

    // カスタムバリデーション
    if (field.validation) {
      return field.validation(value);
    }

    return null;
  }, [config.childConfig.editableFields]);

  // フィールド値変更時のハンドラー（バリデーション付き）
  const handleFieldChange = useCallback((fieldKey: string, value: string) => {
    // 値を更新
    onUpdateTempValue(childItem.id, fieldKey, value);
    
    // リアルタイムバリデーション
    const error = validateField(fieldKey, value);
    setFieldErrors(prev => ({
      ...prev,
      [fieldKey]: error || ''
    }));
  }, [childItem.id, onUpdateTempValue, validateField]);

  // 全フィールドバリデーション
  const validateAndSave = async () => {
    const updates: Partial<TChild> = {};
    const newFieldErrors: Record<string, string> = {};
    let hasError = false;

    // 全フィールドをバリデーション
    for (const field of config.childConfig.editableFields) {
      const value = tempValues[field.key]?.trim() || '';
      const error = validateField(field.key, value);
      
      if (error) {
        newFieldErrors[field.key] = error;
        hasError = true;
      } else {
        (updates as Record<string, string>)[field.key] = value;
      }
    }

    // エラー状態を更新
    setFieldErrors(newFieldErrors);

    if (!hasError) {
      await onEdit(childItem.id, updates);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      validateAndSave();
    } else if (e.key === 'Escape') {
      // 元の値に戻す
      config.childConfig.editableFields.forEach(field => {
        onUpdateTempValue(childItem.id, field.key, (childItem as Record<string, unknown>)[field.key] as string || '');
      });
      // エラー状態もリセット
      setFieldErrors({});
      onToggleEdit(childItem.id);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border border-gray-200 border-x-0 border-b-0 hover:bg-gray-50 ${
        isDragging ? 'opacity-50' : ''
      }`}
      {...attributes}
      {...listeners}
    >
      <AccordionItem
        key={childItem.id}
        value={childItem.id}
        className="border-0"
      >
        <div className="relative flex items-stretch">
          {/* ドラッグハンドル */}
          <div className="flex items-center px-2 text-gray-400">
            <GripVertical className="h-4 w-4" />
          </div>
          
          {/* アコーディオントリガー */}
          <div className="flex-1">
            <AccordionTrigger 
              className="hover:no-underline w-full px-4 py-4 pr-24 [&[data-state=open]>svg]:rotate-180"
              style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            >
              <div className="flex items-center space-x-2 text-left min-w-0 flex-1">
                <MessageSquare className="h-4 w-4 text-blue-500 flex-shrink-0" />
                <span className="text-sm font-medium overflow-hidden text-ellipsis whitespace-nowrap">
                  {config.childConfig.itemDisplayName(childItem, index)}
                </span>
              </div>
            </AccordionTrigger>
          </div>
          
          {/* 操作ボタン */}
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-2 z-10">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                validateAndSave();
              }}
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              disabled={isSaving}
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
            >
              {isSaving ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Save className="h-3 w-3" />
              )}
            </Button>
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
                  <Label htmlFor={`${childItem.id}-${field.key}`} className="text-xs font-medium text-gray-700">
                    {field.label}
                    {field.maxLength && ` (${field.maxLength}文字以内)`}
                  </Label>
                  
                  {field.type === 'textarea' ? (
                    <Textarea
                      id={`${childItem.id}-${field.key}`}
                      value={tempValues[field.key] || ''}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      maxLength={field.maxLength}
                      rows={4}
                      className={`mt-1 resize-none ${fieldErrors[field.key] ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                      onKeyDown={(e) => handleKeyDown(e)}
                    />
                  ) : (
                    <Input
                      id={`${childItem.id}-${field.key}`}
                      value={tempValues[field.key] || ''}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      maxLength={field.maxLength}
                      className={`mt-1 ${fieldErrors[field.key] ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                      onKeyDown={(e) => handleKeyDown(e)}
                    />
                  )}
                  
                  {/* 文字数カウントとエラーメッセージ */}
                  <div className="flex justify-between items-start mt-1">
                    {field.maxLength && (
                      <div className="text-xs text-gray-500">
                        {(tempValues[field.key] || '').length}/{field.maxLength}文字
                      </div>
                    )}
                  </div>
                  {fieldErrors[field.key] && (
                    <div className="text-xs text-red-600 mt-1">
                      {fieldErrors[field.key]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </div>
  );
}

// React.memoでメモ化して不要な再レンダリングを防ぐ
export const SortableChildItem = React.memo(SortableChildItemComponent) as <TParent extends SortableParentItem, TChild extends SortableChildItemType>(
  props: SortableChildItemProps<TParent, TChild>
) => React.ReactElement;