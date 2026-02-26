import type React from "react";
import { cn } from "@/lib/utils";

interface BarItem {
    label: string;
    value: number; // 0-100
    color?: string;
    displayValue?: string;
}

interface BarGraphProps {
    title?: string;
    items: BarItem[];
    className?: string;
}

export function BarGraph({ title, items, className }: BarGraphProps) {
    return (
        <div className={cn("p-6 rounded-3xl bg-[#e8e4df] shadow-[8px_8px_16px_#c5c2bd,-8px_-8px_16px_#ffffff]", className)}>
            {title && (
                <h3 className="text-sm font-bold text-[#b07d4f] uppercase tracking-widest mb-6 border-b border-[#d5d1cc] pb-2">
                    {title}
                </h3>
            )}
            <div className="space-y-5">
                {items.map((item, index) => (
                    <div key={index}>
                        <div className="flex justify-between text-sm mb-1.5 px-1">
                            <span className="font-bold text-[#3d3a36]">{item.label}</span>
                            <span className="text-[#7a756e] font-mono font-bold text-xs">{item.displayValue || `${item.value}%`}</span>
                        </div>
                        <div className="h-3 bg-[#d5d1cc] rounded-full overflow-hidden shadow-[inset_2px_2px_4px_#bebebe,inset_-2px_-2px_4px_#ffffff]">
                            <div
                                className="h-full rounded-full shadow-[2px_0_5px_rgba(0,0,0,0.1)] relative overflow-hidden transition-all duration-1000 ease-out"
                                style={{ width: `${item.value}%`, background: item.color || "#3b82f6" }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
