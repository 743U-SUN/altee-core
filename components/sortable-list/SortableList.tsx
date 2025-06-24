'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import { SortableItem as SortableItemType, SortableListConfig, ItemState } from './types';
import { SortableItem } from './SortableItem';

interface SortableListProps<T extends SortableItemType> {
  config: SortableListConfig<T>;
  loading?: boolean;
}

export function SortableList<T extends SortableItemType>({ 
  config, 
  loading = false 
}: SortableListProps<T>) {
  const [itemState, setItemState] = useState<ItemState>({
    isEditing: {},
    isDeleting: {},
    isSaving: {},
    tempValues: {},
    accordionOpen: {},
  });
  const [isAdding, setIsAdding] = useState(false);

  // ドラッグアンドドロップ用センサー設定
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px移動でドラッグ開始
      },
    })
  );

  // アイテムが変更されたときに一時データを初期化
  useEffect(() => {
    const tempValues: { [itemId: string]: { [fieldKey: string]: string } } = {};
    
    config.items.forEach(item => {
      if (!itemState.tempValues[item.id]) {
        tempValues[item.id] = {};
        config.editableFields.forEach(field => {
          tempValues[item.id][field.key] = (item as Record<string, unknown>)[field.key] as string || '';
        });
      }
    });
    
    if (Object.keys(tempValues).length > 0) {
      setItemState(prev => ({
        ...prev,
        tempValues: { ...prev.tempValues, ...tempValues }
      }));
    }
  }, [config.items, config.editableFields, itemState.tempValues]);

  // アイテムを追加
  const handleAddItem = async () => {
    if (!config.onAdd) return;

    if (config.maxItems && config.items.length >= config.maxItems) {
      toast.error(`アイテムは最大${config.maxItems}個まで作成できます`);
      return;
    }

    try {
      setIsAdding(true);
      await config.onAdd();
    } catch (error) {
      console.error('Add item error:', error);
      toast.error('アイテムの追加に失敗しました');
    } finally {
      setIsAdding(false);
    }
  };

  // アイテムを編集
  const handleEditItem = async (itemId: string, updates: Partial<T>) => {
    if (!config.onEdit) return;

    try {
      setItemState(prev => ({
        ...prev,
        isSaving: { ...prev.isSaving, [itemId]: true }
      }));
      
      await config.onEdit(itemId, updates);
      
      setItemState(prev => ({
        ...prev,
        isEditing: { ...prev.isEditing, [itemId]: false }
      }));
      
      toast.success('保存しました');
    } catch (error) {
      console.error('Edit item error:', error);
      toast.error('保存に失敗しました');
    } finally {
      setItemState(prev => ({
        ...prev,
        isSaving: { ...prev.isSaving, [itemId]: false }
      }));
    }
  };

  // アイテムを削除
  const handleDeleteItem = async (itemId: string) => {
    if (!config.onDelete) return;

    try {
      setItemState(prev => ({
        ...prev,
        isDeleting: { ...prev.isDeleting, [itemId]: true }
      }));
      
      await config.onDelete(itemId);
      
      // 一時データも削除
      setItemState(prev => {
        const newTempValues = { ...prev.tempValues };
        delete newTempValues[itemId];
        const newIsEditing = { ...prev.isEditing };
        delete newIsEditing[itemId];
        
        return {
          ...prev,
          tempValues: newTempValues,
          isEditing: newIsEditing,
          isDeleting: { ...prev.isDeleting, [itemId]: false }
        };
      });
      
      toast.success('削除しました');
    } catch (error) {
      console.error('Delete item error:', error);
      toast.error('削除に失敗しました');
      setItemState(prev => ({
        ...prev,
        isDeleting: { ...prev.isDeleting, [itemId]: false }
      }));
    }
  };

  // ドラッグ終了時の処理
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    const oldIndex = config.items.findIndex(item => item.id === active.id);
    const newIndex = config.items.findIndex(item => item.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // 配列を並べ替え
    const newItems = arrayMove(config.items, oldIndex, newIndex);
    
    // sortOrderを更新
    const updatedItems = newItems.map((item, index) => ({
      ...item,
      sortOrder: index
    }));

    try {
      await config.onReorder(updatedItems);
      toast.success('並び順を更新しました');
    } catch (error) {
      console.error('Reorder error:', error);
      toast.error('並び順の更新に失敗しました');
    }
  };

  // 編集状態を切り替え
  const toggleEdit = (itemId: string) => {
    setItemState(prev => ({
      ...prev,
      isEditing: { ...prev.isEditing, [itemId]: !prev.isEditing[itemId] }
    }));
  };

  // 一時値を更新
  const updateTempValue = (itemId: string, fieldKey: string, value: string) => {
    setItemState(prev => ({
      ...prev,
      tempValues: {
        ...prev.tempValues,
        [itemId]: {
          ...prev.tempValues[itemId],
          [fieldKey]: value
        }
      }
    }));
  };

  if (loading) {
    return (
      <div className="py-4 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  // sortOrderでソート
  const sortedItems = [...config.items].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="space-y-6">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sortedItems.map(item => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {sortedItems.map((item, index) => (
              <SortableItem
                key={item.id}
                item={item}
                index={index}
                config={config}
                state={itemState}
                onEdit={handleEditItem}
                onDelete={handleDeleteItem}
                onToggleEdit={toggleEdit}
                onUpdateTempValue={updateTempValue}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* 追加ボタン */}
      {config.onAdd && (
        <div className="flex justify-center">
          <Button
            onClick={handleAddItem}
            disabled={isAdding || Boolean(config.maxItems && config.items.length >= config.maxItems)}
            variant="outline"
            className="w-full max-w-md"
          >
            {isAdding ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            {config.addButtonText || 'アイテムを追加'}
            {config.maxItems && config.items.length >= config.maxItems && ' （上限に達しました）'}
          </Button>
        </div>
      )}

      {/* 空の状態 */}
      {config.items.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-lg mb-2">{config.emptyStateText || 'アイテムがありません'}</div>
          {config.emptyStateDescription && (
            <p className="text-sm text-gray-400">{config.emptyStateDescription}</p>
          )}
        </div>
      )}
    </div>
  );
}