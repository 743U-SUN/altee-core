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

interface ImageGrid2Props {
    items: [GridItem, GridItem]; // Exactly 2 items
    className?: string;
}

export function ImageGrid2({
    items,
    className = "",
}: ImageGrid2Props) {
    return (
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
            {items.map((item, index) => (
                <GridCard key={index} item={item} />
            ))}
        </div>
    );
}

function GridCard({ item }: { item: GridItem }) {
    const Content = (
        <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden group shadow-lg transition-transform hover:scale-[1.02]">
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
            <div className="absolute inset-0 p-5 flex flex-col justify-end text-white">
                {(item.title || item.subtitle) && (
                    <div className="space-y-1">
                        {item.subtitle && (
                            <span className="inline-block px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-[10px] font-bold tracking-wider uppercase mb-1">
                                {item.subtitle}
                            </span>
                        )}
                        {item.title && (
                            <h3 className="text-xl font-bold tracking-tight drop-shadow-md">
                                {item.title}
                            </h3>
                        )}
                    </div>
                )}

                {item.overlayText && (
                    <div className="absolute top-3 right-3 bg-black/30 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold border border-white/20">
                        {item.overlayText}
                    </div>
                )}

                {item.linkUrl && (
                    <div className="absolute top-3 right-3 p-1.5 rounded-full bg-white/10 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
                        <ExternalLink className="w-3.5 h-3.5 text-white" />
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
                className="block w-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-3xl"
            >
                {Content}
            </a>
        );
    }

    return Content;
}
