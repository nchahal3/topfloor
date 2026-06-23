import React from "react"
import Link from "next/link"

type RealismVariant = "green" | "gold"

interface RealismButtonProps {
  text: string
  /** Accent colour of the glow/blob. Two variations: brand green or logo gold. */
  variant?: RealismVariant
  /** When set, renders as a link (Next.js) instead of a button. */
  href?: string
  onClick?: () => void
  className?: string
}

// Per-variant accent classes (the blob + glow). Body stays the dark "realism" look.
const ACCENTS: Record<
  RealismVariant,
  { blob: string; innerGlow: string }
> = {
  green: {
    blob:
      "bg-[radial-gradient(circle_60px_at_0%_100%,_#3fff75,_#00ff8050,_transparent)] shadow-[-2px_9px_40px_#00ff2d40] group-hover:shadow-[-4px_1px_45px_#00ff2d60]",
    innerGlow:
      "bg-[radial-gradient(circle_60px_at_0%_100%,_#00e1ff1a,_#0000ff11,_transparent)]",
  },
  gold: {
    blob:
      "bg-[radial-gradient(circle_60px_at_0%_100%,_#ffd66b,_#f5b54450,_transparent)] shadow-[-2px_9px_40px_#f5b54440] group-hover:shadow-[-4px_1px_45px_#f5b54460]",
    innerGlow:
      "bg-[radial-gradient(circle_60px_at_0%_100%,_#ffd66b1a,_#f5b54411,_transparent)]",
  },
}

const RealismButton: React.FC<RealismButtonProps> = ({
  text,
  variant = "green",
  href,
  onClick,
  className = "",
}) => {
  const accent = ACCENTS[variant]

  const shell = `group relative inline-block p-[2px] rounded-[14px] text-[0.8rem] sm:text-[0.95rem] border-none cursor-pointer bg-[radial-gradient(circle_80px_at_80%_-10%,_#ffffff,_#181b1b)] transition-all ${className}`

  const inner = (
    <>
      {/* Glow behind button */}
      <div className="absolute top-0 right-0 w-[65%] h-[60%] rounded-[120px] shadow-[0_0_20px_#ffffff38] group-hover:shadow-[0_0_40px_#ffffff60] transition-all duration-300 ease-out -z-10" />

      {/* Bottom-left accent blob */}
      <div
        className={`absolute bottom-0 left-0 w-[50px] h-[50%] rounded-[17px] transition-all duration-300 ease-out group-hover:w-[90px] ${accent.blob}`}
      />

      {/* Inner content */}
      <div className="relative px-[13px] py-[7px] sm:px-[18px] sm:py-[9px] group-hover:scale-110 rounded-[12px] text-white bg-[radial-gradient(circle_80px_at_80%_-50%,_#777777,_#0f1111)] z-10 transition-all duration-300">
        {text}

        {/* Inner glow layer */}
        <div
          className={`absolute inset-0 rounded-[12px] z-[-1] ${accent.innerGlow}`}
        />
      </div>
    </>
  )

  if (href) {
    // external links (http/https) open in a new tab via a plain anchor
    if (/^https?:\/\//.test(href)) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={shell}
        >
          {inner}
        </a>
      )
    }
    return (
      <Link href={href} className={shell}>
        {inner}
      </Link>
    )
  }

  return (
    <button type="button" onClick={onClick} className={shell}>
      {inner}
    </button>
  )
}

export default RealismButton
