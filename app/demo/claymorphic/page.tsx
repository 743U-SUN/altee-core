import type React from "react";
import Image from "next/image";
import { Star, Shield, Zap, Search, Bell, Menu, Heart, MapPin, Coffee, Sun, Home, Mail, Gamepad2, Sword, Crown, Settings, User, Image as ImageIcon, Backpack, MessageCircle, Gift, Mouse, Share2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const metadata = {
    title: "Character Profile (Claymorphic)",
    description: "Claymorphic style character profile page demo",
};

/**
 * Claymorphic Theme Variables
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
    "--theme-accent-border": "rgba(176,125,79,0.2)",
    "--theme-stat-bg": "#ddd9d4",
    "--theme-stat-border": "none",
    "--theme-stat-shadow":
        "4px 4px 8px #c5c2bd, -4px -4px 8px #ffffff, inset 1px 1px 2px rgba(255,255,255,0.5)",
    "--theme-bar-bg": "#d5d1cc",
    "--theme-image-bg": "linear-gradient(135deg, #c9b99a 0%, #a89070 50%, #e8e4df 100%)",
    "--theme-header-bg": "#e8e4df",
    "--theme-header-shadow": "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
} as React.CSSProperties;

/**
 * Claymorphic Character Profile Page
 */
export default function ClaymorphicPage() {
    return (
        <>
            {/* Fixed Background */}
            <div
                className="fixed inset-0 z-[-1] bg-[#e8e4df]"
                style={{
                    ...clayTheme,
                }}
            />

            <div
                className="flex flex-col min-h-screen text-[#3d3a36]"
                style={clayTheme}
            >
                {/* Header / Menu */}
                <header
                    className="
          flex justify-center w-full z-50
          sticky top-0 bg-[#e8e4df]/90 backdrop-blur-sm
          border-b border-[#d5d1cc]
          max-[992px]:hidden
        "
                >
                    <div className="flex items-center justify-between w-full max-w-[1200px] h-16 px-6">
                        <div className="flex items-center">
                            {/* Profile Image */}
                            <div className="w-14 h-14 rounded-l-sm rounded-r-none overflow-hidden shadow-[inset_2px_2px_4px_rgba(255,255,255,0.3)] border-0 border-r-0 border-white/50 bg-[#e8e4df] z-10 transition-transform hover:scale-105">
                                <Image
                                    src="https://placehold.co/100x100/3d3a36/e8e4df?text=A&font=lora"
                                    alt="Avatar"
                                    width={56}
                                    height={56}
                                    className="object-cover w-full h-full"
                                    unoptimized
                                />
                            </div>
                            {/* Name Card */}
                            <div className="h-14 w-56 px-4 flex items-center bg-[#e8e4df]/90 backdrop-blur-sm rounded-r-none rounded-l-none shadow-[4px_4px_8px_rgba(0,0,0,0.05)] border border-l-0 border-white/30">
                                <span className="font-bold text-[#3d3a36] text-sm tracking-wide">
                                    Shadow Walker
                                </span>
                            </div>
                        </div>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center gap-1">
                            <NavButton active icon={<User className="w-4 h-4" />}>Profile</NavButton>
                            <NavButton icon={<Mouse className="w-4 h-4" />}>Devices</NavButton>
                            <NavButton icon={<Bell className="w-4 h-4" />}>News</NavButton>
                            <NavButton icon={<Mail className="w-4 h-4" />}>Contact</NavButton>
                            <div className="w-px h-6 bg-[#d5d1cc] mx-2" />
                            <NavButton icon={<Gamepad2 className="w-4 h-4" />}>Game</NavButton>
                        </nav>

                        {/* Mobile Menu Button & User Actions */}
                        <div className="flex items-center gap-3">
                            <button className="p-2 rounded-full hover:bg-black/5 transition-colors">
                                <Gift className="w-5 h-5 text-[#7a756e]" />
                            </button>
                            <button className="p-2 rounded-full hover:bg-black/5 transition-colors">
                                <Mail className="w-5 h-5 text-[#7a756e]" />
                            </button>
                            <button className="p-2 rounded-full hover:bg-black/5 transition-colors relative">
                                <Bell className="w-5 h-5 text-[#7a756e]" />
                                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 border border-[#e8e4df]" />
                            </button>
                            <button className="md:hidden p-2 rounded-full hover:bg-black/5 transition-colors">
                                <Menu className="w-5 h-5 text-[#7a756e]" />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Main Content Area */}
                <div className="flex-1 flex justify-center w-full">
                    <main className="flex items-start w-full max-w-[1200px] max-[992px]:flex-col">
                        {/* Left Column: Image (Sticky on PC) */}
                        <aside
                            className="
            w-[400px] shrink-0
            sticky top-16 h-[calc(100vh-64px)]
            flex items-end justify-center relative overflow-hidden
            bg-gradient-to-br from-[#d6ccc2] to-[#e8e4df]
            
            max-[992px]:fixed max-[992px]:top-0 max-[992px]:left-0 max-[992px]:w-full max-[992px]:h-[100dvh] max-[992px]:z-0
            max-[992px]:overflow-hidden
          "
                        >
                            {/* Decorative Elements */}
                            <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute top-10 left-10 w-64 h-64 bg-white/20 rounded-full blur-3xl" />
                                <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#b07d4f]/10 rounded-full blur-3xl" />
                            </div>


                            {/* Profile Header (Top Left) */}
                            <div className="absolute top-4 left-4 z-20 flex items-center min-[992px]:hidden">
                                {/* Profile Image */}
                                <div className="w-14 h-14 rounded-l-sm rounded-r-none overflow-hidden shadow-[inset_2px_2px_4px_rgba(255,255,255,0.3)] border-0 border-r-0 border-white/50 bg-[#e8e4df] z-10">
                                    <Image
                                        src="https://placehold.co/100x100/3d3a36/e8e4df?text=A&font=lora"
                                        alt="Avatar"
                                        width={56}
                                        height={56}
                                        className="object-cover w-full h-full"
                                        unoptimized
                                    />
                                </div>
                                {/* Name Card */}
                                <div className="h-14 w-56 px-4 flex items-center bg-[#e8e4df]/90 backdrop-blur-sm rounded-r-none rounded-l-none shadow-[4px_4px_8px_rgba(0,0,0,0.05)] border border-l-0 border-white/30">
                                    <span className="font-bold text-[#3d3a36] text-sm tracking-wide">
                                        Shadow Walker
                                    </span>
                                </div>
                            </div>

                            {/* Banner Image (Below Notification) */}
                            <div className="absolute top-20 right-2 w-56 aspect-[3/1] z-20 overflow-hidden rounded-sm shadow-lg group cursor-pointer">
                                <Image
                                    src="https://placehold.co/600x200/b07d4f/e8e4df?text=BANNER&font=lora"
                                    alt="Banner"
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                                    unoptimized
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent pointer-events-none" />
                            </div>

                            {/* Left Side Icons */}
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-6">
                                <div className="flex flex-col items-center gap-1">
                                    <button className="w-10 h-10 rounded-full bg-[#e8e4df] shadow-[1px_1px_2px_#c5c2bd,1px_1px_2px_#a8a8a8] flex items-center justify-center text-[#7a756e] hover:text-[#b07d4f] hover:scale-110 transition-all active:shadow-[inset_2px_2px_4px_#c5c2bd,inset_-2px_-2px_4px_#ffffff]">
                                        <Gamepad2 className="w-5 h-5" />
                                    </button>
                                    <span className="text-[10px] font-bold text-white tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">ゲーム</span>
                                </div>
                                <div className="flex flex-col items-center gap-1">
                                    <button className="w-10 h-10 rounded-full bg-[#e8e4df] shadow-[1px_1px_2px_#c5c2bd,1px_1px_2px_#a8a8a8] flex items-center justify-center text-[#7a756e] hover:text-[#b07d4f] hover:scale-110 transition-all active:shadow-[inset_2px_2px_4px_#c5c2bd,inset_-2px_-2px_4px_#ffffff]">
                                        <Sword className="w-5 h-5" />
                                    </button>
                                    <span className="text-[10px] font-bold text-white tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">戦闘</span>
                                </div>
                                <div className="flex flex-col items-center gap-1">
                                    <button className="w-10 h-10 rounded-full bg-[#e8e4df] shadow-[1px_1px_2px_#c5c2bd,1px_1px_2px_#a8a8a8] flex items-center justify-center text-[#7a756e] hover:text-[#b07d4f] hover:scale-110 transition-all active:shadow-[inset_2px_2px_4px_#c5c2bd,inset_-2px_-2px_4px_#ffffff]">
                                        <Crown className="w-5 h-5" />
                                    </button>
                                    <span className="text-[10px] font-bold text-white tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">ランク</span>
                                </div>
                            </div>

                            {/* Right Side Icons */}
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-6">
                                <div className="flex flex-col items-center gap-1">
                                    <button className="w-10 h-10 rounded-full bg-[#e8e4df] shadow-[1px_1px_2px_#c5c2bd,1px_1px_2px_#a8a8a8] flex items-center justify-center text-[#7a756e] hover:text-[#b07d4f] hover:scale-110 transition-all active:shadow-[inset_2px_2px_4px_#c5c2bd,inset_-2px_-2px_4px_#ffffff]">
                                        <Settings className="w-5 h-5" />
                                    </button>
                                    <span className="text-[10px] font-bold text-white tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">設定</span>
                                </div>
                                <div className="flex flex-col items-center gap-1">
                                    <button className="w-10 h-10 rounded-full bg-[#e8e4df] shadow-[1px_1px_2px_#c5c2bd,1px_1px_2px_#a8a8a8] flex items-center justify-center text-[#7a756e] hover:text-[#b07d4f] hover:scale-110 transition-all active:shadow-[inset_2px_2px_4px_#c5c2bd,inset_-2px_-2px_4px_#ffffff]">
                                        <User className="w-5 h-5" />
                                    </button>
                                    <span className="text-[10px] font-bold text-white tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">ユーザ</span>
                                </div>
                                <div className="flex flex-col items-center gap-1">
                                    <button className="w-10 h-10 rounded-full bg-[#e8e4df] shadow-[1px_1px_2px_#c5c2bd,1px_1px_2px_#a8a8a8] flex items-center justify-center text-[#7a756e] hover:text-[#b07d4f] hover:scale-110 transition-all active:shadow-[inset_2px_2px_4px_#c5c2bd,inset_-2px_-2px_4px_#ffffff]">
                                        <ImageIcon className="w-5 h-5" />
                                    </button>
                                    <span className="text-[10px] font-bold text-white tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">画像</span>
                                </div>
                            </div>



                            <div className="relative z-10 w-full h-full flex items-end justify-center pb-8">
                                {/* Character Image Placeholder */}
                                <Image
                                    src="https://placehold.co/400x800/3d3a36/e8e4df?text=Character&font=lora"
                                    alt="Character"
                                    width={400}
                                    height={800}
                                    className="
                w-auto max-w-full h-[90%] object-contain
                drop-shadow-[10px_10px_20px_rgba(0,0,0,0.15)]
              "
                                    unoptimized
                                />
                            </div>

                            {/* Overlay Info (Mobile Only) */}
                            <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-[#e8e4df]/80 backdrop-blur-md hidden max-[992px]:block">
                                <h2 className="text-xl font-bold text-[#3d3a36]">Shadow Walker</h2>
                                <p className="text-xs text-[#7a756e]">Lv.42 — 冒険者ランク S</p>
                            </div>

                            <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-[#e8e4df]/80 backdrop-blur-md hidden max-[992px]:block">
                                <h2 className="text-xl font-bold text-[#3d3a36]">Shadow Walker</h2>
                                <p className="text-xs text-[#7a756e]">Lv.42 — 冒険者ランク S</p>
                            </div>
                        </aside>

                        {/* Right Column: Scrollable Content */}
                        <div
                            className="
            flex-1 bg-[#e8e4df]
            px-8 py-10 lg:px-12
            flex items-start flex-col
            
            max-[992px]:w-full
            max-[992px]:mt-[calc(100dvh-120px)]
            max-[992px]:relative max-[992px]:z-10
            max-[992px]:bg-[#e8e4df]
            max-[992px]:rounded-t-[32px]
            max-[992px]:shadow-[0_-4px_20px_rgba(0,0,0,0.1)]
            max-[992px]:px-6 max-[992px]:py-8
            max-[992px]:min-h-[calc(100dvh-64px)]
          "
                        >
                            <div className="w-full max-w-3xl mx-auto space-y-8 pb-20">
                                {/* Profile Header (PC) */}
                                <ClayCard>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#b07d4f]/10 text-[#b07d4f] mb-3">
                                                RANK S — Assasin
                                            </span>
                                            <h1 className="text-4xl font-extrabold text-[#3d3a36] tracking-tight mb-2">
                                                Shadow Walker
                                            </h1>
                                            <p className="text-sm text-[#7a756e] tracking-widest uppercase">
                                                Characters / Playable / Dark
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="w-12 h-12 flex items-center justify-center rounded-2xl bg-[#e8e4df] text-[#b07d4f] transition-all shadow-[5px_5px_10px_#c5c2bd,-5px_-5px_10px_#ffffff] hover:scale-105 active:scale-95 active:shadow-[inset_4px_4px_8px_#c5c2bd,inset_-4px_-4px_8px_#ffffff]">
                                                <Heart className="w-6 h-6 fill-current" />
                                            </button>
                                        </div>
                                    </div>
                                </ClayCard>

                                {/* Status Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <ClayStatCard
                                        icon={<Zap className="w-5 h-5 text-yellow-500" />}
                                        label="ATTACK"
                                        value="2,480"
                                        sub="+12"
                                    />
                                    <ClayStatCard
                                        icon={<Shield className="w-5 h-5 text-blue-500" />}
                                        label="DEFENSE"
                                        value="1,850"
                                        sub="+5"
                                    />
                                    <ClayStatCard
                                        icon={<Star className="w-5 h-5 text-purple-500" />}
                                        label="SPEED"
                                        value="3,200"
                                        sub="+24"
                                    />
                                </div>

                                {/* Biography */}
                                <ClayCard title="BIOGRAPHY">
                                    <p className="text-[#7a756e] leading-relaxed text-justify mb-4">
                                        闇に紛れし影の歩行者。かつて王国の精鋭部隊「白銀の牙」に所属していたが、ある事件をきっかけに組織を離脱。
                                        現在は各地を放浪しながら、失われた古代の遺物「空の涙」を探し求めている。
                                        冷酷非道に見えるが、実は猫と甘いものに目がないという一面も。
                                    </p>
                                    <div className="flex gap-4 mt-6 overflow-x-auto pb-2">
                                        <Badge variant="outline" className="border-[#b07d4f]/30 text-[#b07d4f] bg-transparent whitespace-nowrap">
                                            #暗殺者
                                        </Badge>
                                        <Badge variant="outline" className="border-[#b07d4f]/30 text-[#b07d4f] bg-transparent whitespace-nowrap">
                                            #元騎士
                                        </Badge>
                                        <Badge variant="outline" className="border-[#b07d4f]/30 text-[#b07d4f] bg-transparent whitespace-nowrap">
                                            #甘党
                                        </Badge>
                                    </div>
                                </ClayCard>

                                {/* Q&A Section (1問1答) */}
                                <ClayCard title="INTERVIEW (Q&A)">
                                    <div className="space-y-4">
                                        <QAItem
                                            q="性格を一言で表すと？"
                                            a="...冷静沈着、と言いたいところだが。甘いものを前にすると崩れるらしい。"
                                            icon={<Sun className="w-4 h-4" />}
                                        />
                                        <QAItem
                                            q="趣味は？"
                                            a="古代文字の解読。それと、誰もいない深夜の森でのティータイム。"
                                            icon={<Coffee className="w-4 h-4" />}
                                        />
                                        <QAItem
                                            q="好きな食べ物は？"
                                            a="王都の裏路地にある『黒猫亭』のフルーツタルト。あれは絶品だ。"
                                            icon={<Heart className="w-4 h-4" />}
                                        />
                                        <QAItem
                                            q="苦手なものは？"
                                            a="早起きと、直射日光。それから、やたらと声の大きい戦士クラスの奴ら。"
                                            icon={<MapPin className="w-4 h-4" />}
                                        />
                                    </div>
                                </ClayCard>

                                {/* Skills */}
                                <ClayCard title="SKILL MASTERY">
                                    <div className="space-y-6">
                                        <ClaySkillBar name="Shadow Step" level={9} color="#06b6d4" />
                                        <ClaySkillBar name="Dark Slash" level={7} color="#a855f7" />
                                        <ClaySkillBar name="Silence" level={5} color="#3b82f6" />
                                    </div>
                                </ClayCard>

                                {/* Gallery Preview */}
                                <ClayCard title="GALLERY">
                                    <div className="grid grid-cols-3 gap-2">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="aspect-square rounded-xl bg-[#d5d1cc] shadow-inner relative overflow-hidden group cursor-pointer">
                                                <div className="absolute inset-0 flex items-center justify-center text-[#7a756e]/50 font-bold group-hover:bg-black/10 transition-colors">
                                                    IMG 0{i}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <button className="w-full mt-4 py-3 text-sm font-bold text-[#b07d4f] hover:bg-[#b07d4f]/5 rounded-xl transition-colors">
                                        VIEW ALL PHOTOS
                                    </button>
                                </ClayCard>
                            </div>

                            <footer className="w-full mt-auto pt-10 border-t border-[#d5d1cc] text-center text-xs text-[#7a756e]">
                                <p>© 2026 Altee Project. All rights reserved.</p>
                            </footer>
                        </div>

                        {/* --- Mobile Only Floating Elements (Outside aside to fix stacking context) --- */}

                        {/* Mobile Floating Map Button */}
                        <div className="hidden max-[992px]:flex fixed bottom-36 left-4 z-50 flex-col items-center gap-1">
                            <button className="w-16 h-16 rounded-full bg-[#e8e4df] shadow-[1px_1px_2px_#c5c2bd,1px_1px_2px_#a8a8a8] flex items-center justify-center text-[#7a756e] hover:text-[#b07d4f] hover:scale-110 transition-all active:shadow-[inset_2px_2px_4px_#c5c2bd,inset_-2px_-2px_4px_#ffffff]">
                                <Gamepad2 className="w-6 h-6" />
                            </button>
                            <span className="text-xs font-bold text-white tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">ゲーム</span>
                        </div>

                        {/* Mobile Floating Backpack Button */}
                        <div className="hidden max-[992px]:flex fixed bottom-36 right-4 z-50 flex-col items-center gap-1">
                            <button className="w-16 h-16 rounded-full bg-[#e8e4df] shadow-[1px_1px_2px_#c5c2bd,1px_1px_2px_#a8a8a8] flex items-center justify-center text-[#7a756e] hover:text-[#b07d4f] hover:scale-110 transition-all active:shadow-[inset_2px_2px_4px_#c5c2bd,inset_-2px_-2px_4px_#ffffff]">
                                <Share2 className="w-6 h-6" />
                            </button>
                            <span className="text-xs font-bold text-white tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">SNS</span>
                        </div>

                        {/* Mobile Floating Notification */}
                        <div className="hidden max-[992px]:flex fixed top-4 right-2 z-50 items-center gap-1 px-1 h-12 bg-black/20 backdrop-blur-sm rounded-md">
                            <button className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/80 hover:text-white">
                                <Gift className="w-5 h-5" />
                            </button>
                            <button className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/80 hover:text-white">
                                <Mail className="w-5 h-5" />
                            </button>
                            <button className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/80 hover:text-white relative">
                                <Bell className="w-5 h-5" />
                                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 border border-white/20 shadow-sm" />
                            </button>
                        </div>

                        {/* Desktop Only Floating Share Button */}
                        <div className="fixed bottom-8 right-8 z-50 hidden min-[992px]:block">
                            <button className="w-14 h-14 rounded-2xl bg-[#e8e4df] text-[#7a756e] shadow-[5px_5px_10px_#c5c2bd,-5px_-5px_10px_#ffffff] flex items-center justify-center hover:text-[#b07d4f] hover:scale-110 transition-all active:shadow-[inset_4px_4px_8px_#c5c2bd,inset_-4px_-4px_8px_#ffffff]">
                                <Share2 className="w-6 h-6" />
                            </button>
                        </div>

                    </main >

                    {/* Mobile Footer Navigation */}
                    <MobileMenu />
                </div>
            </div>
        </>
    );
}

// --- Components ---

function NavButton({ children, active, icon }: { children: React.ReactNode; active?: boolean; icon?: React.ReactNode }) {
    return (
        <button
            className={`
        px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2
        ${active
                    ? "bg-[#e8e4df] text-[#b07d4f] shadow-[inset_3px_3px_6px_#c5c2bd,inset_-3px_-3px_6px_#ffffff]"
                    : "text-[#7a756e] hover:bg-black/5"
                }
      `}
        >
            {icon && <span className={active ? "text-[#b07d4f]" : "text-[#7a756e]"}>{icon}</span>}
            {children}
        </button>
    );
}

function ClayCard({
    children,
    title,
    className = "",
}: {
    children: React.ReactNode;
    title?: string;
    className?: string;
}) {
    return (
        <div
            className={`
        bg-[#e8e4df] rounded-3xl p-6 md:p-8
        shadow-[8px_8px_16px_#c5c2bd,-8px_-8px_16px_#ffffff,inset_2px_2px_4px_rgba(255,255,255,0.6)]
        ${className}
      `}
        >
            {title && (
                <h3 className="text-xs font-bold text-[#b07d4f] tracking-widest uppercase mb-6 ml-1">
                    {title}
                </h3>
            )}
            {children}
        </div>
    );
}

function ClayStatCard({
    icon,
    label,
    value,
    sub,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    sub: string;
}) {
    return (
        <div className="bg-[#e8e4df] rounded-2xl p-4 shadow-[8px_8px_16px_#c5c2bd,-8px_-8px_16px_#ffffff,inset_2px_2px_4px_rgba(255,255,255,0.6)] flex flex-col items-center text-center">
            <div className="mb-2 p-2 rounded-full bg-[#e8e4df] shadow-[inset_2px_2px_5px_#c5c2bd,inset_-2px_-2px_5px_#ffffff]">
                {icon}
            </div>
            <span className="text-[10px] font-bold text-[#7a756e] tracking-wider uppercase mb-1">
                {label}
            </span>
            <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-[#3d3a36]">{value}</span>
                <span className="text-xs font-bold text-[#b07d4f]">{sub}</span>
            </div>
        </div>
    );
}

function QAItem({ q, a, icon }: { q: string; a: string; icon: React.ReactNode }) {
    return (
        <div className="bg-[#e8e4df] border border-white/50 rounded-2xl p-4 transition hover:translate-x-1">
            <div className="flex items-start gap-3">
                <div className="mt-1 p-1.5 rounded-lg bg-[#b07d4f]/10 text-[#b07d4f]">
                    {icon}
                </div>
                <div>
                    <h4 className="text-sm font-bold text-[#3d3a36] mb-1">Q. {q}</h4>
                    <p className="text-sm text-[#7a756e] leading-relaxed">
                        <span className="font-bold mr-2 text-[#b07d4f]">A.</span>
                        {a}
                    </p>
                </div>
            </div>
        </div>
    );
}

function ClaySkillBar({ name, level, color }: { name: string; level: number; color: string }) {
    return (
        <div>
            <div className="flex justify-between text-sm mb-2 px-1">
                <span className="font-bold text-[#3d3a36]">{name}</span>
                <span className="text-[#7a756e] font-mono">Lv.{level}/10</span>
            </div>
            <div className="h-4 bg-[#d5d1cc] rounded-full overflow-hidden shadow-[inset_2px_2px_4px_#bebebe,inset_-2px_-2px_4px_#ffffff]">
                <div
                    className="h-full rounded-full shadow-[2px_0_5px_rgba(0,0,0,0.1)] relative overflow-hidden"
                    style={{ width: `${level * 10}%`, background: color }}
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent" />
                </div>
            </div>
        </div>
    );
}

function MobileMenu() {
    return (
        <nav
            className="
        fixed bottom-0 left-0 right-0 z-50
        min-[993px]:hidden
        bg-[#e8e4df]/80 backdrop-blur-md
        border-t border-white/40
        shadow-[0_-4px_10px_rgba(0,0,0,0.05)]
        pb-safe pt-2 px-6
      "
        >
            <div className="flex justify-between items-center h-16 max-w-md mx-auto">
                <MobileNavItem icon={<User className="w-5 h-5" />} label="Profile" active />
                <MobileNavItem icon={<Gamepad2 className="w-5 h-5" />} label="Devices" />
                <MobileNavItem icon={<Bell className="w-5 h-5" />} label="News" />
                <MobileNavItem icon={<Mail className="w-5 h-5" />} label="Contact" />
            </div>
        </nav>
    );
}

function MobileNavItem({
    icon,
    label,
    active = false,
}: {
    icon: React.ReactNode;
    label: string;
    active?: boolean;
}) {
    return (
        <button
            className={`
        flex flex-col items-center justify-center gap-1 w-16 h-full
        transition-colors duration-200
        ${active ? "text-[#b07d4f]" : "text-[#7a756e] hover:text-[#3d3a36]"}
      `}
        >
            <div
                className={`
          p-1.5 rounded-xl transition-all
          ${active
                        ? "bg-[#b07d4f]/10 shadow-inner"
                        : "hover:bg-black/5"
                    }
        `}
            >
                {icon}
            </div>
            <span className="text-[10px] font-bold tracking-wide">{label}</span>
        </button>
    );
}

// Add simple CSS for custom animations if not in tailwind config
// In a real app, this should go to global css
const _style = `
@keyframes scroll-indicator {
  0% { transform: translateY(0); opacity: 1; }
  100% { transform: translateY(4px); opacity: 0; }
}
.animate-scroll-indicator {
  animation: scroll-indicator 1.5s infinite;
}
`;
