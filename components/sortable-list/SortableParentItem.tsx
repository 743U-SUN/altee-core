'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { GripVertical, Edit3, Save, Trash2, Loader2 } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
  onToggleParentEdit: (itemId: string) => void;
  onUpdateParentTempValue: (itemId: string, fieldKey: string, value: string) => void;
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
  onToggleParentEdit,
  onUpdateParentTempValue,
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

  const isEditing = parentState.isEditing[parentItem.id] || false;
  const isSaving = parentState.isSaving[parentItem.id] || false;
  const isDeleting = parentState.isDeleting[parentItem.id] || false;
  const tempValues = parentState.tempValues[parentItem.id] || {};

  const childItems = config.getChildItems(parentItem.id);
  
  // フィールドエラー状態管理
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // 単一フィールドのバリデーション
  const validateField = useCallback((fieldKey: string, value: string): string | null => {
    const field = config.parentConfig.editableFields.find(f => f.key === fieldKey);
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
  }, [config.parentConfig.editableFields]);

  // フィールド値変更時のハンドラー（バリデーション付き）
  const handleFieldChange = useCallback((fieldKey: string, value: string) => {
    // 値を更新
    onUpdateParentTempValue(parentItem.id, fieldKey, value);
    
    // リアルタイムバリデーション
    const error = validateField(fieldKey, value);
    setFieldErrors(prev => ({
      ...prev,
      [fieldKey]: error || ''
    }));
  }, [parentItem.id, onUpdateParentTempValue, validateField]);

  // 全フィールドバリデーション
  const validateAndSave = async () => {
    const updates: Partial<TParent> = {};
    const newFieldErrors: Record<string, string> = {};
    let hasError = false;

    // 全フィールドをバリデーション
    for (const field of config.parentConfig.editableFields) {
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
      await onEditParent(parentItem.id, updates);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      validateAndSave();
    } else if (e.key === 'Escape') {
      // 元の値に戻す
      config.parentConfig.editableFields.forEach(field => {
        onUpdateParentTempValue(parentItem.id, field.key, (parentItem as Record<string, unknown>)[field.key] as string || '');
      });
      // エラー状態もリセット
      setFieldErrors({});
      onToggleParentEdit(parentItem.id);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-lg border ${
        isDragging ? 'border-primary' : 'border-gray-200'
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
          <GripVertical className="h-5 w-5 text-gray-400" />
          <div className="w-8 h-8 bg-primary/10 text-primary text-sm font-medium rounded-full flex items-center justify-center">
            {index + 1}
          </div>
        </div>

        {/* 親アイテム名表示・編集 */}
        <div className="flex-1">
          {isEditing ? (
            <div 
              className="space-y-4"
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {config.parentConfig.editableFields.map((field) => (
                <div key={field.key}>
                  <Label htmlFor={`${parentItem.id}-${field.key}`} className="text-sm font-medium text-gray-700">
                    {field.label}
                    {field.maxLength && ` (${field.maxLength}文字以内)`}
                  </Label>
                  
                  {field.type === 'textarea' ? (
                    <Textarea
                      id={`${parentItem.id}-${field.key}`}
                      value={tempValues[field.key] || ''}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      maxLength={field.maxLength}
                      rows={3}
                      className={`mt-1 resize-none ${fieldErrors[field.key] ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                      onKeyDown={(e) => handleKeyDown(e)}
                    />
                  ) : (
                    <Input
                      id={`${parentItem.id}-${field.key}`}
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
          ) : (
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-medium text-gray-900">
                {config.parentConfig.itemDisplayName(parentItem, index)}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleParentEdit(parentItem.id)}
                className="h-6 w-6 p-0"
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <Edit3 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        {/* 操作ボタン */}
        <div className="flex items-center gap-2">
          {isEditing && (
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
          )}

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
      </div>

      {/* 子アイテム管理アコーディオン */}
      <div 
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        className="cursor-default"
      >
        <Accordion 
          type="single" 
          collapsible 
          value={childState.accordionOpen?.[parentItem.id] ? "children" : ""}
          onValueChange={(value) => {
            if (value !== (childState.accordionOpen?.[parentItem.id] ? "children" : "")) {
              onToggleAccordion(parentItem.id);
            }
          }}
          className="w-full border border-gray-200 rounded-sm px-0 py-2"
        >
          <AccordionItem value="children" className="border-0">
            <AccordionTrigger className="hover:no-underline py-2 px-0 pr-2">
              <div className="flex items-center gap-2 px-4">
                <span className="text-sm font-medium text-gray-700">
                  {config.childConfig.childListLabel ? 
                    config.childConfig.childListLabel(parentItem, childItems.length) :
                    `子アイテム管理 (${childItems.length}個)`
                  }
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-0">
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
    </div>
  );
}

// React.memoでメモ化して不要な再レンダリングを防ぐ
export const SortableParentItem = React.memo(SortableParentItemComponent) as <TParent extends SortableParentItemType, TChild extends SortableChildItem>(
  props: SortableParentItemProps<TParent, TChild>
) => React.ReactElement;