import type { Metadata } from "next"
import { CreateManagedProfileForm } from "../components/CreateManagedProfileForm"

export const metadata: Metadata = {
  title: "新規公式プロフィール作成",
  robots: { index: false, follow: false },
}

export default function NewManagedProfilePage() {
  return (
    <div className="container mx-auto p-6 flex flex-col gap-6">
      <h1 className="text-3xl font-bold">新規公式プロフィール作成</h1>
      <CreateManagedProfileForm />
    </div>
  )
}
