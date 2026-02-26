import type React from "react";
import Image from "next/image";
import { ExternalLink } from "lucide-react";

interface ImageHeroProps {
    imageUrl: string;
    linkUrl?: string;
    alt: string;
    title?: string;
    subtitle?: string;
    overlayText?: string;
    className?: string;
}

export function ImageHero({
    imageUrl,
    linkUrl,
    alt,
    title,
    subtitle,
    overlayText,
    className = "",
}: ImageHeroProps) {
    const Content = (
        <div className={`relative w-full aspect-[21/9] rounded-3xl overflow-hidden group shadow-lg transition-transform hover:scale-[1.01] ${className}`}>
            <Image
                src={imageUrl}
                alt={alt}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                unoptimized
            />

            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

            {/* Content Layer */}
            <div className="absolute inset-0 p-6 flex flex-col justify-end text-white">
                {(title || subtitle) && (
                    <div className="space-y-1">
                        {subtitle && (
                            <span className="inline-block px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-[10px] font-bold tracking-wider uppercase mb-1">
                                {subtitle}
                            </span>
                        )}
                        {title && (
                            <h3 className="text-2xl font-bold tracking-tight drop-shadow-md">
                                {title}
                            </h3>
                        )}
                    </div>
                )}

                {overlayText && (
                    <div className="absolute top-4 right-4 bg-black/30 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold border border-white/20">
                        {overlayText}
                    </div>
                )}

                {linkUrl && (
                    <div className="absolute top-4 right-4 p-2 rounded-full bg-white/10 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
                        <ExternalLink className="w-4 h-4 text-white" />
                    </div>
                )}
            </div>
        </div>
    );

    if (linkUrl) {
        return (
            <a
                href={linkUrl}
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
