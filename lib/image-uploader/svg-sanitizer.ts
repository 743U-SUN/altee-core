/**
 * 環境に応じてDOMPurifyインスタンスを取得（動的import）
 */
async function getDOMPurify() {
  if (typeof window !== 'undefined') {
    // ブラウザ環境
    const createDOMPurify = (await import('dompurify')).default
    return createDOMPurify(window)
  } else {
    // Node.js環境
    const { JSDOM } = await import('jsdom')
    const createDOMPurify = (await import('dompurify')).default
    const jsdomWindow = new JSDOM('').window
    return createDOMPurify(jsdomWindow as unknown as Window & typeof globalThis)
  }
}

// SVGサニタイズ設定
const SVG_SANITIZE_CONFIG = {
  // 許可するタグ
  ALLOWED_TAGS: [
    'svg', 'g', 'path', 'circle', 'ellipse', 'line', 'rect', 'polyline', 'polygon',
    'text', 'tspan', 'defs', 'clipPath', 'mask', 'pattern', 'image', 'switch',
    'foreignObject', 'linearGradient', 'radialGradient', 'stop', 'use', 'symbol',
    'marker', 'title', 'desc', 'metadata'
  ],
  
  // 許可する属性
  ALLOWED_ATTR: [
    'viewBox', 'width', 'height', 'x', 'y', 'cx', 'cy', 'r', 'rx', 'ry',
    'x1', 'y1', 'x2', 'y2', 'points', 'd', 'fill', 'stroke', 'stroke-width',
    'stroke-linecap', 'stroke-linejoin', 'stroke-dasharray', 'stroke-dashoffset',
    'opacity', 'fill-opacity', 'stroke-opacity', 'transform', 'id', 'class',
    'clip-path', 'mask', 'marker-start', 'marker-mid', 'marker-end',
    'gradientUnits', 'gradientTransform', 'offset', 'stop-color', 'stop-opacity',
    'href', 'xlink:href', 'xmlns', 'xmlns:xlink', 'version', 'preserveAspectRatio'
  ],
  
  // 危険な属性をブロック
  FORBID_ATTR: [
    'onload', 'onerror', 'onclick', 'onmouseover', 'onmouseout', 'onmousedown',
    'onmouseup', 'onmousemove', 'onmouseenter', 'onmouseleave', 'onkeydown',
    'onkeyup', 'onkeypress', 'onfocus', 'onblur', 'onchange', 'onsubmit',
    'onreset', 'onscroll', 'onresize', 'onunload', 'onbeforeunload'
  ],
  
  // 危険なタグをブロック
  FORBID_TAGS: ['script', 'object', 'embed', 'iframe', 'frame', 'frameset', 'applet'],
  
  // URLスキームの制限
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  
  USE_PROFILES: { svg: true, svgFilters: true }
}

/**
 * SVGファイルの内容をサニタイズ
 */
export async function sanitizeSVG(svgContent: string): Promise<{ success: boolean; sanitized?: string; error?: string }> {
  try {
    // DOMPurifyインスタンスを取得
    const domPurify = await getDOMPurify()
    
    // DOMPurifyでサニタイズ
    const sanitized = domPurify.sanitize(svgContent, SVG_SANITIZE_CONFIG)
    
    // サニタイズ後に空になった場合はエラー
    if (!sanitized || sanitized.trim().length === 0) {
      return {
        success: false,
        error: 'SVGファイルが無効または危険なコンテンツを含んでいます'
      }
    }
    
    // SVGタグが含まれているかチェック
    if (!sanitized.includes('<svg')) {
      return {
        success: false,
        error: 'SVGファイルが無効です'
      }
    }
    
    return {
      success: true,
      sanitized
    }
    
  } catch (error) {
    return {
      success: false,
      error: `SVGサニタイズエラー: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * SVGファイルをサニタイズしてFileオブジェクトを返す
 */
export async function sanitizeSVGFile(file: File): Promise<{ success: boolean; sanitizedFile?: File; error?: string }> {
  try {
    // ファイル内容を読み取り
    const content = await file.text()
    
    // サニタイズ
    const result = await sanitizeSVG(content)
    
    if (!result.success) {
      return {
        success: false,
        error: result.error
      }
    }
    
    // サニタイズされた内容で新しいFileオブジェクトを作成
    const sanitizedFile = new File(
      [result.sanitized!],
      file.name,
      {
        type: 'image/svg+xml',
        lastModified: Date.now()
      }
    )
    
    return {
      success: true,
      sanitizedFile
    }
    
  } catch (error) {
    return {
      success: false,
      error: `SVGファイル処理エラー: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * SVGの危険なパターンをチェック
 */
export function checkSVGSafety(svgContent: string): { isSafe: boolean; warnings: string[] } {
  const warnings: string[] = []
  const content = svgContent.toLowerCase()
  
  // JavaScriptの検出
  if (content.includes('javascript:') || content.includes('<script')) {
    warnings.push('JavaScriptコードが検出されました')
  }
  
  // 外部リソースの検出
  if (content.includes('data:') && content.includes('base64')) {
    warnings.push('Base64エンコードされたデータが含まれています')
  }
  
  // イベントハンドラーの検出
  const eventHandlers = ['onload', 'onerror', 'onclick', 'onmouseover']
  eventHandlers.forEach(handler => {
    if (content.includes(handler)) {
      warnings.push(`イベントハンドラー(${handler})が検出されました`)
    }
  })
  
  return {
    isSafe: warnings.length === 0,
    warnings
  }
}