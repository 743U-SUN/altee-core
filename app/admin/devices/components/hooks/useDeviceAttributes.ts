import { useState, useCallback } from 'react'

export function useDeviceAttributes(initialAttributes?: { [key: string]: string }) {
  const [attributes, setAttributes] = useState<{ [key: string]: string }>(
    initialAttributes || {}
  )

  const handleAttributeChange = useCallback((attributeId: string, value: string) => {
    setAttributes(prev => ({
      ...prev,
      [attributeId]: value
    }))
  }, [])

  const resetAttributes = useCallback(() => {
    setAttributes({})
  }, [])

  return {
    attributes,
    handleAttributeChange,
    resetAttributes
  }
}
