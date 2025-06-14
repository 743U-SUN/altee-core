'use client';

import React, { useState } from 'react';
import { NestedSortableList } from './components';
import type { 
  SortableParentItemType, 
  SortableChildItemType, 
  NestedSortableListConfig, 
  EditableField 
} from './components';

// デモ用のデータ型
interface DemoCategory extends SortableParentItemType {
  name: string;
  description: string;
}

interface DemoQuestion extends SortableChildItemType {
  question: string;
  answer: string;
  parentId: string; // categoryId
}

// 初期データ
const initialCategories: DemoCategory[] = [
  {
    id: '1',
    sortOrder: 0,
    name: 'カテゴリ 1',
    description: 'これは最初のカテゴリです'
  },
  {
    id: '2',
    sortOrder: 1,
    name: 'カテゴリ 2', 
    description: 'これは2番目のカテゴリです'
  },
  {
    id: '3',
    sortOrder: 2,
    name: 'カテゴリ 3',
    description: 'これは3番目のカテゴリです'
  }
];

const initialQuestions: DemoQuestion[] = [
  {
    id: 'q1',
    sortOrder: 0,
    question: '質問1',
    answer: 'これは質問1の回答です。',
    parentId: '1'
  },
  {
    id: 'q2',
    sortOrder: 1,
    question: '質問2',
    answer: 'これは質問2の回答です。',
    parentId: '1'
  },
  {
    id: 'q3',
    sortOrder: 0,
    question: '質問3',
    answer: 'これは質問3の回答です。',
    parentId: '2'
  }
];

