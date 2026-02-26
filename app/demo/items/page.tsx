"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Star, Shield, Zap, Info, Share2, Search, ShoppingBag, Monitor, HardDrive, Cpu, MemoryStick, Package, Keyboard, Headphones, Mouse } from "lucide-react";

// export const metadata = {
//     title: "Items - Claymorphic Profile",
// };

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
 * Mock Data for Items
 */
const items = [
    {
        id: 1,
        name: "Mechanical Keyboard 65%",
        image: "https://placehold.co/400x300/e8e4df/b07d4f?text=Keyboard",
        rating: 4.8,
        price: 24800,
        description: "A compact 65% mechanical keyboard with custom switches and a solid aluminum case. Perfect for long coding sessions.",
        tags: ["Peripherals", "Work"],
        icon: <Keyboard className="w-5 h-5" />,
    },
    {
        id: 2,
        name: "Noise Cancelling Headphones",
        image: "https://placehold.co/400x300/e8e4df/3b82f6?text=Headphones",
        rating: 4.5,
        price: 39900,
        description: "Premium over-ear headphones with active noise cancellation. The soundstage is wide and immersive.",
        tags: ["Audio", "Music"],
        icon: <Headphones className="w-5 h-5" />,
    },
    {
        id: 3,
        name: "Ergonomic Mouse",
        image: "https://placehold.co/400x300/e8e4df/10b981?text=Mouse",
        rating: 4.2,
        price: 12500,
        description: "Vertical ergonomic mouse designed to reduce wrist strain. It takes some getting used to but is worth it.",
        tags: ["Peripherals", "Health"],
        icon: <Mouse className="w-5 h-5" />,
    },
    {
        id: 4,
        name: "4K Monitor 27inch",
        image: "https://placehold.co/400x300/e8e4df/8b5cf6?text=Monitor",
        rating: 4.9,
        price: 65000,
        description: "High color accuracy 4K IPS panel. Essential for design work and crisp text rendering.",
        tags: ["Display", "Work"],
        icon: <Monitor className="w-5 h-5" />,
    },
];

/**
 * Mock Data for PC Specs
 */
const specs = [
    { label: "CPU", value: "Ryzen 9 5950X", price: 79800, icon: <Cpu className="w-5 h-5" /> },
    { label: "GPU", value: "GeForce RTX 3080", price: 148000, icon: <Monitor className="w-5 h-5" /> }, // Using Monitor icon as generic display adapter
    { label: "RAM", value: "64GB DDR4-3600", price: 28000, icon: <MemoryStick className="w-5 h-5" /> }, // MemoryStick is not in lucide, check
    { label: "Storage", value: "2TB NVMe Gen4", price: 22000, icon: <HardDrive className="w-5 h-5" /> },
];

/**
 * Mock Data for PC Build Info
 */
const pcBuild = {
    name: "Ultimate Creator Workstation",
    image: "https://placehold.co/600x400/e8e4df/3d3a36?text=My+PC+Build",
    price: 450000,
    description: "My custom built workstation for video editing, 3D rendering, and gaming. Theme is white and minimal with wood accents.",
};

