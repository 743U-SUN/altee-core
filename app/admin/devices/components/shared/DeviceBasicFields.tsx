import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { UseFormRegister, FieldErrors, UseFormSetValue } from 'react-hook-form'
import type { DeviceCategoryWithAttributes } from '@/types/device'

interface DeviceBasicFieldsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: UseFormRegister<any>
  errors: FieldErrors
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setValue: UseFormSetValue<any>
  categories: DeviceCategoryWithAttributes[]
  watchedCategoryId?: string
}

export function DeviceBasicFields({
  register,
  errors,
  setValue,
  categories,
  watchedCategoryId
}: DeviceBasicFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">デバイス名</Label>
          <Input {...register('name')} placeholder="マウス名など" />
          {errors.name && (
            <p className="text-sm text-destructive">{String(errors.name.message)}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="categoryId">カテゴリ</Label>
          <Select
            onValueChange={(value) => setValue('categoryId', value)}
            value={watchedCategoryId || ''}
          >
            <SelectTrigger>
              <SelectValue placeholder="カテゴリを選択" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.categoryId && (
            <p className="text-sm text-destructive">{String(errors.categoryId.message)}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">説明（任意）</Label>
        <Textarea {...register('description')} placeholder="デバイスの詳細説明" />
      </div>
    </>
  )
}
