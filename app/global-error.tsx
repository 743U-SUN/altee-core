'use client'

import { useEffect } from 'react'

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('Global error boundary caught:', error)
    }, [error])

    return (
        <html lang="ja">
            <body>
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1rem',
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                }}>
                    <div style={{
                        maxWidth: '28rem',
                        width: '100%',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2rem'
                    }}>
                        <div>
                            <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                                エラーが発生しました
                            </h1>
                            <h2 style={{ fontSize: '1.25rem', color: '#6b7280' }}>
                                Something went wrong
                            </h2>
                        </div>

                        {process.env.NODE_ENV === 'development' && (
                            <div style={{
                                padding: '1rem',
                                backgroundColor: '#f3f4f6',
                                borderRadius: '0.5rem',
                                textAlign: 'left'
                            }}>
                                <p style={{
                                    fontSize: '0.875rem',
                                    fontFamily: 'monospace',
                                    color: '#dc2626',
                                    wordBreak: 'break-all'
                                }}>
                                    {error.message}
                                </p>
                                {error.digest && (
                                    <p style={{
                                        fontSize: '0.75rem',
                                        color: '#9ca3af',
                                        marginTop: '0.5rem'
                                    }}>
                                        Error ID: {error.digest}
                                    </p>
                                )}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button
                                onClick={reset}
                                style={{
                                    padding: '0.5rem 1rem',
                                    backgroundColor: '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.375rem',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                    fontWeight: '500'
                                }}
                            >
                                もう一度試す
                            </button>

                            <button
                                onClick={() => window.location.href = '/'}
                                style={{
                                    padding: '0.5rem 1rem',
                                    backgroundColor: 'white',
                                    color: '#374151',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '0.375rem',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                    fontWeight: '500'
                                }}
                            >
                                ホームへ移動
                            </button>
                        </div>

                        <div style={{
                            paddingTop: '2rem',
                            borderTop: '1px solid #e5e7eb'
                        }}>
                            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                問題が解決しない場合は、ページを再読み込みするか、お問い合わせください。
                            </p>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    )
}
