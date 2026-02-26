import type React from "react";
import { cn } from "@/lib/utils";

interface LongTextProps {
    title?: string;
    text: string;
    className?: string;
}

export function LongText({ title, text, className }: LongTextProps) {
    return (
        <div className={cn("p-6 rounded-3xl bg-[#e8e4df] shadow-[8px_8px_16px_#c5c2bd,-8px_-8px_16px_#ffffff]", className)}>
            {title && (
                <h3 className="text-sm font-bold text-[#b07d4f] uppercase tracking-widest mb-4 border-b border-[#d5d1cc] pb-2">
                    {title}
                </h3>
            )}
            <div className="text-[#3d3a36] leading-relaxed whitespace-pre-wrap font-medium">
                {text}
            </div>
        </div>
    );
}
