'use client'

import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"

interface AmazonLinkButtonProps {
  amazonUrl: string
}

export function AmazonLinkButton({ amazonUrl }: AmazonLinkButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => window.open(amazonUrl, '_blank')}
    >
      <ExternalLink className="h-3 w-3" />
    </Button>
  )
}