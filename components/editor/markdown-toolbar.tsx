'use client'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  Bold, 
  Italic, 
  Heading1,
  Heading2,
  Link2, 
  Code, 
  List, 
  ListOrdered,
  Quote,
  Image,
  Table,
  Minus
} from 'lucide-react'

interface MarkdownToolbarProps {
  onInsert: (text: string, type?: 'wrap' | 'insert') => void
  onImageInsert?: () => void
  disabled?: boolean
}

interface ToolItem {
  icon: React.ComponentType<{ className?: string }>
  label: string
  action: () => void
  type?: 'wrap' | 'insert'
}

export function MarkdownToolbar({ onInsert, onImageInsert, disabled = false }: MarkdownToolbarProps) {
  const tools: ToolItem[] = [
    {
      icon: Bold,
      label: '太字',
      action: () => onInsert('**', 'wrap'),
      type: 'wrap'
    },
    {
      icon: Italic,
      label: '斜体',
      action: () => onInsert('*', 'wrap'),
      type: 'wrap'
    },
    {
      icon: Heading1,
      label: '見出し1',
      action: () => onInsert('\n# ', 'insert')
    },
    {
      icon: Heading2,
      label: '見出し2',
      action: () => onInsert('\n## ', 'insert')
    },
    {
      icon: Link2,
      label: 'リンク',
      action: () => onInsert('[テキスト](URL)', 'insert')
    },
    {
      icon: Code,
      label: 'インラインコード',
      action: () => onInsert('`', 'wrap'),
      type: 'wrap'
    },
    {
      icon: List,
      label: '箇条書きリスト',
      action: () => onInsert('\n- ', 'insert')
    },
    {
      icon: ListOrdered,
      label: '番号付きリスト',
      action: () => onInsert('\n1. ', 'insert')
    },
    {
      icon: Quote,
      label: '引用',
      action: () => onInsert('\n> ', 'insert')
    },
    {
      icon: Image,
      label: '画像',
      action: () => onImageInsert ? onImageInsert() : onInsert('![alt](URL)', 'insert')
    },
    {
      icon: Table,
      label: 'テーブル',
      action: () => onInsert('\n| 列1 | 列2 | 列3 |\n|-----|-----|-----|\n| データ1 | データ2 | データ3 |\n', 'insert')
    },
    {
      icon: Minus,
      label: '水平線',
      action: () => onInsert('\n---\n', 'insert')
    }
  ]

  // ツールをグループ分け
  const basicTools = tools.slice(0, 2) // 太字、斜体
  const headingTools = tools.slice(2, 4) // 見出し
  const linkCodeTools = tools.slice(4, 6) // リンク、コード
  const listTools = tools.slice(6, 8) // リスト
  const advancedTools = tools.slice(8) // 引用、画像、テーブル、水平線

  const renderToolGroup = (groupTools: ToolItem[]) => (
    groupTools.map((tool, index) => (
      <Button
        key={`${tool.label}-${index}`}
        type="button"
        variant="ghost"
        size="sm"
        onClick={tool.action}
        disabled={disabled}
        className="h-8 w-8 p-0 hover:bg-muted"
        title={tool.label}
      >
        <tool.icon className="h-4 w-4" />
      </Button>
    ))
  )

  return (
    <div className="flex items-center gap-1 px-3 py-2 border-b bg-muted/30 overflow-x-auto">
      {/* 基本フォーマット */}
      {renderToolGroup(basicTools)}
      
      <Separator orientation="vertical" className="h-6 mx-1" />
      
      {/* 見出し */}
      {renderToolGroup(headingTools)}
      
      <Separator orientation="vertical" className="h-6 mx-1" />
      
      {/* リンク・コード */}
      {renderToolGroup(linkCodeTools)}
      
      <Separator orientation="vertical" className="h-6 mx-1" />
      
      {/* リスト */}
      {renderToolGroup(listTools)}
      
      <Separator orientation="vertical" className="h-6 mx-1" />
      
      {/* 高度な機能 */}
      {renderToolGroup(advancedTools)}
    </div>
  )
}