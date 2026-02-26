"use client"

import { useState } from "react"
import { Monitor, Phone } from "lucide-react"
import { THEME_PRESETS } from "@/lib/theme-presets"
import { ThemedCard } from "@/components/sections/_shared/ThemedCard"

// テーマの型定義（一時的）
type ThemeId = "claymorphic" | "minimal"

export default function DesignCatalogPage() {
    const [activeTheme, setActiveTheme] = useState<ThemeId>("claymorphic")
    const [previewWidth, setPreviewWidth] = useState<"large" | "medium">("large")

    // 選択されたテーマの変数を取得
    const themeVariables = THEME_PRESETS[activeTheme]?.variables || THEME_PRESETS.claymorphic.variables

    return (
        <div className="flex h-screen w-full flex-col bg-zinc-100">
            {/* 画面上部: コントロールパネル */}
            <header className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-zinc-800">UI Catalog (Design System test)</h1>
                    {/* テーマ切り替え */}
                    <div className="flex items-center gap-2 rounded-lg bg-zinc-100 p-1">
                        <button
                            onClick={() => setActiveTheme("claymorphic")}
                            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${activeTheme === "claymorphic" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                                }`}
                        >
                            Claymorphic
                        </button>
                        <button
                            onClick={() => setActiveTheme("minimal")}
                            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${activeTheme === "minimal" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                                }`}
                        >
                            Minimal
                        </button>
                    </div>
                </div>

                {/* プレビュー幅の切り替え */}
                <div className="flex items-center gap-2 rounded-lg bg-zinc-100 p-1">
                    <button
                        onClick={() => setPreviewWidth("large")}
                        className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${previewWidth === "large" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                            }`}
                    >
                        <Monitor className="h-4 w-4" />
                        Large (1200px)
                    </button>
                    <button
                        onClick={() => setPreviewWidth("medium")}
                        className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${previewWidth === "medium" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                            }`}
                    >
                        <Phone className="h-4 w-4" />
                        Medium (720px)
                    </button>
                </div>
            </header>

            {/* 画面下部: プレビューエリア */}
            <main
                className="flex-1 overflow-y-auto p-4 transition-colors duration-300"
                style={{ backgroundColor: "var(--theme-bg)", ...themeVariables }} // ルートの背景色を適用
            >
                <div
                    className={`mx-auto flex flex-col gap-8 transition-all duration-300 ${previewWidth === "large" ? "max-w-[1200px]" : "max-w-[720px]"
                        }`}
                >
                    {/* Typograhy Section */}
                    <section className="space-y-4">
                        <h2 className="border-b border-black/10 pb-2 text-2xl font-bold" style={{ color: "var(--theme-text-primary)" }}>
                            1. Typography & Colors
                        </h2>
                        <ThemedCard className="space-y-4">
                            <h1 className="text-3xl font-bold" style={{ color: "var(--theme-text-primary)" }}>
                                Heading 1 (Primary Text)
                            </h1>
                            <h2 className="text-2xl font-semibold" style={{ color: "var(--theme-text-primary)" }}>
                                Heading 2
                            </h2>
                            <h3 className="text-xl font-medium" style={{ color: "var(--theme-text-secondary)" }}>
                                Heading 3 (Secondary Text)
                            </h3>
                            <p style={{ color: "var(--theme-text-secondary)" }}>
                                This is normal paragraph text. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
                                tempor incididunt ut labore et dolore magna aliqua.
                            </p>
                            <div className="flex items-center gap-2">
                                <span className="font-medium" style={{ color: "var(--theme-text-accent)" }}>
                                    Accent Color Text
                                </span>
                                <span
                                    className="rounded-full px-3 py-1 text-sm text-white"
                                    style={{ backgroundColor: "var(--theme-text-accent)" }}
                                >
                                    Accent Badge
                                </span>
                            </div>
                        </ThemedCard>
                    </section>

                    {/* Cards & Containers Section */}
                    <section className="space-y-4">
                        <h2 className="border-b border-black/10 pb-2 text-2xl font-bold" style={{ color: "var(--theme-text-primary)" }}>
                            2. Cards & Containers
                        </h2>
                        <div className="grid gap-4 md:grid-cols-2">
                            <ThemedCard className="flex flex-col gap-4">
                                <h3 className="text-lg font-bold" style={{ color: "var(--theme-text-primary)" }}>
                                    Standard Card
                                </h3>
                                <p style={{ color: "var(--theme-text-secondary)" }}>
                                    A basic container using var(--theme-card-bg) and var(--theme-card-shadow).
                                </p>
                            </ThemedCard>

                            <div
                                className="flex flex-col gap-4 p-6"
                                style={{
                                    backgroundColor: "var(--theme-stat-bg)",
                                    borderRadius: "var(--theme-card-radius)",
                                    boxShadow: "var(--theme-stat-shadow)",
                                    border: "var(--theme-stat-border, none)",
                                }}
                            >
                                <h3 className="text-lg font-bold" style={{ color: "var(--theme-text-primary)" }}>
                                    Stat Card / Alternate
                                </h3>
                                <p style={{ color: "var(--theme-text-secondary)" }}>
                                    Using var(--theme-stat-bg) for secondary containers.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* List & Accordion Mock Section */}
                    <section className="space-y-4">
                        <h2 className="border-b border-black/10 pb-2 text-2xl font-bold" style={{ color: "var(--theme-text-primary)" }}>
                            3. Lists & Accordions
                        </h2>
                        <ThemedCard className="flex flex-col gap-2 p-0 overflow-hidden">
                            {/* List Item 1 */}
                            <div className="flex items-center justify-between border-b p-4 transition-colors hover:bg-black/5" style={{ borderColor: "var(--theme-accent-border)" }}>
                                <span className="font-medium" style={{ color: "var(--theme-text-primary)" }}>List Item / Accordion Header 1</span>
                                <span style={{ color: "var(--theme-text-secondary)" }}>+</span>
                            </div>
                            {/* List Item 2 */}
                            <div className="flex items-center justify-between border-b p-4 transition-colors hover:bg-black/5" style={{ borderColor: "var(--theme-accent-border)" }}>
                                <span className="font-medium" style={{ color: "var(--theme-text-primary)" }}>List Item / Accordion Header 2</span>
                                <span style={{ color: "var(--theme-text-secondary)" }}>+</span>
                            </div>
                            {/* List Item 3 (Expanded Style Mock) */}
                            <div className="flex flex-col border-b" style={{ borderColor: "var(--theme-accent-border)" }}>
                                <div className="flex items-center justify-between p-4" style={{ backgroundColor: "var(--theme-accent-bg)" }}>
                                    <span className="font-bold" style={{ color: "var(--theme-text-accent)" }}>List Item / Accordion Header 3 (Expanded)</span>
                                    <span style={{ color: "var(--theme-text-accent)" }}>-</span>
                                </div>
                                <div className="p-4" style={{ color: "var(--theme-text-secondary)" }}>
                                    This is the expanded content area for the accordion. It uses secondary text colors and is visually distinct.
                                </div>
                            </div>
                        </ThemedCard>
                    </section>
                </div>
            </main>
        </div>
    )
}
