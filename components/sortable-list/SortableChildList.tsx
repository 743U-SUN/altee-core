'use client';

import React, { useState, useEffect, useRef } from 'react';
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

export function SortableChildList<TParent extends SortableParentItem, TChild extends SortableChildItem>({
  parentId,
  childItems,
  config,
  childState,
  onUpdateChildState,
}: SortableChildListProps<TParent, TChild>) {
  const [isAdding, setIsAdding] = useState(false);
  const prevChildItemsCountRef = useRef(childItems.length);
  const processingNewItemRef = useRef(false);

  // ドラッグアンドドロップ用センサー設定
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px移動でドラッグ開始
      },
    })
  );

  // 子アイテムのアコーディオン開閉を切り替え
  const handleChildAccordionChange = (value: string) => {
    // valueが空文字列の場合は閉じる、それ以外は開く
    const newAccordionState: { [itemId: string]: boolean } = {};

    // 親のIDが存在する場合は保持（Q&A管理全体のアコーディオンを開いたまま）
    if (childState.accordionOpen[parentId]) {
      newAccordionState[parentId] = true;
    }

    // 子アイテムのアコーディオンを開く
    if (value && value !== '') {
      newAccordionState[value] = true;
    }

    onUpdateChildState(parentId, {
      accordionOpen: newAccordionState
    });
  };

  const accordionOpenRef = useRef(childState.accordionOpen);
  accordionOpenRef.current = childState.accordionOpen;

  // 新しいアイテムが追加されたときに自動的にアコーディオンを開く
  useEffect(() => {
    const currentCount = childItems.length;
    const prevCount = prevChildItemsCountRef.current;

    // アイテムが増えた場合（新規追加）
    if (currentCount > prevCount && !processingNewItemRef.current) {
      processingNewItemRef.current = true;

      // sortOrderでソートして最後のアイテム（新しく追加されたアイテム）を取得
      const sortedItems = childItems.toSorted((a, b) => a.sortOrder - b.sortOrder);
      const newItem = sortedItems[sortedItems.length - 1];

      if (newItem) {
        // 新しいアイテムのアコーディオンを開く
        // 重要: 親のID（Q&A管理全体のアコーディオン状態）は保持する
        const newAccordionState: { [itemId: string]: boolean } = {};

        // 親のIDが存在する場合は保持（Q&A管理全体のアコーディオンを開いたまま）
        if (accordionOpenRef.current[parentId]) {
          newAccordionState[parentId] = true;
        }

        // 新しいアイテムのアコーディオンを開く
        newAccordionState[newItem.id] = true;

        onUpdateChildState(parentId, {
          accordionOpen: newAccordionState
        });
      }

      // 次のフレームでフラグをリセット
      setTimeout(() => {
        processingNewItemRef.current = false;
      }, 0);
    }

    prevChildItemsCountRef.current = currentCount;
  }, [childItems, parentId, onUpdateChildState]);

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
    } catch {
      toast.error('子アイテムの追加に失敗しました');
    } finally {
      setIsAdding(false);
    }
  };

  // 子アイテムを編集
  const handleEditChildItem = async (itemId: string, updates: Partial<TChild>) => {
    if (!config.childConfig.onEdit) return;

    try {
      await config.childConfig.onEdit(parentId, itemId, updates);
      toast.success('保存しました');
    } catch (error) {
      toast.error('保存に失敗しました');
      throw error; // InlineEditが元に戻すためにthrow
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

      onUpdateChildState(parentId, {
        isDeleting: { ...childState.isDeleting, [itemId]: false }
      });

      toast.success('削除しました');
    } catch {
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
    } catch {
      toast.error('並び順の更新に失敗しました');
    }
  };

  // sortOrderでソートされた子アイテムリストを取得
  const sortedChildItems = childItems.toSorted((a, b) => a.sortOrder - b.sortOrder);

  // 子アイテムのIDのセットを作成
  const childItemIds = new Set(childItems.map(item => item.id));

  // 現在開いているアコーディオンのIDを取得（子アイテムのIDのみ）
  const openAccordionId = Object.keys(childState.accordionOpen).find(
    id => childState.accordionOpen[id] === true && childItemIds.has(id)
  );

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
          <Accordion
            type="single"
            collapsible
            className="w-full space-y-0 border-b-1"
            value={openAccordionId || ''}
            onValueChange={handleChildAccordionChange}
          >
            {sortedChildItems.map((item, index) => (
              <SortableChildItemComponent
                key={item.id}
                childItem={item}
                index={index}
                config={config}
                childState={childState}
                onEdit={handleEditChildItem}
                onDelete={handleDeleteChildItem}
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
        <div className="text-center py-4 text-muted-foreground">
          <MessageCircleQuestion className="h-6 w-6 mx-auto mb-2 text-muted-foreground/50" />
          <p className="text-sm">{config.childConfig.emptyStateText || '子アイテムがありません'}</p>
          {config.childConfig.emptyStateDescription && (
            <p className="text-xs text-muted-foreground/70">{config.childConfig.emptyStateDescription}</p>
          )}
        </div>
      )}
    </div>
  );
}