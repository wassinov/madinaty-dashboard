'use client'

import { cn } from "@/lib/utils/formatting"
import { useTranslations } from "next-intl"

export type BrandLogoSize = "sm" | "md" | "lg" | "xl"
export type BrandLogoAlign = "left" | "center" | "right"

type BrandLogoProps = {
  /** md = text-4xl, lg = text-5xl, xl = text-6xl */
  size?: BrandLogoSize
  align?: BrandLogoAlign
  /** Mode compact : n'affiche que la première lettre du wordmark. */
  compact?: boolean
  /** `false` = wordmark seul (sans séparateur ni slogan), pour le header. */
  slogan?: boolean
  className?: string
}

const SIZE_CLASS: Record<BrandLogoSize, string> = {
  sm: "text-3xl",
  md: "text-4xl",
  lg: "text-5xl",
  xl: "text-6xl",
}

const ALIGN_CLASS: Record<BrandLogoAlign, string> = {
  left: "items-start text-left",
  center: "items-center text-center",
  right: "items-end text-right",
}

const BRAND = "مدينتي"
const BRAND_LABEL = "Madinaty — مدينتي"

export function BrandLogo({
  size = "md",
  align = "center",
  compact = false,
  slogan = true,
  className,
}: BrandLogoProps) {
  const t = useTranslations("brand")
  if (compact) {
    return (
      <span
        role="img"
        aria-label={BRAND_LABEL}
        className={cn(
          "font-brand leading-none text-[#004AAD] dark:text-[oklch(0.72 0.13 255)]",
          SIZE_CLASS[size],
          className
        )}
      >
        م
      </span>
    )
  }

  if (!slogan) {
    return (
      <span
        role="img"
        aria-label={BRAND_LABEL}
        className={cn(
          "font-brand leading-none text-[#004AAD] dark:text-[oklch(0.72 0.13 255)]",
          SIZE_CLASS[size],
          className
        )}
      >
        {BRAND}
      </span>
    )
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-0.5 font-brand",
        ALIGN_CLASS[align],
        className
      )}
    >
      <span
        className={cn(
          "leading-none text-[#004AAD] dark:text-[oklch(0.72 0.13 255)]",
          SIZE_CLASS[size]
        )}
      >
        {BRAND}
      </span>
      <span className="h-px w-12 bg-[var(--st-ok)]/40" aria-hidden="true" />
      <span className="text-[10px] leading-tight text-[oklch(0.53_0.13_156)] dark:text-[var(--st-ok)]">
        {t("slogan")}
      </span>
    </div>
  )
}