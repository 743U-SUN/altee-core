import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DeviceImage } from '@/components/devices/device-image'
import type { UseFormRegister, FieldErrors } from 'react-hook-form'

interface CustomImageSectionProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: UseFormRegister<any>
  errors: FieldErrors
  customImageUrl?: string
  customImagePreview: string | null
  isLoadingCustomImage: boolean
  onValidate: () => void
}

export function CustomImageSection({
  register,
  errors,
  customImageUrl,
  customImagePreview,
  isLoadingCustomImage,
  onValidate
}: CustomImageSectionProps) {
  return (
    <>
      {/* カスタム画像URL */}
      <div className="space-y-2">
        <Label htmlFor="customImageUrl">カスタム画像URL（オプション）</Label>
        <div className="flex space-x-2">
          <Input
            {...register('customImageUrl')}
            placeholder="https://example.com/image.jpg"
            className="flex-1"
          />
          <Button
            type="button"
            onClick={onValidate}
            disabled={isLoadingCustomImage || !customImageUrl}
            variant="outline"
          >
            {isLoadingCustomImage ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              '確認'
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Amazon画像が存在しない場合や、別の画像を使用したい場合に指定してください。
        </p>
        {errors.customImageUrl && (
          <p className="text-sm text-destructive">{String(errors.customImageUrl.message)}</p>
        )}
      </div>

      {/* カスタム画像プレビュー */}
      {customImagePreview && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">カスタム画像プレビュー</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <DeviceImage
              customImageUrl={customImagePreview}
              alt="カスタム画像プレビュー"
              width={200}
              height={200}
              className="flex-shrink-0"
            />
          </CardContent>
        </Card>
      )}
    </>
  )
}
