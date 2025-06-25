import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { SetupForm } from './setup-form';

export default async function SetupPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/auth/signin');
  }

  // 既にセットアップ完了している場合はdashboardにリダイレクト
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { 
      handle: true, 
      characterName: true, 
      role: true 
    },
  });

  if (!user) {
    redirect('/auth/signin');
  }

  // USER/ADMIN Role でハンドルが設定済みの場合、または GUEST でキャラクター名が設定済みの場合
  if (((user.role === 'USER' || user.role === 'ADMIN') && user.handle) || (user.role === 'GUEST' && user.characterName)) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            アカウントセットアップ
          </h1>
          <p className="text-muted-foreground">
            アカウントの設定を完了してください
          </p>
        </div>
        
        <SetupForm 
          initialCharacterName={user.characterName || ''}
          initialRole={user.role}
        />
      </div>
    </div>
  );
}