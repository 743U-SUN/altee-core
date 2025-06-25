import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

interface SetupCheckerProps {
  children: React.ReactNode;
}

export async function SetupChecker({ children }: SetupCheckerProps) {
  const session = await auth();
  
  if (!session?.user) {
    return children; // 認証チェックは親で行われる
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { 
      handle: true, 
      characterName: true, 
      role: true 
    },
  });

  if (user) {
    // セットアップ未完了の場合はsetupページにリダイレクト
    const isSetupIncomplete = 
      !user.characterName || 
      ((user.role === 'USER' || user.role === 'ADMIN') && !user.handle);
      
    if (isSetupIncomplete) {
      redirect('/dashboard/setup');
    }
  }

  return <>{children}</>;
}