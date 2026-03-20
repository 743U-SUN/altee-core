import type React from "react";
import Image from "next/image";
import { ExternalLink } from "lucide-react";

interface GridItem {
    imageUrl: string;
    linkUrl?: string;
    alt: string;
    title?: string;
    subtitle?: string;
    overlayText?: string;
}

interface ImageGrid3Props {
    items: [GridItem, GridItem, GridItem]; // Exactly 3 items
    className?: string;
}

export function ImageGrid3({
    items,
    className = "",
}: ImageGrid3Props) {
    return (
        <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 ${className}`}>
            {items.map((item, index) => (
                <GridCard key={index} item={item} />
            ))}
        </div>
    );
}

function GridCard({ item }: { item: GridItem }) {
    const Content = (
        <div className="relative w-full aspect-square rounded-2xl overflow-hidden group shadow-md transition-transform hover:scale-[1.03]">
            <Image
                src={item.imageUrl}
                alt={item.alt}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                unoptimized
            />

            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

            {/* Content Layer */}
            <div className="absolute inset-0 p-4 flex flex-col justify-end text-white">
                {(item.title || item.subtitle) && (
                    <div className="space-y-0.5">
                        {item.subtitle && (
                            <span className="inline-block px-1.5 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-[9px] font-bold tracking-wider uppercase mb-0.5">
                                {item.subtitle}
                            </span>
                        )}
                        {item.title && (
                            <h3 className="text-lg font-bold tracking-tight drop-shadow-md leading-tight">
                                {item.title}
                            </h3>
                        )}
                    </div>
                )}

                {item.overlayText && (
                    <div className="absolute top-2 right-2 bg-black/30 backdrop-blur-md px-2 py-0.5 rounded-full text-[9px] font-bold border border-white/20">
                        {item.overlayText}
                    </div>
                )}

                {item.linkUrl && (
                    <div className="absolute top-2 right-2 p-1.5 rounded-full bg-white/10 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
                        <ExternalLink className="w-3 h-3 text-white" />
                    </div>
                )}
            </div>
        </div>
    );

    if (item.linkUrl) {
        return (
            <a
                href={item.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-2xl"
            >
                {Content}
            </a>
        );
    }

    return Content;
}
