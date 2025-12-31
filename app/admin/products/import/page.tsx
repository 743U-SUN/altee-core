import { CSVImportForm } from './components/CSVImportForm'

export const metadata = {
  title: 'CSV一括登録 | 管理画面',
  description: 'CSVファイルから商品を一括登録',
}

export default function CSVImportPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">CSV一括登録</h1>
        <p className="mt-2 text-muted-foreground">
          CSVファイルから商品を一括登録します
        </p>
      </div>

      <div className="max-w-4xl space-y-6">
        {/* CSVフォーマット説明 */}
        <div className="rounded-lg border bg-muted/50 p-6">
          <h3 className="mb-4 text-lg font-semibold">CSVフォーマット</h3>
          <div className="space-y-2 text-sm">
            <p>以下のヘッダーを含むCSVファイルをアップロードしてください：</p>
            <pre className="rounded bg-background p-3 font-mono text-xs">
              name,description,categorySlug,brandName,amazonUrl,asin
            </pre>
            <ul className="list-inside list-disc space-y-1 text-muted-foreground">
              <li>
                <strong>name</strong>: 商品名（必須）
              </li>
              <li>
                <strong>description</strong>: 商品説明（オプション）
              </li>
              <li>
                <strong>categorySlug</strong>: カテゴリのslug（必須、事前にカテゴリを作成しておく必要があります）
              </li>
              <li>
                <strong>brandName</strong>: ブランド名（オプション、存在しない場合は自動作成されます）
              </li>
              <li>
                <strong>amazonUrl</strong>: Amazon URL（オプション）
              </li>
              <li>
                <strong>asin</strong>: Amazon ASIN（オプション、10桁の英数字）
              </li>
            </ul>
          </div>
        </div>

        {/* CSVサンプル */}
        <div className="rounded-lg border bg-muted/50 p-6">
          <h3 className="mb-4 text-lg font-semibold">CSVサンプル</h3>
          <pre className="rounded bg-background p-3 font-mono text-xs">
{`name,description,categorySlug,brandName,amazonUrl,asin
Intel Core i9-14900K,第14世代インテルCore i9プロセッサー,cpu,Intel,https://www.amazon.co.jp/dp/...,B0CHBJXXXXX
AMD Ryzen 9 7950X,16コア32スレッドCPU,cpu,AMD,https://www.amazon.co.jp/dp/...,B0BBHXXXXX`}
          </pre>
        </div>

        <CSVImportForm />
      </div>
    </div>
  )
}
