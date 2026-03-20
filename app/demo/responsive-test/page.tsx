import type React from "react";
import Image from "next/image";
import { Star, Shield, Zap } from "lucide-react";

export const metadata = {
    title: "プロフィール テーマ比較",
};

/**
 * テーマ定義（CSS変数マップ）
 */
const themes = {
    claymorphic: {
        name: "Claymorphic",
        description: "柔らかい粘土のような質感。丸みと影の重なりで立体感を演出",
        vars: {
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
            "--theme-stat-border": "none",
            "--theme-stat-shadow":
                "4px 4px 8px #c5c2bd, -4px -4px 8px #ffffff, inset 1px 1px 2px rgba(255,255,255,0.5)",
            "--theme-bar-bg": "#d5d1cc",
            "--theme-image-bg": "linear-gradient(135deg, #c9b99a 0%, #a89070 50%, #e8e4df 100%)",
            "--theme-sidebar-bg": "#e8e4df",
            "--theme-sidebar-border": "1px solid #d5d1cc",
            "--theme-label-style": "uppercase",
            "--theme-heading-weight": "800",
        },
    },
    neumorphic: {
        name: "Neumorphic",
        description: "押し出し / 凹みの光と影でミニマルに表現するUI",
        vars: {
            "--theme-bg": "#e0e5ec",
            "--theme-card-bg": "#e0e5ec",
            "--theme-card-shadow":
                "6px 6px 12px #b8bec7, -6px -6px 12px #ffffff",
            "--theme-card-border": "none",
            "--theme-card-radius": "16px",
            "--theme-text-primary": "#394867",
            "--theme-text-secondary": "#7b8794",
            "--theme-text-accent": "#5b7fb5",
            "--theme-accent-bg": "rgba(91,127,181,0.1)",
            "--theme-accent-border": "rgba(91,127,181,0.2)",
            "--theme-stat-bg": "#e0e5ec",
            "--theme-stat-border": "none",
            "--theme-stat-shadow":
                "inset 3px 3px 6px #b8bec7, inset -3px -3px 6px #ffffff",
            "--theme-bar-bg": "#d3d8df",
            "--theme-image-bg": "linear-gradient(180deg, #c8cfd8 0%, #a8b2be 50%, #e0e5ec 100%)",
            "--theme-sidebar-bg": "#e0e5ec",
            "--theme-sidebar-border": "none",
            "--theme-label-style": "uppercase",
            "--theme-heading-weight": "700",
        },
    },
    popart: {
        name: "Pop Art",
        description: "大胆な色使いと太いアウトラインでインパクト重視",
        vars: {
            "--theme-bg": "#fff4e0",
            "--theme-card-bg": "#ffffff",
            "--theme-card-shadow": "5px 5px 0px #222222",
            "--theme-card-border": "3px solid #222222",
            "--theme-card-radius": "4px",
            "--theme-text-primary": "#222222",
            "--theme-text-secondary": "#555555",
            "--theme-text-accent": "#e63946",
            "--theme-accent-bg": "#ffe066",
            "--theme-accent-border": "2px solid #222222",
            "--theme-stat-bg": "#a8dadc",
            "--theme-stat-border": "2px solid #222222",
            "--theme-stat-shadow": "3px 3px 0px #222222",
            "--theme-bar-bg": "#f1faee",
            "--theme-image-bg": "linear-gradient(180deg, #e63946 0%, #f4a261 50%, #fff4e0 100%)",
            "--theme-sidebar-bg": "#1d3557",
            "--theme-sidebar-border": "none",
            "--theme-label-style": "uppercase",
            "--theme-heading-weight": "900",
        },
    },
} as const;

type ThemeKey = keyof typeof themes;

/**
 * テーマ比較ページ
 * 3つのテーマを縦に並べて、同じプロフィール内容を異なるスタイルで表示
 */