export default function ItemsPage() {
    const [activeTab, setActiveTab] = useState<"items" | "specs">("items");

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
                            こんにちは！ガジェット好きのノマドワーカーです。<br />
                            普段はカフェやコワーキングスペースで仕事をしています。<br />
                            お気に入りのアイテムたちを紹介していきますね。
                        </p>
                    </div>
                </header>

                {/* 2. Tab Navigation */}
                <nav className="flex justify-center">
                    <div className="clay-card p-2 flex gap-2 rounded-full">
                        <button
                            onClick={() => setActiveTab("items")}
                            className={`px-6 py-2 rounded-full font-medium transition-all flex items-center gap-2 ${activeTab === "items"
                                ? "bg-[var(--theme-text-accent)] text-white shadow-inner scale-95"
                                : "text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]"
                                }`}
                        >
                            <Package className="w-4 h-4" />
                            Items
                        </button>
                        <button
                            onClick={() => setActiveTab("specs")}
                            className={`px-6 py-2 rounded-full font-medium transition-all flex items-center gap-2 ${activeTab === "specs"
                                ? "bg-[var(--theme-text-accent)] text-white shadow-inner scale-95"
                                : "text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]"
                                }`}
                        >
                            <Monitor className="w-4 h-4" />
                            PC Specs
                        </button>
                    </div>
                </nav>

                {/* 3. Content Area */}
                <main className="space-y-6">
                    {activeTab === "items" ? (
                        // Items List
                        items.map((item) => (
                            <article
                                key={item.id}
                                className="clay-card p-4 sm:p-5 flex flex-row gap-4 sm:gap-5 items-start transition-transform hover:-translate-y-1 hover:shadow-xl"
                            >
                                {/* Item Image */}
                                <div className="w-[120px] sm:w-[200px] aspect-[4/3] rounded-2xl overflow-hidden relative shrink-0 clay-inset">
                                    <Image
                                        src={item.image}
                                        alt={item.name}
                                        fill
                                        className="object-cover"
                                    />
                                </div>

                                {/* Item Details */}
                                <div className="flex-1 w-full flex flex-col gap-2">
                                    <div className="flex justify-between items-start">
                                        <h2 className="text-lg font-bold text-[var(--theme-text-primary)] line-clamp-1">
                                            {item.name}
                                        </h2>
                                        <button className="text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-accent)] transition-colors">
                                            {item.icon}
                                        </button>
                                    </div>

                                    {/* Rating */}
                                    <div className="flex items-center gap-1">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`w-4 h-4 ${i < Math.floor(item.rating)
                                                    ? "fill-[var(--theme-text-accent)] text-[var(--theme-text-accent)]"
                                                    : "text-gray-300"
                                                    }`}
                                            />
                                        ))}
                                        <span className="text-sm text-[var(--theme-text-secondary)] ml-1 font-medium">
                                            {item.rating}
                                        </span>
                                    </div>

                                    {/* Price */}
                                    <div className="text-sm font-bold text-[var(--theme-text-primary)] pl-1 mt-1">
                                        ¥ {item.price.toLocaleString()}
                                    </div>

                                    {/* Description */}
                                    <p className="text-sm text-[var(--theme-text-secondary)] leading-relaxed line-clamp-2">
                                        {item.description}
                                    </p>

                                    {/* Tags & Action */}
                                    <div className="mt-auto pt-2 flex items-center justify-between">
                                        <div className="flex gap-2">
                                            {item.tags.map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="px-2 py-1 text-xs rounded-lg bg-[var(--theme-stat-bg)] text-[var(--theme-text-secondary)]"
                                                >
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                        <button className="flex items-center gap-1 text-xs font-bold text-[var(--theme-text-accent)] hover:underline uppercase tracking-wider">
                                            Check Detail
                                        </button>
                                    </div>
                                </div>
                            </article>
                        ))
                    ) : (
                        // Specs List
                        <div className="space-y-6">
                            {/* PC Build Header Card */}
                            <article className="clay-card p-4 sm:p-5 flex flex-row gap-4 sm:gap-5 items-start">
                                {/* PC Image */}
                                <div className="w-[120px] sm:w-[200px] aspect-[4/3] rounded-2xl overflow-hidden relative shrink-0 clay-inset">
                                    <Image
                                        src={pcBuild.image}
                                        alt={pcBuild.name}
                                        fill
                                        className="object-cover"
                                    />
                                </div>

                                {/* PC Details */}
                                <div className="flex-1 w-full flex flex-col gap-2">
                                    <h2 className="text-lg font-bold text-[var(--theme-text-primary)]">
                                        {pcBuild.name}
                                    </h2>

                                    {/* Price */}
                                    <div className="text-sm font-bold text-[var(--theme-text-primary)] pl-1">
                                        ¥ {pcBuild.price.toLocaleString()}
                                    </div>

                                    {/* Description */}
                                    <p className="text-sm text-[var(--theme-text-secondary)] leading-relaxed mt-1">
                                        {pcBuild.description}
                                    </p>
                                </div>
                            </article>

                            {/* Specs List Container */}
                            <div className="clay-card p-6">
                                <h3 className="text-xl font-bold text-[var(--theme-text-primary)] mb-6 px-2">
                                    System Specifications
                                </h3>
                                <div className="space-y-6">
                                    {specs.map((spec, index) => (
                                        <div
                                            key={spec.label}
                                            className={`flex items-center gap-5 p-2 ${index !== specs.length - 1 ? "border-b border-[var(--theme-accent-border)] pb-6" : ""
                                                }`}
                                        >
                                            <div className="p-3 rounded-full clay-inset text-[var(--theme-text-accent)] shrink-0">
                                                {spec.icon}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-center mb-1">
                                                    <p className="text-xs font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider">
                                                        {spec.label}
                                                    </p>
                                                    <p className="text-xs font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider">
                                                        ¥ {spec.price.toLocaleString()}
                                                    </p>
                                                </div>
                                                <p className="text-lg font-bold text-[var(--theme-text-primary)]">
                                                    {spec.value}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </main>

                {/* Footer simple space */}
                <div className="h-12" />
            </div >

            {/* Global Styles for Claymorphic Effects */}
            < style jsx global > {`
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
            `}</style >
        </div >
    );
}
