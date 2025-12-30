"use client"

interface TwitchEmbedProps {
  channel: string
  height?: number
  parent?: string
}

export function TwitchEmbed({ channel, height = 400, parent }: TwitchEmbedProps) {
  const parentDomain = parent || (typeof window !== "undefined" ? window.location.hostname : "localhost")

  return (
    <div className="relative w-full" style={{ paddingBottom: `${(height / 16) * 9}px` }}>
      <iframe
        src={`https://player.twitch.tv/?channel=${channel}&parent=${parentDomain}&autoplay=false`}
        className="absolute top-0 left-0 w-full h-full rounded-lg"
        allowFullScreen
        title={`Twitch stream: ${channel}`}
      />
    </div>
  )
}