export default function ResponsiveTestPage() {
    return (
        <div className="min-h-screen bg-gray-100">
            {/* ページヘッダー */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-6 py-4">
                    <h1 className="text-2xl font-bold text-gray-900">
                        テーマ比較プレビュー
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        CSS変数方式 — 同じ構造で異なるテーマを適用しています
                    </p>
                </div>
            </header>

            {/* 各テーマセクション */}
            <div className="max-w-5xl mx-auto px-6 py-10 space-y-16">
                {(Object.keys(themes) as ThemeKey[]).map((key) => (
                    <ThemeSection key={key} themeKey={key} />
                ))}
            </div>
        </div>
    );
}

/**
 * テーマセクション — テーマラベル + プロフィールカード群
 */
function ThemeSection({ themeKey }: { themeKey: ThemeKey }) {
    const theme = themes[themeKey];
    const style = theme.vars as Record<string, string>;

    return (
        <section>
            {/* テーマタイトル */}
            <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                    <span className="inline-block w-3 h-3 rounded-full" style={{ background: style["--theme-text-accent"] }} />
                    {theme.name}
                </h2>
                <p className="text-sm text-gray-500 mt-1">{theme.description}</p>
            </div>

            {/* テーマ適用エリア */}
            <div
                className="rounded-2xl overflow-hidden"
                style={{
                    ...style,
                    background: style["--theme-bg"],
                } as React.CSSProperties}
            >
                <div className="flex max-[992px]:flex-col">
                    {/* 画像エリア */}
                    <div
                        className="w-[320px] max-[992px]:w-full max-[992px]:h-[300px] shrink-0 flex items-end justify-center relative overflow-hidden"
                        style={{ background: style["--theme-image-bg"] }}
                    >
                        {/* 装飾 */}
                        {themeKey === "claymorphic" && (
                            <div className="absolute inset-4 rounded-2xl border border-white/30 pointer-events-none" />
                        )}
                        {themeKey === "popart" && (
                            <>
                                <div className="absolute top-4 left-4 w-12 h-12 rounded-full bg-yellow-300 border-2 border-black opacity-60" />
                                <div className="absolute bottom-8 right-4 w-8 h-8 bg-cyan-400 border-2 border-black rotate-45 opacity-60" />
                            </>
                        )}
                        <Image
                            src="https://placehold.co/320x640/333333/cccccc?text=Character"
                            alt="Character"
                            width={320}
                            height={640}
                            className="w-[85%] h-auto max-h-[90%] object-contain relative z-10"
                            unoptimized
                        />
                    </div>

                    {/* プロフィールエリア */}
                    <div className="flex-1 min-w-0 p-8 max-[992px]:p-6 space-y-4">
                        {/* 名前カード */}
                        <ThemedCard style={style}>
                            <span
                                className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-3"
                                style={{
                                    background: style["--theme-accent-bg"],
                                    color: style["--theme-text-accent"],
                                    border: style["--theme-accent-border"],
                                }}
                            >
                                ★ Lv.42 — 冒険者ランク S
                            </span>
                            <h3
                                className="text-3xl mb-1 tracking-tight"
                                style={{
                                    color: style["--theme-text-primary"],
                                    fontWeight: style["--theme-heading-weight"],
                                }}
                            >
                                キャラクター名
                            </h3>
                            <p
                                className="text-sm tracking-widest"
                                style={{
                                    color: style["--theme-text-accent"],
                                    opacity: 0.7,
                                    textTransform: style["--theme-label-style"] as "uppercase",
                                }}
                            >
                                — Shadow Walker —
                            </p>
                        </ThemedCard>

                        {/* ステータスカード */}
                        <ThemedCard style={style}>
                            <div className="grid grid-cols-3 gap-3">
                                <ThemedStatCard style={style} icon={<Zap className="size-4" style={{ color: "#eab308" }} />} label="ATK" value="1,284" />
                                <ThemedStatCard style={style} icon={<Shield className="size-4" style={{ color: "#3b82f6" }} />} label="DEF" value="876" />
                                <ThemedStatCard style={style} icon={<Star className="size-4" style={{ color: "#a855f7" }} />} label="SPD" value="1,102" />
                            </div>
                        </ThemedCard>

                        {/* プロフィール文 */}
                        <ThemedCard style={style}>
                            <h4
                                className="text-xs font-semibold mb-3 tracking-widest"
                                style={{
                                    color: style["--theme-text-accent"],
                                    textTransform: style["--theme-label-style"] as "uppercase",
                                }}
                            >
                                Profile
                            </h4>
                            <p
                                className="leading-relaxed text-sm text-justify"
                                style={{ color: style["--theme-text-secondary"] }}
                            >
                                闇に紛れし影の歩行者。かつて王国の精鋭部隊に所属していたが、ある事件をきっかけに組織を離脱。
                                現在は各地を放浪しながら、失われた古代の遺物を探し求めている。
                            </p>
                        </ThemedCard>

                        {/* スキル */}
                        <ThemedCard style={style}>
                            <h4
                                className="text-xs font-semibold mb-3 tracking-widest"
                                style={{
                                    color: style["--theme-text-accent"],
                                    textTransform: style["--theme-label-style"] as "uppercase",
                                }}
                            >
                                Skills
                            </h4>
                            <div className="space-y-3">
                                <ThemedSkillBar style={style} name="シャドウステップ" level={8} maxLevel={10} color="#06b6d4" />
                                <ThemedSkillBar style={style} name="ダークスラッシュ" level={6} maxLevel={10} color="#a855f7" />
                                <ThemedSkillBar style={style} name="影縫い" level={9} maxLevel={10} color="#3b82f6" />
                            </div>
                        </ThemedCard>
                    </div>
                </div>
            </div>
        </section>
    );
}

/**
 * テーマ対応カードコンポーネント
 * CSS変数を参照してスタイルを適用
 */
function ThemedCard({
    style,
    children,
}: {
    style: Record<string, string>;
    children: React.ReactNode;
}) {
    return (
        <div
            className="transition-all duration-200"
            style={{
                background: style["--theme-card-bg"],
                boxShadow: style["--theme-card-shadow"],
                border: style["--theme-card-border"],
                borderRadius: style["--theme-card-radius"],
                padding: "20px",
            }}
        >
            {children}
        </div>
    );
}

/**
 * テーマ対応ステータスカード
 */
function ThemedStatCard({
    style,
    icon,
    label,
    value,
}: {
    style: Record<string, string>;
    icon: React.ReactNode;
    label: string;
    value: string;
}) {
    return (
        <div
            className="text-center p-3 rounded-xl"
            style={{
                background: style["--theme-stat-bg"],
                border: style["--theme-stat-border"],
                boxShadow: style["--theme-stat-shadow"],
            }}
        >
            <div className="flex items-center justify-center gap-1 mb-1">
                {icon}
                <span
                    className="text-xs tracking-wider"
                    style={{
                        color: style["--theme-text-secondary"],
                        textTransform: style["--theme-label-style"] as "uppercase",
                    }}
                >
                    {label}
                </span>
            </div>
            <span
                className="text-lg font-bold"
                style={{ color: style["--theme-text-primary"] }}
            >
                {value}
            </span>
        </div>
    );
}

/**
 * テーマ対応スキルバー
 */
function ThemedSkillBar({
    style,
    name,
    level,
    maxLevel,
    color,
}: {
    style: Record<string, string>;
    name: string;
    level: number;
    maxLevel: number;
    color: string;
}) {
    const percentage = (level / maxLevel) * 100;

    return (
        <div>
            <div className="flex justify-between text-sm mb-1">
                <span style={{ color: style["--theme-text-primary"] }}>{name}</span>
                <span style={{ color: style["--theme-text-secondary"] }}>
                    Lv.{level}/{maxLevel}
                </span>
            </div>
            <div
                className="h-2 rounded-full overflow-hidden"
                style={{ background: style["--theme-bar-bg"] }}
            >
                <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%`, background: color }}
                />
            </div>
        </div>
    );
}
