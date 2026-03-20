import type React from "react";
import { cn } from "@/lib/utils";

interface CircularStatItem {
    label: string;
    value: number; // 0-100
    color: string;
    rank?: string;
    subLabel?: string;
    icon?: React.ReactNode;
}

interface CircularStatProps {
    title?: string;
    items: CircularStatItem[];
    className?: string;
}

export function CircularStat({ title, items, className }: CircularStatProps) {
    return (
        <div className={cn("p-6 rounded-3xl bg-[#e8e4df] shadow-[8px_8px_16px_#c5c2bd,-8px_-8px_16px_#ffffff]", className)}>
            {title && (
                <h3 className="text-sm font-bold text-[#b07d4f] uppercase tracking-widest mb-6 border-b border-[#d5d1cc] pb-2">
                    {title}
                </h3>
            )}
            <div className="flex flex-wrap justify-center gap-8">
                {items.map((item, index) => (
                    <div key={index} className="flex flex-col items-center">
                        <div className="relative w-24 h-24 flex items-center justify-center">
                            {/* SVG Circle for Progress */}
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                {/* Background Circle (Track) */}
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="40"
                                    fill="none"
                                    stroke="#d5d1cc"
                                    strokeWidth="10"
                                    strokeLinecap="round"
                                    className="drop-shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)]"
                                />
                                {/* Progress Circle */}
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="40"
                                    fill="none"
                                    stroke={item.color}
                                    strokeWidth="10"
                                    strokeLinecap="round"
                                    strokeDasharray="251.2" // 2 * pi * 40
                                    strokeDashoffset={251.2 * (1 - item.value / 100)}
                                    className="transition-all duration-1000 ease-out drop-shadow-[2px_2px_4px_rgba(0,0,0,0.15)]"
                                />
                            </svg>

                            {/* Inner Content (Rank/Value) */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                {item.rank ? (
                                    <span className="text-3xl font-black text-[#5c5c5c] drop-shadow-sm font-sans" style={{ color: item.color }}>
                                        {item.rank}
                                    </span>
                                ) : (
                                    <span className="text-xl font-bold text-[#3d3a36]">
                                        {item.value}%
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Labels */}
                        <div className="mt-2 text-center">
                            {item.icon && <div className="mb-1 flex justify-center text-[#7a756e]">{item.icon}</div>}
                            <div className="font-bold text-sm text-[#3d3a36]">{item.label}</div>
                            {item.subLabel && <div className="text-[10px] text-[#7a756e] font-bold mt-0.5">{item.subLabel}</div>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
