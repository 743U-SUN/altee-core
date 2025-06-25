'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { userSetupSchema, type UserSetupSchema } from '@/lib/validation/user-setup';
import { completeUserSetup, checkHandleAvailability } from './actions';
import { UserRole } from '@prisma/client';
import type { UserRoleSchema } from '@/lib/validation/user-setup';

interface SetupFormProps {
  initialCharacterName: string;
  initialRole: UserRole;
}

export function SetupForm({ initialCharacterName, initialRole }: SetupFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [handleCheckStatus, setHandleCheckStatus] = useState<'idle' | 'checking' | 'available' | 'unavailable'>('idle');
  const [handleError, setHandleError] = useState<string>('');
  const [submitError, setSubmitError] = useState<string>('');
  
  const form = useForm<UserSetupSchema>({
    resolver: zodResolver(userSetupSchema),
    defaultValues: {
      characterName: initialCharacterName,
      role: (initialRole === 'ADMIN' ? 'USER' : initialRole) as UserRoleSchema,
      handle: '',
    },
  });

  const watchedRole = form.watch('role');
  const watchedHandle = form.watch('handle');

  // Handle重複チェック
  useEffect(() => {
    if (watchedRole === 'USER' && watchedHandle && watchedHandle.length >= 3) {
      const timeoutId = setTimeout(async () => {
        setHandleCheckStatus('checking');
        setHandleError('');
        
        try {
          const result = await checkHandleAvailability(watchedHandle);
          
          if (result.success && result.data?.available) {
            setHandleCheckStatus('available');
          } else {
            setHandleCheckStatus('unavailable');
            setHandleError(result.data?.error || 'このハンドルは使用できません');
          }
        } catch {
          setHandleCheckStatus('unavailable');
          setHandleError('ハンドルの確認中にエラーが発生しました');
        }
      }, 500); // 500ms のデバウンス

      return () => clearTimeout(timeoutId);
    } else {
      setHandleCheckStatus('idle');
      setHandleError('');
    }
  }, [watchedHandle, watchedRole]);

  const onSubmit = async (data: UserSetupSchema) => {
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const result = await completeUserSetup(data);
      
      if (result.success) {
        router.push('/dashboard');
        router.refresh();
      } else {
        setSubmitError(result.error || 'セットアップ中にエラーが発生しました');
      }
    } catch {
      setSubmitError('セットアップ中にエラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getHandleStatusIcon = () => {
    switch (handleCheckStatus) {
      case 'checking':
        return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
      case 'available':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'unavailable':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>プロフィール設定</CardTitle>
        <CardDescription>
          アカウントタイプとプロフィール情報を設定してください
          {initialRole === 'ADMIN' && (
            <span className="block mt-2 text-sm text-blue-600">
              管理者アカウントでも個別ページを作成できます
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* アカウントタイプ選択 */}
          <div className="space-y-3">
            <Label className="text-base font-medium">アカウントタイプ</Label>
            <RadioGroup
              value={form.getValues('role')}
              onValueChange={(value) => form.setValue('role', value as UserRoleSchema)}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="USER" id="user" />
                <Label htmlFor="user" className="cursor-pointer">
                  ユーザー（個別ページ作成・フル機能利用）
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="GUEST" id="guest" />
                <Label htmlFor="guest" className="cursor-pointer">
                  ゲスト（基本機能のみ利用）
                </Label>
              </div>
            </RadioGroup>
            {form.formState.errors.role && (
              <p className="text-sm text-red-600">{form.formState.errors.role.message}</p>
            )}
          </div>

          {/* キャラクター名入力 */}
          <div className="space-y-2">
            <Label htmlFor="characterName">キャラクター名</Label>
            <Input
              id="characterName"
              {...form.register('characterName')}
              placeholder="表示名を入力してください"
            />
            {form.formState.errors.characterName && (
              <p className="text-sm text-red-600">{form.formState.errors.characterName.message}</p>
            )}
          </div>

          {/* ハンドル入力（USERの場合のみ） */}
          {watchedRole === 'USER' && (
            <div className="space-y-2">
              <Label htmlFor="handle">ハンドル（個別ページURL用）</Label>
              <div className="relative">
                <Input
                  id="handle"
                  {...form.register('handle')}
                  placeholder="3-20文字の英数字、アンダースコア、ハイフン"
                  className="pr-10"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  {getHandleStatusIcon()}
                </div>
              </div>
              {form.formState.errors.handle && (
                <p className="text-sm text-red-600">{form.formState.errors.handle.message}</p>
              )}
              {handleError && (
                <p className="text-sm text-red-600">{handleError}</p>
              )}
              {handleCheckStatus === 'available' && (
                <p className="text-sm text-green-600">このハンドルは利用可能です</p>
              )}
              <p className="text-xs text-muted-foreground">
                個別ページのURL: {typeof window !== 'undefined' && window.location.origin}/{watchedHandle || 'your-handle'}
              </p>
            </div>
          )}

          {/* エラー表示 */}
          {submitError && (
            <Alert>
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          {/* 送信ボタン */}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={
              isSubmitting || 
              (watchedRole === 'USER' && handleCheckStatus !== 'available')
            }
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                設定中...
              </>
            ) : (
              'セットアップを完了'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}