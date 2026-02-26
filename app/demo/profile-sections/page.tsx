import type React from "react";
import Image from "next/image";
import {
    User, Gamepad2, Bell, Mail, Gift, Menu, Share2,
    Heart, Star, Shield, Zap, Coffee, Sun, MapPin,
    Crown, Settings, Image as ImageIcon, Sword
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ImageHero } from "./components/ImageHero";
import { ImageGrid2 } from "./components/ImageGrid2";
import { ImageGrid3 } from "./components/ImageGrid3";
import { SocialLinks } from "./components/SocialLinks";
import { LinkList } from "./components/LinkList";
import { BarGraph } from "./components/BarGraph";
import { CircularStat } from "./components/CircularStat";
import { LongText } from "./components/LongText";
import { SectionHeader } from "./components/SectionHeader";

export const metadata = {
    title: "Profile Sections Demo",
    description: "Prototype of new user profile sections",
};

/**
 * Claymorphic Theme Variables (Same as main demo for consistency)
 */
const clayTheme = {
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
    "--theme-stat-bg": "#ddd9d4",
} as React.CSSProperties;

export default function ProfileSectionsDemoPage() {
    return (
        <div
            className="flex flex-col min-h-screen text-[#3d3a36] bg-[#e8e4df]"
            style={clayTheme}
        >
            {/* Simple Header for Demo Context */}
            <header className="sticky top-0 z-50 bg-[#e8e4df]/90 backdrop-blur-sm border-b border-[#d5d1cc] px-6 py-4 flex justify-between items-center">
                <h1 className="font-bold text-lg text-[#3d3a36]">Profile Sections Prototype</h1>
                <Badge variant="outline" className="border-[#b07d4f] text-[#b07d4f]">Dev Mode</Badge>
            </header>

            <div className="flex-1 flex justify-center w-full p-4 lg:p-8">
                {/* Main Content Area Constraint (Simulating Right Column) */}
                <div className="w-full max-w-3xl space-y-12 pb-20">

                    {/* --- Profile Card (Context Mock) --- */}
                    <div className="bg-[#e8e4df] rounded-3xl p-6 md:p-8 shadow-[8px_8px_16px_#c5c2bd,-8px_-8px_16px_#ffffff,inset_2px_2px_4px_rgba(255,255,255,0.6)]">
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#b07d4f]/10 text-[#b07d4f] mb-3">
                                    RANK S
                                </span>
                                <h2 className="text-3xl font-extrabold text-[#3d3a36] tracking-tight mb-1">
                                    Demo User
                                </h2>
                                <p className="text-sm text-[#7a756e]">
                                    Prototyping new sections...
                                </p>
                            </div>
                            <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 border-2 border-white shadow-md">
                                <Image
                                    src="https://placehold.co/100x100/3d3a36/e8e4df?text=U"
                                    alt="User"
                                    width={64}
                                    height={64}
                                    unoptimized
                                />
                            </div>
                        </div>
                    </div>

                    {/* --- 1. Image Sections --- */}
                    <section className="space-y-6">
                        <h3 className="text-sm font-bold text-[#7a756e] uppercase tracking-wider pl-2 border-l-4 border-[#b07d4f]">
                            1. Image Hero
                        </h3>

                        {/* Example 1: Banner with Link */}
                        <ImageHero
                            imageUrl="https://placehold.co/1200x400/2a2a2a/ffffff?text=New+Collection+2026"
                            alt="Campaign Banner"
                            title="Summer Collection"
                            subtitle="New Arrival"
                            linkUrl="https://example.com"
                            overlayText="Check It Out"
                        />

                        {/* Example 2: Simple Image */}
                        <ImageHero
                            imageUrl="https://placehold.co/1200x400/4a5568/ffffff?text=Support+Me+on+FANBOX"
                            alt="Fanbox Banner"
                            title="Join the Fanclub"
                            subtitle="Support"
                            linkUrl="https://fanbox.cc"
                        />
                    </section>

                    {/* --- 2. Image Grid (2 Columns) --- */}
                    <section className="space-y-6">
                        <h3 className="text-sm font-bold text-[#7a756e] uppercase tracking-wider pl-2 border-l-4 border-[#b07d4f]">
                            2. Image Grid (2 Columns)
                        </h3>

                        <ImageGrid2
                            items={[
                                {
                                    imageUrl: "https://placehold.co/600x450/e0e0e0/333333?text=BOOTH",
                                    alt: "BOOTH Shop",
                                    title: "Official Shop",
                                    subtitle: "Merch",
                                    linkUrl: "https://booth.pm",
                                    overlayText: "New Items"
                                },
                                {
                                    imageUrl: "https://placehold.co/600x450/fa5c5c/ffffff?text=FANBOX",
                                    alt: "PIXIV FANBOX",
                                    title: "Fan Community",
                                    subtitle: "Support",
                                    linkUrl: "https://fanbox.cc",
                                }
                            ]}
                        />
                    </section>

                    {/* --- 3. Image Grid (3 Columns) --- */}
                    <section className="space-y-6">
                        <h3 className="text-sm font-bold text-[#7a756e] uppercase tracking-wider pl-2 border-l-4 border-[#b07d4f]">
                            3. Image Grid (3 Columns)
                        </h3>

                        <ImageGrid3
                            items={[
                                {
                                    imageUrl: "https://placehold.co/400x400/8d85e7/ffffff?text=Illust",
                                    alt: "Gallery 1",
                                    title: "Illustrations",
                                    subtitle: "Gallery",
                                    linkUrl: "#",
                                },
                                {
                                    imageUrl: "https://placehold.co/400x400/6abf69/ffffff?text=Sketch",
                                    alt: "Gallery 2",
                                    title: "Sketches",
                                    subtitle: "Drafts",
                                    linkUrl: "#",
                                },
                                {
                                    imageUrl: "https://placehold.co/400x400/f0a441/ffffff?text=Live2D",
                                    alt: "Gallery 3",
                                    title: "Live2D Works",
                                    subtitle: "Portfolio",
                                    linkUrl: "#",
                                    overlayText: "Hot"
                                }
                            ]}
                        />
                    </section>

                    {/* --- 4. Icon Links --- */}
                    <div className="pt-8">
                        <SectionHeader title="4. Icon Links & Lists" icon={<Share2 className="w-4 h-4" />} />

                        <div className="space-y-8">
                            <div>
                                <h4 className="text-xs font-bold text-[#7a756e] uppercase mb-3 ml-1">Social Links</h4>
                                <SocialLinks
                                    items={[
                                        { platform: "Twitter", url: "#", iconName: "Twitter" },
                                        { platform: "GitHub", url: "#", iconName: "Github" },
                                        { platform: "Youtube", url: "#", iconName: "Youtube" },
                                        { platform: "Instagram", url: "#", iconName: "Instagram" },
                                    ]}
                                />
                            </div>

                            <div>
                                <h4 className="text-xs font-bold text-[#7a756e] uppercase mb-3 ml-1">Link List</h4>
                                <LinkList
                                    items={[
                                        { label: "My Portfolio Website", url: "#", description: "Check out my full works here", iconName: "Globe" },
                                        { label: "Commission Info", url: "#", description: "Status: OPEN", iconName: "Palette" },
                                        { label: "Amazon Wishlist", url: "#", iconName: "Gift" },
                                    ]}
                                />
                            </div>
                        </div>
                    </div>

                    {/* --- 5. Data & Graphs --- */}
                    <div className="pt-8">
                        <SectionHeader title="5. Data Visualization" icon={<Badge className="w-4 h-4" />} />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <BarGraph
                                title="Skills"
                                items={[
                                    { label: "Illustration", value: 90, color: "#f87171" },
                                    { label: "Live2D", value: 75, color: "#60a5fa" },
                                    { label: "3D Modeling", value: 45, color: "#4ade80" },
                                ]}
                            />

                            <CircularStat
                                title="Status"
                                items={[
                                    { label: "STR", value: 80, color: "#f87171", rank: "A" },
                                    { label: "INT", value: 95, color: "#60a5fa", rank: "S", icon: <Zap className="w-4 h-4" /> },
                                    { label: "LUCK", value: 20, color: "#fbbf24", rank: "E", subLabel: "Bad Day" },
                                ]}
                            />
                        </div>
                    </div>

                    {/* --- 6. Text Content --- */}
                    <div className="pt-8">
                        <SectionHeader title="6. Text Content" icon={<Menu className="w-4 h-4" />} />

                        <LongText
                            title="About Me"
                            text={`Hello! I'm a digital artist and Live2D modeler based in Tokyo.\n\nI love creating expressive characters and bringing them to life through animation. My favorite tools are Clip Studio Paint and Live2D Cubism.\n\nFeel free to contact me for commissions or collaborations!`}
                        />
                    </div>

                </div>
            </div>
        </div>
    );
}
