'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Accordion } from '@/components/ui/accordion';
import { Plus, Loader2, MessageCircleQuestion } from 'lucide-react';
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
import { SortableChildItem as SortableChildItemComponent } from './SortableChildItem';

interface SortableChildListProps<TParent extends SortableParentItem, TChild extends SortableChildItem> {
  parentId: string;
  childItems: TChild[];
  config: NestedSortableListConfig<TParent, TChild>;
  childState: ItemState;
  onUpdateChildState: (parentId: string, newState: Partial<ItemState>) => void;
}

function SortableChildListComponent<TParent extends SortableParentItem, TChild extends SortableChildItem>({
  parentId,
  childItems,
  config,
  childState,
  onUpdateChildState,
}: SortableChildListProps<TParent, TChild>) {
  const [isAdding, setIsAdding] = useState(false);

  // ドラッグアンドドロップ用センサー設定
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px移動でドラッグ開始
      },
    })
  );

  // 子アイテムが変更されたときに一時データを初期化
  useEffect(() => {
    const tempValues: { [itemId: string]: { [fieldKey: string]: string } } = {};
    
    childItems.forEach(item => {
      if (!childState.tempValues[item.id]) {
        tempValues[item.id] = {};
        config.childConfig.editableFields.forEach(field => {
          tempValues[item.id][field.key] = (item as Record<string, unknown>)[field.key] as string || '';
        });
      }
    });
    
    if (Object.keys(tempValues).length > 0) {
      onUpdateChildState(parentId, {
        tempValues: { ...childState.tempValues, ...tempValues }
      });
    }
  }, [childItems, config.childConfig.editableFields, childState.tempValues, onUpdateChildState, parentId]);

  // 子アイテムを追加
  const handleAddChildItem = async () => {
    if (!config.childConfig.onAdd) return;

    if (config.childConfig.maxItems && childItems.length >= config.childConfig.maxItems) {
      toast.error(`子アイテムは最大${config.childConfig.maxItems}個まで作成できます`);
      return;
    }

    try {
      setIsAdding(true);
      await config.childConfig.onAdd(parentId);
    } catch (error) {
      console.error('Add child item error:', error);
      toast.error('子アイテムの追加に失敗しました');
    } finally {
      setIsAdding(false);
    }
  };

  // 子アイテムを編集
  const handleEditChildItem = async (itemId: string, updates: Partial<TChild>) => {
    if (!config.childConfig.onEdit) return;

    try {
      onUpdateChildState(parentId, {
        isSaving: { ...childState.isSaving, [itemId]: true }
      });
      
      await config.childConfig.onEdit(parentId, itemId, updates);
      
      onUpdateChildState(parentId, {
        isEditing: { ...childState.isEditing, [itemId]: false },
        isSaving: { ...childState.isSaving, [itemId]: false }
      });
      
      toast.success('保存しました');
    } catch (error) {
      console.error('Edit child item error:', error);
      toast.error('保存に失敗しました');
      onUpdateChildState(parentId, {
        isSaving: { ...childState.isSaving, [itemId]: false }
      });
    }
  };

  // 子アイテムを削除
  const handleDeleteChildItem = async (itemId: string) => {
    if (!config.childConfig.onDelete) return;

    try {
      onUpdateChildState(parentId, {
        isDeleting: { ...childState.isDeleting, [itemId]: true }
      });
      
      await config.childConfig.onDelete(parentId, itemId);
      
      // 一時データも削除
      const newTempValues = { ...childState.tempValues };
      delete newTempValues[itemId];
      const newIsEditing = { ...childState.isEditing };
      delete newIsEditing[itemId];
      
      onUpdateChildState(parentId, {
        tempValues: newTempValues,
        isEditing: newIsEditing,
        isDeleting: { ...childState.isDeleting, [itemId]: false }
      });
      
      toast.success('削除しました');
    } catch (error) {
      console.error('Delete child item error:', error);
      toast.error('削除に失敗しました');
      onUpdateChildState(parentId, {
        isDeleting: { ...childState.isDeleting, [itemId]: false }
      });
    }
  };

  // 子アイテムのドラッグ終了時の処理
  const handleChildDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    const oldIndex = childItems.findIndex(item => item.id === active.id);
    const newIndex = childItems.findIndex(item => item.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // 配列を並べ替え
    const newItems = arrayMove(childItems, oldIndex, newIndex);
    
    // sortOrderを更新
    const updatedItems = newItems.map((item, index) => ({
      ...item,
      sortOrder: index
    }));

    try {
      await config.childConfig.onReorder(parentId, updatedItems);
      toast.success('並び順を更新しました');
    } catch (error) {
      console.error('Reorder child error:', error);
      toast.error('並び順の更新に失敗しました');
    }
  };

  // 子アイテムの編集状態を切り替え
  const toggleChildEdit = (itemId: string) => {
    onUpdateChildState(parentId, {
      isEditing: { ...childState.isEditing, [itemId]: !childState.isEditing[itemId] }
    });
  };

  // 子アイテムの一時値を更新
  const updateChildTempValue = (itemId: string, fieldKey: string, value: string) => {
    onUpdateChildState(parentId, {
      tempValues: {
        ...childState.tempValues,
        [itemId]: {
          ...childState.tempValues[itemId],
          [fieldKey]: value
        }
      }
    });
  };

  // sortOrderでソートされた子アイテムリストを取得
  const sortedChildItems = [...childItems].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="space-y-3">
      {/* 子アイテム一覧 */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleChildDragEnd}
      >
        <SortableContext
          items={sortedChildItems.map(item => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <Accordion type="single" collapsible className="w-full space-y-0 border-b-1">
            {sortedChildItems.map((item, index) => (
              <SortableChildItemComponent
                key={item.id}
                childItem={item}
                index={index}
                config={config}
                childState={childState}
                onEdit={handleEditChildItem}
                onDelete={handleDeleteChildItem}
                onToggleEdit={toggleChildEdit}
                onUpdateTempValue={updateChildTempValue}
              />
            ))}
          </Accordion>
        </SortableContext>
      </DndContext>
        
      {/* 子アイテム追加ボタン */}
      {config.childConfig.onAdd && (
        <div className="flex justify-center pt-2">
          <Button
            onClick={handleAddChildItem}
            disabled={isAdding || Boolean(config.childConfig.maxItems && childItems.length >= config.childConfig.maxItems)}
            variant="outline"
            size="sm"
            className="w-full max-w-xs h-8 text-xs"
          >
            {isAdding ? (
              <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
            ) : (
              <Plus className="h-3 w-3 mr-1.5" />
            )}
            {config.childConfig.addButtonText || '子アイテムを追加'}
            {config.childConfig.maxItems && childItems.length >= config.childConfig.maxItems && ' （上限）'}
          </Button>
        </div>
      )}

      {/* 空の状態 */}
      {childItems.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          <MessageCircleQuestion className="h-6 w-6 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">{config.childConfig.emptyStateText || '子アイテムがありません'}</p>
          {config.childConfig.emptyStateDescription && (
            <p className="text-xs text-gray-400">{config.childConfig.emptyStateDescription}</p>
          )}
        </div>
      )}
    </div>
  );
}

// React.memoでメモ化して不要な再レンダリングを防ぐ
export const SortableChildList = React.memo(SortableChildListComponent) as <TParent extends SortableParentItem, TChild extends SortableChildItem>(
  props: SortableChildListProps<TParent, TChild>
) => React.ReactElement;