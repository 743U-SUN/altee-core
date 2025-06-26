export default async function HandlePage({ 
  params 
}: { 
  params: Promise<{ handle: string }> 
}) {
  const { handle } = await params
  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-4">@{handle}</h1>
        <p className="text-muted-foreground">
          This is the profile page for user: {handle}
        </p>
      </div>
      
      <div className="bg-card rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">User Content</h2>
        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <p>Sample post content 1</p>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <p>Sample post content 2</p>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <p>Sample post content 3</p>
          </div>
        </div>
      </div>
    </div>
  )
}