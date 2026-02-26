import type React from "react";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

interface LinkItem {
    label: string;
    url: string;
    iconName?: keyof typeof Icons;
    description?: string;
}

interface LinkListProps {
    items: LinkItem[];
    className?: string;
}

export function LinkList({ items, className }: LinkListProps) {
    return (
        <div className={cn("flex flex-col gap-3", className)}>
            {items.map((item, index) => {
                const IconComponent = item.iconName ? (Icons[item.iconName] as React.ElementType) : null;

                return (
                    <a
                        key={index}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="
                            group flex items-center justify-between p-4
                            bg-[#e8e4df] rounded-2xl
                            shadow-[4px_4px_8px_#c5c2bd,-4px_-4px_8px_#ffffff]
                            hover:translate-x-1 transition-transform duration-300
                            active:shadow-[inset_2px_2px_4px_#c5c2bd,inset_-2px_-2px_4px_#ffffff]
                        "
                    >
                        <div className="flex items-center gap-4">
                            {IconComponent && (
                                <div className="
                                    flex items-center justify-center w-10 h-10 
                                    rounded-full bg-[#e8e4df] text-[#b07d4f]
                                    shadow-[inset_2px_2px_5px_#c5c2bd,inset_-2px_-2px_5px_#ffffff]
                                ">
                                    <IconComponent className="w-5 h-5" />
                                </div>
                            )}
                            <div>
                                <div className="font-bold text-[#3d3a36] text-sm">{item.label}</div>
                                {item.description && (
                                    <div className="text-xs text-[#7a756e] mt-0.5">{item.description}</div>
                                )}
                            </div>
                        </div>

                        <ChevronRight className="w-4 h-4 text-[#bdbdbd] group-hover:text-[#b07d4f] transition-colors" />
                    </a>
                );
            })}
        </div>
    );
}
