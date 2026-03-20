import type React from "react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
    title: string;
    icon?: React.ReactNode;
    className?: string;
}

export function SectionHeader({ title, icon, className }: SectionHeaderProps) {
    return (
        <div className={cn("flex items-center gap-3 mb-4 mt-8", className)}>
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#b07d4f]/10 text-[#b07d4f]">
                {icon}
            </div>
            <h3 className="text-lg font-bold text-[#3d3a36] tracking-tight">
                {title}
            </h3>
            <div className="flex-1 h-px bg-gradient-to-r from-[#d5d1cc] to-transparent ml-2" />
        </div>
    );
}
