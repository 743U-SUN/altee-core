"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Share2, ChevronDown, HelpCircle, Settings } from "lucide-react";

export const runtime = "edge";

/**
 * Claymorphic Theme Variables
 * Copied from app/demo/items/page.tsx to ensure consistency
 */
const themeStyle = {
    "--theme-bg": "#e8e4df",
    "--theme-card-bg": "#e8e4df",
    "--theme-card-shadow":
        "8px 8px 16px #c5c2bd, -8px -8px 16px #ffffff, inset 2px 2px 4px rgba(255,255,255,0.6)",
    "--theme-card-border": "none",
    "--theme-card-radius": "24px",
    "--theme-text-primary": "#3d3a36",
    "--theme-text-secondary": "#7a756e",
    "--theme-text-accent": "#b07d4f",
    "--theme-accent-bg": "rgba(176,125,79,0.12)",
    "--theme-accent-border": "rgba(176,125,79,0.2)",
    "--theme-stat-bg": "#ddd9d4",
} as React.CSSProperties;

/**
 * FAQ Data Type
 */
type FAQItem = {
    id: string;
    question: string;
    answer: string;
};

type FAQCategory = {
    id: string;
    title: string;
    icon: React.ReactNode;
    items: FAQItem[];
};

/**
 * Mock Data for FAQs
 */
const faqCategories: FAQCategory[] = [
    {
        id: "cat1",
        title: "サービス全般について",
        icon: <HelpCircle className="w-5 h-5" />,
        items: [
            {
                id: "q1-1",
                question: "Alteeとはどのようなサービスですか？",
                answer: "Alteeは、あなたの「好き」を形にするクリエイティブプラットフォームです。直感的な操作で、誰でも簡単にポートフォリオや自己紹介ページを作成できます。また、強力なAIサポート機能により、アイデアを素早く具現化することが可能です。",
            },
            {
                id: "q1-2",
                question: "無料で利用できますか？",
                answer: "はい、基本的な機能はすべて無料でご利用いただけます。より高度なカスタマイズや独自ドメインの使用、解析機能などを利用したい場合は、Proプランへのアップグレードをおすすめします。",
            },
            {
                id: "q1-3",
                question: "スマートフォンでも編集できますか？",
                answer: "もちろんです。AlteeはPC、タブレット、スマートフォン、あらゆるデバイスに最適化されています。外出先でも手軽にページの更新や管理を行うことができます。",
            },
        ],
    },
    {
        id: "cat2",
        title: "アカウントと設定",
        icon: <Settings className="w-5 h-5" />,
        items: [
            {
                id: "q2-1",
                question: "パスワードを忘れました",
                answer: "ログイン画面の「パスワードをお忘れの方」リンクから、登録メールアドレスを入力して再設定手続きを行ってください。数分以内に再設定用のURLをお送りします。",
            },
            {
                id: "q2-2",
                question: "退会方法を教えてください",
                answer: "アカウント設定ページの最下部にある「アカウントの削除」ボタンから退会手続きが可能です。退会すると、作成したすべてのデータが完全に削除され、復元することはできませんのでご注意ください。",
            },
            {
                id: "q2-3",
                question: "通知設定を変更したいです",
                answer: "マイページの「設定」＞「通知設定」から、メール通知やプッシュ通知のオン・オフを個別に切り替えることができます。必要な情報だけを受け取るようにカスタマイズしましょう。",
            },
        ],
    },
];

/**
 * Accordion Component
 */
function Accordion({ item }: { item: FAQItem }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border-b border-[var(--theme-accent-border)] last:border-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full text-left py-4 px-2 flex justify-between items-center group transition-colors hover:text-[var(--theme-text-accent)]"
            >
                <span className="font-bold text-[var(--theme-text-primary)] group-hover:text-[var(--theme-text-accent)] text-sm sm:text-base pr-4">
                    Q. {item.question}
                </span>
                <span className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""} text-[var(--theme-text-secondary)]`}>
                    <ChevronDown className="w-5 h-5" />
                </span>
            </button>
            <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-96 opacity-100 pb-4" : "max-h-0 opacity-0"}`}
            >
                <div className="px-4 py-2 bg-[var(--theme-accent-bg)] rounded-xl text-sm leading-relaxed text-[var(--theme-text-secondary)]">
                    <span className="font-bold text-[var(--theme-text-accent)] mr-2">A.</span>
                    {item.answer}
                </div>
            </div>
        </div>
    );
}

export default function FAQPage() {
    return (
        <div
            className="min-h-screen p-4 sm:p-8 font-sans"
            style={{
                background: "var(--theme-bg)",
                color: "var(--theme-text-primary)",
                ...themeStyle,
            }}
        >
            <div className="max-w-[760px] mx-auto space-y-8">
                {/* 1. Profile / Header Card */}
                {/* Copied from App/demo/items/page.tsx for consistency */}
                <header className="clay-card p-6 flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full overflow-hidden clay-inset border-2 border-white/50 relative shrink-0">
                                <Image
                                    src="https://placehold.co/150x150/3d3a36/ffffff?text=User"
                                    alt="User Avatar"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-[var(--theme-text-primary)]">
                                    Shadow Walker
                                </h1>
                                <p className="text-sm text-[var(--theme-text-secondary)]">
                                    Digital Nomad & Tech Enthusiast
                                </p>
                            </div>
                        </div>
                        <button className="p-3 rounded-full clay-button text-[var(--theme-text-accent)]">
                            <Share2 className="w-5 h-5" />
                        </button>
                    </div>

                    <div>
                        <p className="text-sm text-[var(--theme-text-primary)] mt-2 leading-relaxed">
                            こんにちは！FAQページへようこそ。<br />
                            ここでは、よくある質問とその回答をまとめています。<br />
                            お探しの情報が見つからない場合は、お気軽にお問い合わせください。
                        </p>
                    </div>
                </header>

                {/* 2. FAQ Categories */}
                <main className="space-y-8">
                    {faqCategories.map((category) => (
                        <section key={category.id} className="clay-card p-6">
                            {/* Category Header */}
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[var(--theme-accent-border)]">
                                <div className="p-3 rounded-full clay-inset text-[var(--theme-text-accent)] shrink-0">
                                    {category.icon}
                                </div>
                                <h2 className="text-xl font-bold text-[var(--theme-text-primary)]">
                                    {category.title}
                                </h2>
                            </div>

                            {/* Accordion Items */}
                            <div className="space-y-1">
                                {category.items.map((item) => (
                                    <Accordion key={item.id} item={item} />
                                ))}
                            </div>
                        </section>
                    ))}
                </main>

                {/* Footer simple space */}
                <div className="h-12" />
            </div>

            {/* Global Styles for Claymorphic Effects */}
            <style jsx global>{`
                .clay-card {
                    background: var(--theme-card-bg);
                    box-shadow: var(--theme-card-shadow);
                    border-radius: var(--theme-card-radius);
                }
                .clay-inset {
                    box-shadow: inset 2px 2px 5px #babecc, inset -5px -5px 10px #ffffff;
                }
                .clay-button {
                    background: var(--theme-card-bg);
                    box-shadow: 6px 6px 12px #babecc, -6px -6px 12px #ffffff;
                    transition: all 0.2s ease-in-out;
                }
                .clay-button:active {
                    box-shadow: inset 2px 2px 5px #babecc, inset -5px -5px 10px #ffffff;
                }
            `}</style>
        </div>
    );
}
