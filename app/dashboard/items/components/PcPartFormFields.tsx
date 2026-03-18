'use client'

import type { Control } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { PC_PART_TYPES, pcPartTypeLabels } from '@/lib/validations/pc-build'
import type { PcPartInput } from '@/lib/validations/pc-build'

interface PcPartFormFieldsProps {
  control: Control<PcPartInput>
}

export function PcPartFormFields({ control }: PcPartFormFieldsProps) {
  return (
    <>
      <FormField
        control={control}
        name="partType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>パーツ種別</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="種別を選択" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {PC_PART_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {pcPartTypeLabels[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>パーツ名 *</FormLabel>
            <FormControl>
              <Input placeholder="例: Ryzen 9 5950X" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="price"
        render={({ field }) => (
          <FormItem>
            <FormLabel>購入価格（円）</FormLabel>
            <FormControl>
              <Input
                type="number"
                placeholder="例: 79800"
                {...field}
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="amazonUrl"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Amazon URL</FormLabel>
            <FormControl>
              <Input placeholder="https://www.amazon.co.jp/dp/..." {...field} value={field.value ?? ''} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="memo"
        render={({ field }) => (
          <FormItem>
            <FormLabel>メモ</FormLabel>
            <FormControl>
              <Textarea
                placeholder="使用感やコメント..."
                className="min-h-[80px]"
                {...field}
                value={field.value ?? ''}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  )
}
