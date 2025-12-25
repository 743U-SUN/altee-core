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
  SortableParentItem as SortableParentItemType, 
  SortableChildItem, 
  NestedSortableListConfig, 
  ItemState 
} from './types';
import { SortableParentItem } from './SortableParentItem';

interface NestedSortableListProps<TParent extends SortableParentItemType, TChild extends SortableChildItem> {
  config: NestedSortableListConfig<TParent, TChild>;
  loading?: boolean;
}

function NestedSortableListComponent<TParent extends SortableParentItemType, TChild extends SortableChildItem>({ 
  config, 
  loading = false 
}: NestedSortableListProps<TParent, TChild>) {
  const [parentState, setParentState] = useState<ItemState>({
    isDeleting: {},
    accordionOpen: {},
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

  // 子アイテムの状態を初期化（accordionOpenのみ）
  useEffect(() => {
    const newChildStates: { [parentId: string]: ItemState } = {};

    config.parentItems.forEach(parentItem => {
      if (!childStates[parentItem.id]) {
        newChildStates[parentItem.id] = {
          isDeleting: {},
          accordionOpen: {},
        };
      }
    });

    if (Object.keys(newChildStates).length > 0) {
      setChildStates(prev => ({ ...prev, ...newChildStates }));
    }
  }, [config.parentItems, childStates]);

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

  // 親アイテムを編集（InlineEditから呼ばれる）
  const handleEditParentItem = async (itemId: string, updates: Partial<TParent>) => {
    if (!config.parentConfig.onEdit) return;

    try {
      await config.parentConfig.onEdit(itemId, updates);
      toast.success('保存しました');
    } catch (error) {
      console.error('Edit parent item error:', error);
      toast.error('保存に失敗しました');
      throw error; // InlineEditが元に戻すためにthrow
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

      // 親アイテムと関連する子アイテムの状態を削除
      setParentState(prev => ({
        ...prev,
        isDeleting: { ...prev.isDeleting, [itemId]: false }
      }));

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

  // toggleParentEditとupdateParentTempValueは不要（InlineEditが管理）

  // 親アイテムの状態を更新
  const updateParentState = (newState: Partial<ItemState>) => {
    setParentState(prev => ({
      ...prev,
      ...newState
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

  // 子アイテムリストのアコーディオン開閉
  const handleChildListAccordionChange = (parentId: string, value: string | undefined) => {
    const newAccordionState: { [itemId: string]: boolean } = {};
    if (value) {
      // 開く
      newAccordionState[parentId] = true;
    }
    // valueがない場合は閉じる（空のオブジェクト）

    setChildStates(prev => ({
      ...prev,
      [parentId]: {
        ...prev[parentId],
        accordionOpen: newAccordionState
      }
    }));
  };

  if (loading) {
    return (
      <div className="py-4 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
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
              <SortableParentItem
                key={parentItem.id}
                parentItem={parentItem}
                index={index}
                config={config}
                parentState={parentState}
                childState={childStates[parentItem.id] || {
                  isDeleting: {},
                  accordionOpen: {},
                }}
                onEditParent={handleEditParentItem}
                onDeleteParent={handleDeleteParentItem}
                onUpdateParentState={updateParentState}
                onUpdateChildState={updateChildState}
                onToggleChildListAccordion={handleChildListAccordionChange}
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
        <div className="text-center py-8 text-muted-foreground">
          <div className="text-lg mb-2">{config.parentConfig.emptyStateText || 'アイテムがありません'}</div>
          {config.parentConfig.emptyStateDescription && (
            <p className="text-sm text-muted-foreground/70">{config.parentConfig.emptyStateDescription}</p>
          )}
        </div>
      )}
    </div>
  );
}

// React.memoでメモ化して不要な再レンダリングを防ぐ
export const NestedSortableList = React.memo(NestedSortableListComponent) as <TParent extends SortableParentItemType, TChild extends SortableChildItem>(
  props: NestedSortableListProps<TParent, TChild>
) => React.ReactElement;