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

import { 
  SortableParentItem, 
  SortableChildItem, 
  NestedSortableListConfig, 
  ItemState 
} from './types';
import { SortableParentItem as SortableParentItemComponent } from './SortableParentItem';

interface NestedSortableListProps<TParent extends SortableParentItem, TChild extends SortableChildItem> {
  config: NestedSortableListConfig<TParent, TChild>;
  loading?: boolean;
}

export function NestedSortableList<TParent extends SortableParentItem, TChild extends SortableChildItem>({ 
  config, 
  loading = false 
}: NestedSortableListProps<TParent, TChild>) {
  const [parentState, setParentState] = useState<ItemState>({
    isEditing: {},
    isDeleting: {},
    isSaving: {},
    tempValues: {},
  });
  const [childStates, setChildStates] = useState<{ [parentId: string]: ItemState }>({});
  const [isAddingParent, setIsAddingParent] = useState(false);

  // ドラッグアンドドロップ用センサー設定
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px移動でドラッグ開始
      },
    })
  );

  // 親アイテムが変更されたときに一時データを初期化
  useEffect(() => {
    const tempValues: { [itemId: string]: { [fieldKey: string]: string } } = {};
    
    config.parentItems.forEach(item => {
      if (!parentState.tempValues[item.id]) {
        tempValues[item.id] = {};
        config.parentConfig.editableFields.forEach(field => {
          tempValues[item.id][field.key] = (item as Record<string, unknown>)[field.key] as string || '';
        });
      }
    });
    
    if (Object.keys(tempValues).length > 0) {
      setParentState(prev => ({
        ...prev,
        tempValues: { ...prev.tempValues, ...tempValues }
      }));
    }
  }, [config.parentItems, config.parentConfig.editableFields]);

  // 子アイテムの状態を初期化
  useEffect(() => {
    const newChildStates: { [parentId: string]: ItemState } = {};
    
    config.parentItems.forEach(parentItem => {
      const childItems = config.getChildItems(parentItem.id);
      
      if (!childStates[parentItem.id]) {
        newChildStates[parentItem.id] = {
          isEditing: {},
          isDeleting: {},
          isSaving: {},
          tempValues: {},
        };
        
        childItems.forEach(childItem => {
          newChildStates[parentItem.id].tempValues[childItem.id] = {};
          config.childConfig.editableFields.forEach(field => {
            newChildStates[parentItem.id].tempValues[childItem.id][field.key] = (childItem as Record<string, unknown>)[field.key] as string || '';
          });
        });
      }
    });
    
    if (Object.keys(newChildStates).length > 0) {
      setChildStates(prev => ({ ...prev, ...newChildStates }));
    }
  }, [config.parentItems, config.childConfig.editableFields, config.getChildItems, childStates]);

  // 親アイテムを追加
  const handleAddParentItem = async () => {
    if (!config.parentConfig.onAdd) return;

    if (config.parentConfig.maxItems && config.parentItems.length >= config.parentConfig.maxItems) {
      toast.error(`アイテムは最大${config.parentConfig.maxItems}個まで作成できます`);
      return;
    }

    try {
      setIsAddingParent(true);
      await config.parentConfig.onAdd();
    } catch (error) {
      console.error('Add parent item error:', error);
      toast.error('アイテムの追加に失敗しました');
    } finally {
      setIsAddingParent(false);
    }
  };

  // 親アイテムを編集
  const handleEditParentItem = async (itemId: string, updates: Partial<TParent>) => {
    if (!config.parentConfig.onEdit) return;

    try {
      setParentState(prev => ({
        ...prev,
        isSaving: { ...prev.isSaving, [itemId]: true }
      }));
      
      await config.parentConfig.onEdit(itemId, updates);
      
      setParentState(prev => ({
        ...prev,
        isEditing: { ...prev.isEditing, [itemId]: false }
      }));
      
      toast.success('保存しました');
    } catch (error) {
      console.error('Edit parent item error:', error);
      toast.error('保存に失敗しました');
    } finally {
      setParentState(prev => ({
        ...prev,
        isSaving: { ...prev.isSaving, [itemId]: false }
      }));
    }
  };

  // 親アイテムを削除
  const handleDeleteParentItem = async (itemId: string) => {
    if (!config.parentConfig.onDelete) return;

    try {
      setParentState(prev => ({
        ...prev,
        isDeleting: { ...prev.isDeleting, [itemId]: true }
      }));
      
      await config.parentConfig.onDelete(itemId);
      
      // 親アイテムと関連する子アイテムの一時データを削除
      setParentState(prev => {
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
      
      setChildStates(prev => {
        const newStates = { ...prev };
        delete newStates[itemId];
        return newStates;
      });
      
      toast.success('削除しました');
    } catch (error) {
      console.error('Delete parent item error:', error);
      toast.error('削除に失敗しました');
      setParentState(prev => ({
        ...prev,
        isDeleting: { ...prev.isDeleting, [itemId]: false }
      }));
    }
  };

  // 親アイテムのドラッグ終了時の処理
  const handleParentDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    const oldIndex = config.parentItems.findIndex(item => item.id === active.id);
    const newIndex = config.parentItems.findIndex(item => item.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // 配列を並べ替え
    const newItems = arrayMove(config.parentItems, oldIndex, newIndex);
    
    // sortOrderを更新
    const updatedItems = newItems.map((item, index) => ({
      ...item,
      sortOrder: index
    }));

    try {
      await config.parentConfig.onReorder(updatedItems);
      toast.success('並び順を更新しました');
    } catch (error) {
      console.error('Reorder parent error:', error);
      toast.error('並び順の更新に失敗しました');
    }
  };

  // 親アイテムの編集状態を切り替え
  const toggleParentEdit = (itemId: string) => {
    setParentState(prev => ({
      ...prev,
      isEditing: { ...prev.isEditing, [itemId]: !prev.isEditing[itemId] }
    }));
  };

  // 親アイテムの一時値を更新
  const updateParentTempValue = (itemId: string, fieldKey: string, value: string) => {
    setParentState(prev => ({
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

  // 子アイテムの状態を更新
  const updateChildState = (parentId: string, newState: Partial<ItemState>) => {
    setChildStates(prev => ({
      ...prev,
      [parentId]: {
        ...prev[parentId],
        ...newState
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
  const sortedParentItems = [...config.parentItems].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="space-y-6">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleParentDragEnd}
      >
        <SortableContext
          items={sortedParentItems.map(item => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {sortedParentItems.map((parentItem, index) => (
              <SortableParentItemComponent
                key={parentItem.id}
                parentItem={parentItem}
                index={index}
                config={config}
                parentState={parentState}
                childState={childStates[parentItem.id] || {
                  isEditing: {},
                  isDeleting: {},
                  isSaving: {},
                  tempValues: {},
                }}
                onEditParent={handleEditParentItem}
                onDeleteParent={handleDeleteParentItem}
                onToggleParentEdit={toggleParentEdit}
                onUpdateParentTempValue={updateParentTempValue}
                onUpdateChildState={updateChildState}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* 親アイテム追加ボタン */}
      {config.parentConfig.onAdd && (
        <div className="flex justify-center">
          <Button
            onClick={handleAddParentItem}
            disabled={isAddingParent || Boolean(config.parentConfig.maxItems && config.parentItems.length >= config.parentConfig.maxItems)}
            variant="outline"
            className="w-full max-w-md"
          >
            {isAddingParent ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            {config.parentConfig.addButtonText || 'アイテムを追加'}
            {config.parentConfig.maxItems && config.parentItems.length >= config.parentConfig.maxItems && ' （上限に達しました）'}
          </Button>
        </div>
      )}

      {/* 空の状態 */}
      {config.parentItems.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-lg mb-2">{config.parentConfig.emptyStateText || 'アイテムがありません'}</div>
          {config.parentConfig.emptyStateDescription && (
            <p className="text-sm text-gray-400">{config.parentConfig.emptyStateDescription}</p>
          )}
        </div>
      )}
    </div>
  );
}