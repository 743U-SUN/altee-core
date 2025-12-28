import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { DeviceCategoryWithAttributes } from '@/types/device'
import type { CategoryAttribute } from '@prisma/client'

interface DeviceAttributeFieldsProps {
  selectedCategory: DeviceCategoryWithAttributes | null
  attributes: { [key: string]: string }
  onAttributeChange: (attributeId: string, value: string) => void
}

export function DeviceAttributeFields({
  selectedCategory,
  attributes,
  onAttributeChange
}: DeviceAttributeFieldsProps) {
  if (!selectedCategory?.attributes || selectedCategory.attributes.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{selectedCategory.name}の詳細属性</CardTitle>
        <CardDescription>任意項目です。分かる範囲で入力してください。</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {selectedCategory.attributes.map((attr: CategoryAttribute) => (
            <div key={attr.id} className="space-y-2">
              <Label>
                {attr.name}
                {attr.unit && <span className="text-muted-foreground"> ({attr.unit})</span>}
              </Label>

              {attr.type === 'SELECT' ? (
                <Select
                  onValueChange={(value) => onAttributeChange(attr.id, value)}
                  value={attributes[attr.id] || ''}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    {attr.options && Array.isArray(attr.options)
                      ? (attr.options as string[])
                          .filter((option: unknown): option is string => typeof option === 'string')
                          .map((option: string) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))
                      : null
                    }
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type={attr.type === 'NUMBER' ? 'number' : 'text'}
                  placeholder={`${attr.name}を入力`}
                  value={attributes[attr.id] || ''}
                  onChange={(e) => onAttributeChange(attr.id, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
