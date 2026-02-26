import type React from "react";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";

interface SocialLinkItem {
    platform: string;
    url: string;
    iconName: keyof typeof Icons;
}

interface SocialLinksProps {
    items: SocialLinkItem[];
    className?: string;
}

export function SocialLinks({ items, className }: SocialLinksProps) {
    return (
        <div className={cn("flex flex-wrap gap-3", className)}>
            {items.map((item, index) => {
                // Configurable icon component
                const IconComponent = Icons[item.iconName] as React.ElementType;

                return (
                    <a
                        key={index}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="
                            flex items-center justify-center w-12 h-12 
                            rounded-xl bg-[#e8e4df] text-[#7a756e]
                            shadow-[4px_4px_8px_#c5c2bd,-4px_-4px_8px_#ffffff]
                            hover:text-[#b07d4f] hover:scale-110 
                            transition-all duration-300
                            active:shadow-[inset_2px_2px_4px_#c5c2bd,inset_-2px_-2px_4px_#ffffff]
                        "
                        title={item.platform}
                    >
                        {IconComponent ? (
                            <IconComponent className="w-5 h-5" />
                        ) : (
                            <Icons.Link className="w-5 h-5" />
                        )}
                    </a>
                );
            })}
        </div>
    );
}
