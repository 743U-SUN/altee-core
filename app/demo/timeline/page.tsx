"use client";

import React from "react";
import Image from "next/image";
import { Share2, Star, Heart, Zap, Coffee } from "lucide-react";

export const runtime = "edge";

/**
 * Claymorphic Theme Variables
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
 * Timeline Data Type
 */
type TimelineItem = {
    id: string;
    date: string;
    title: string;
    description: string;
    icon: React.ReactNode;
};

/**
 * Mock Data for Timeline
 */
const timelineData: TimelineItem[] = [
    {
        id: "1",
        date: "2023.01.15",
        title: "プロジェクト始動",
        description: "Alteeの構想が生まれ、最初のプロトタイプ開発に着手しました。クリエイターのための新しい場所を作る旅の始まりです。",
        icon: <Star className="w-5 h-5" />,
    },
    {
        id: "2",
        date: "2023.06.20",
        title: "ベータ版リリース",
        description: "限定ユーザー向けのクローズドベータを開始。多くのフィードバックをいただき、機能改善とUIのブラッシュアップを行いました。",
        icon: <Zap className="w-5 h-5" />,
    },
    {
        id: "3",
        date: "2023.12.01",
        title: "正式サービス開始",
        description: "ついにAlteeを一般公開。多くのクリエイターに参加いただき、コミュニティが急速に拡大しました。",
        icon: <Heart className="w-5 h-5" />,
    },
    {
        id: "4",
        date: "Current",
        title: "さらなる高みへ",
        description: "新機能の開発、モバイルアプリの準備など、Alteeは常に進化を続けています。これからの展開にご期待ください。",
        icon: <Coffee className="w-5 h-5" />,
    },
];

export default function TimelinePage() {
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
                {/* Timeline Section - Wrapped in Clay Card */}
                <main className="clay-card p-6 sm:p-10 relative">
                    {/* Central Vertical Line */}
                    {/* 
                       Mobile Adjustment:
                       - Previous Line: ~49px screen left.
                       - Previous Dot: ~69px screen left.
                       - Padding Main: p-6 (24px).
                       - Line is absolute to Main.
                       - Dot is absolute to Item (child of Main).
                       - To align Line to Dot (69px screen left):
                         - Line needs +20px. 
                         - Previous Line left-[34px].
                         - New Line left-[54px].
                    */}
                    <div
                        className="absolute left-[54px] md:left-1/2 top-10 bottom-10 w-px -ml-px border-l-2 border-dotted border-[var(--theme-text-accent)] opacity-40"
                        aria-hidden="true"
                    />

                    <div className="space-y-12 relative">
                        {timelineData.map((item, index) => {
                            const isRight = index % 2 === 0;

                            return (
                                <div key={item.id} className="flex flex-col md:flex-row items-start w-full relative">

                                    {/* Center Dot */}
                                    {/* Mobile: left-[29px] (relative to Item).
                                        Item is in spacing container in Main (p-6).
                                        24px + 29px = 53px from Main Left.
                                        Line is at 54px from Main Left.
                                        Dot Center (width 12): 53 + 6 = 59px.
                                        Line Center (width ~2): 54 + 1 = 55px.
                                        Close! Maybe Dot left-[30px]? -> 54+6=60. 
                                        Let's stick to left-[29px] for now.
                                    */}
                                    <div className="absolute left-[29px] md:left-1/2 top-[15px] md:-ml-[6px] w-[12px] h-[12px] rounded-full bg-[var(--theme-text-accent)] z-20 shadow-sm ring-4 ring-[var(--theme-card-bg)]" />

                                    {/* Left Side (Desktop Only for odd index) */}
                                    <div className={`w-full md:w-1/2 md:pr-10 ${isRight ? 'hidden md:block md:invisible' : 'hidden md:block'}`}>
                                        <div className="flex flex-col items-end">
                                            {/* Horizontal Line & Icon */}
                                            <div className="flex items-center justify-end w-full mb-2 relative">
                                                {/* Icon */}
                                                <div className="w-10 h-10 rounded-full clay-inset flex items-center justify-center text-[var(--theme-text-accent)] shrink-0 z-10 mr-2 bg-[var(--theme-card-bg)]">
                                                    {item.icon}
                                                </div>
                                                {/* Line */}
                                                <div className="h-[2px] flex-1 bg-[var(--theme-text-accent)] opacity-60 rounded-full relative">
                                                    {/* Date on Line */}
                                                    <span className="absolute -top-6 right-0 font-bold text-[var(--theme-text-accent)] tracking-wider">
                                                        {item.date}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Content Box */}
                                            <div className="w-full text-right hover:scale-[1.01] transition-transform duration-300">
                                                <h3 className="font-bold text-lg text-[var(--theme-text-primary)] mb-1">
                                                    {item.title}
                                                </h3>
                                                <p className="text-sm text-[var(--theme-text-secondary)] leading-relaxed">
                                                    {item.description}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Side (Desktop for even, All for Mobile) */}
                                    {/* Mobile Padding:
                                        - We need to reduce pl-16 to connect to the dot.
                                        - Dot center ~59px from Main Left.
                                        - Current pl-16 = 64px from Item Left (Main Left).
                                        - 64px start is nicely to the right of 59px. 
                                        - Gap = 5px.
                                        - Line starts here.
                                        - Visually: Dot(53..65) ..(Line 64..)..
                                        - They should touch/overlap.
                                        - So pl-12 (48px) should overlap the dot.
                                    */}
                                    <div className={`w-full md:w-1/2 pl-12 md:pl-10 ${!isRight ? 'block md:invisible' : 'block'}`}>
                                        <div className="relative flex flex-col items-start">
                                            {/* Horizontal Line & Icon */}
                                            <div className="flex items-center justify-start w-full mb-2 relative">
                                                {/* Line - Changed w-8 to flex-1 */}
                                                <div className="h-[2px] flex-1 bg-[var(--theme-text-accent)] opacity-60 rounded-full relative">
                                                    {/* Date on Line */}
                                                    <span className="absolute -top-6 left-0 font-bold text-[var(--theme-text-accent)] tracking-wider">
                                                        {item.date}
                                                    </span>
                                                </div>
                                                {/* Icon */}
                                                <div className="w-10 h-10 rounded-full clay-inset flex items-center justify-center text-[var(--theme-text-accent)] shrink-0 z-10 ml-2 bg-[var(--theme-card-bg)]">
                                                    {item.icon}
                                                </div>
                                            </div>

                                            {/* Content Box */}
                                            <div className="w-full text-left hover:scale-[1.01] transition-transform duration-300">
                                                <h3 className="font-bold text-lg text-[var(--theme-text-primary)] mb-1">
                                                    {item.title}
                                                </h3>
                                                <p className="text-sm text-[var(--theme-text-secondary)] leading-relaxed">
                                                    {item.description}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            );
                        })}
                    </div>
                </main>

                <div className="h-12" />
            </div>

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