export default function CommonDemoPage() {
  const [categories, setCategories] = useState<DemoCategory[]>(initialCategories);
  const [questions, setQuestions] = useState<DemoQuestion[]>(initialQuestions);
  const [loading, setLoading] = useState(false);

  // カテゴリ用の編集可能フィールド
  const categoryFields: EditableField[] = [
    {
      key: 'name',
      label: 'カテゴリ名',
      type: 'text',
      placeholder: 'カテゴリ名を入力してください',
      maxLength: 30,
    },
    {
      key: 'description',
      label: '説明',
      type: 'textarea',
      placeholder: 'カテゴリの説明を入力してください',
      maxLength: 200,
    }
  ];

  // 質問用の編集可能フィールド
  const questionFields: EditableField[] = [
    {
      key: 'question',
      label: '質問',
      type: 'text',
      placeholder: '質問を入力してください',
      maxLength: 100,
    },
    {
      key: 'answer',
      label: '回答',
      type: 'textarea',
      placeholder: '回答を入力してください',
      maxLength: 500,
    }
  ];

  // 指定したカテゴリの質問を取得
  const getQuestionsForCategory = (categoryId: string): DemoQuestion[] => {
    return questions.filter(q => q.parentId === categoryId);
  };

  // カテゴリのイベントハンドラー
  const handleCategoryReorder = async (reorderedCategories: DemoCategory[]) => {
    console.log('Categories reordered:', reorderedCategories);
    setCategories(reorderedCategories);
  };

  const handleCategoryAdd = async () => {
    const newCategory: DemoCategory = {
      id: `cat-${Date.now()}`,
      sortOrder: categories.length,
      name: `新しいカテゴリ ${categories.length + 1}`,
      description: '新しいカテゴリの説明'
    };
    console.log('Category added:', newCategory);
    setCategories(prev => [...prev, newCategory]);
  };

  const handleCategoryEdit = async (itemId: string, updates: Partial<DemoCategory>) => {
    console.log('Category edited:', itemId, updates);
    setCategories(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, ...updates } : item
      )
    );
  };

  const handleCategoryDelete = async (itemId: string) => {
    console.log('Category deleted:', itemId);
    setCategories(prev => prev.filter(item => item.id !== itemId));
    // 関連する質問も削除
    setQuestions(prev => prev.filter(q => q.parentId !== itemId));
  };

  // 質問のイベントハンドラー
  const handleQuestionReorder = async (categoryId: string, reorderedQuestions: DemoQuestion[]) => {
    console.log('Questions reordered for category:', categoryId, reorderedQuestions);
    setQuestions(prev => {
      const otherQuestions = prev.filter(q => q.parentId !== categoryId);
      return [...otherQuestions, ...reorderedQuestions];
    });
  };

  const handleQuestionAdd = async (categoryId: string) => {
    const categoryQuestions = getQuestionsForCategory(categoryId);
    const newQuestion: DemoQuestion = {
      id: `q-${Date.now()}`,
      sortOrder: categoryQuestions.length,
      question: '',
      answer: '',
      parentId: categoryId
    };
    console.log('Question added to category:', categoryId, newQuestion);
    setQuestions(prev => [...prev, newQuestion]);
  };

  const handleQuestionEdit = async (categoryId: string, itemId: string, updates: Partial<DemoQuestion>) => {
    console.log('Question edited:', categoryId, itemId, updates);
    setQuestions(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, ...updates } : item
      )
    );
  };

  const handleQuestionDelete = async (categoryId: string, itemId: string) => {
    console.log('Question deleted:', categoryId, itemId);
    setQuestions(prev => prev.filter(item => item.id !== itemId));
  };

  // ネストしたリストの設定
  const nestedConfig: NestedSortableListConfig<DemoCategory, DemoQuestion> = {
    parentItems: categories,
    getChildItems: getQuestionsForCategory,
    parentConfig: {
      editableFields: categoryFields,
      itemDisplayName: (item) => item.name,
      onReorder: handleCategoryReorder,
      onAdd: handleCategoryAdd,
      onEdit: handleCategoryEdit,
      onDelete: handleCategoryDelete,
      maxItems: 5,
      addButtonText: '新しいカテゴリを追加',
      emptyStateText: 'カテゴリがありません',
      emptyStateDescription: '上のボタンからカテゴリを追加してください',
    },
    childConfig: {
      editableFields: questionFields,
      itemDisplayName: (item) => item.question || '新しい質問',
      onReorder: handleQuestionReorder,
      onAdd: handleQuestionAdd,
      onEdit: handleQuestionEdit,
      onDelete: handleQuestionDelete,
      maxItems: 10,
      addButtonText: 'Q&Aを追加',
      emptyStateText: 'Q&Aがありません',
      emptyStateDescription: '上のボタンからQ&Aを追加してください',
      childListLabel: (parentItem, childCount) => `Q&A管理 (${childCount}個)`,
    },
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">ネストしたソート可能リストコンポーネント デモ</h1>
        <p className="text-gray-600">
          カテゴリとQ&Aの2階層構造で、それぞれ独立して並べ替え可能なコンポーネントのデモです。
        </p>
      </div>

      <div className="mb-6">
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-green-700 mb-2">機能説明</h3>
          <ul className="text-sm text-green-600 space-y-1">
            <li>• カテゴリのドラッグ&ドロップで大カテゴリの並び替え</li>
            <li>• 各カテゴリ内のQ&Aも独立して並び替え可能</li>
            <li>• アコーディオンでQ&A管理エリアを展開/折りたたみ</li>
            <li>• インライン編集、追加、削除機能</li>
            <li>• カテゴリ最大5個、Q&A最大10個まで</li>
          </ul>
        </div>
      </div>

      {/* ネストしたリスト */}
      <NestedSortableList<DemoCategory, DemoQuestion>
        config={nestedConfig}
        loading={loading}
      />

      {/* 使用方法 */}
      <div className="mt-12 bg-white border rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">使用方法</h2>
        <div className="prose max-w-none">
          <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`import { NestedSortableList } from '@/app/common/components';
import type { NestedSortableListConfig } from '@/app/common/components';

interface Category extends SortableParentItem {
  name: string;
  description: string;
}

interface Question extends SortableChildItem {
  question: string;
  answer: string;
  parentId: string;
}

const config: NestedSortableListConfig<Category, Question> = {
  parentItems: categories,
  getChildItems: (parentId) => questions.filter(q => q.parentId === parentId),
  parentConfig: {
    editableFields: [/* 親アイテムのフィールド */],
    itemDisplayName: (item) => item.name,
    onReorder: async (items) => { /* 親アイテム並び替え */ },
    onAdd: async () => { /* 親アイテム追加 */ },
    // ...
  },
  childConfig: {
    editableFields: [/* 子アイテムのフィールド */],
    itemDisplayName: (item) => item.question,
    onReorder: async (parentId, items) => { /* 子アイテム並び替え */ },
    onAdd: async (parentId) => { /* 子アイテム追加 */ },
    // ...
  },
};

<NestedSortableList config={config} />`}
          </pre>
        </div>
      </div>
    </div>
  );
}