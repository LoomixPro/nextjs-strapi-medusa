"use client"

import React, { useState, useRef } from "react"
import {
  Play,
  Pause,
  Copy,
  Check,
  ShoppingBag,
  Volume2,
  VolumeX,
  ArrowLeft,
  ArrowRight,
} from "lucide-react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { cn } from "@lib/utils"
import { useTranslations } from "next-intl"

// Interactive copy box for storefront advertisements
export function AdPromoBox({
  title,
  content,
  code,
  link,
  buttonText,
  sponsoredText,
  isRtl,
}: {
  title: string
  content: string
  code?: string
  link?: string
  buttonText: string
  sponsoredText: string
  isRtl: boolean
}) {
  const [copied, setCopied] = useState(false)
  const t = useTranslations("Blog")

  const handleCopy = async () => {
    if (code) {
      try {
        await navigator.clipboard.writeText(code)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error("Failed to copy code: ", err)
      }
    }
  }

  return (
    <div className="my-10 w-full relative overflow-hidden rounded-3xl border border-amber-500/30 dark:border-amber-500/20 bg-gradient-to-br from-amber-500/[0.08] via-yellow-500/[0.03] to-amber-700/[0.08] dark:from-amber-950/20 dark:to-yellow-950/10 p-6 md:p-8 shadow-xl">
      {/* Background patterns */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Sponsored Tag */}
      <span
        className={cn(
          "absolute top-4 bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider",
          isRtl ? "left-4" : "right-4"
        )}
      >
        {sponsoredText}
      </span>

      <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
        <div
          className={cn(
            "space-y-2 text-center md:text-start",
            isRtl ? "md:text-right" : "md:text-left"
          )}
        >
          <h4 className="text-xl md:text-2xl font-black text-foreground flex items-center justify-center md:justify-start gap-2">
            <ShoppingBag className="text-amber-500" size={20} />
            {title}
          </h4>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-xl">
            {content}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto justify-center md:justify-end">
          {code && (
            <button
              onClick={handleCopy}
              className="flex items-center justify-between gap-3 px-4 py-3 bg-background border border-border/80 hover:border-amber-500/50 rounded-2xl w-full sm:w-auto group transition-all"
              title="Click to copy promo code"
            >
              <div className="text-start">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                  {t("promo_code")}
                </p>
                <p className="font-mono font-bold text-foreground text-sm">
                  {code}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-muted text-muted-foreground group-hover:text-amber-600 transition-colors">
                {copied ? (
                  <Check size={16} className="text-green-500" />
                ) : (
                  <Copy size={16} />
                )}
              </div>
            </button>
          )}

          {link && (
            <LocalizedClientLink
              href={link}
              className="flex items-center justify-center gap-2 px-6 py-3.5 bg-foreground text-background font-bold text-sm rounded-2xl hover:bg-amber-600 hover:text-white transition-all w-full sm:w-auto shadow-md"
            >
              <span>{buttonText}</span>
              {isRtl ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
            </LocalizedClientLink>
          )}
        </div>
      </div>
    </div>
  )
}

// Styled Video Player for Blog Articles
export function BlogVideoPlayer({
  videoUrl,
  posterUrl,
  altText,
}: {
  videoUrl: string
  posterUrl?: string
  altText?: string
}) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Helper to extract YouTube video ID from various YouTube URL formats
  const getYouTubeId = (url: string) => {
    if (!url) return null
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return match && match[2].length === 11 ? match[2] : null
  }

  const youtubeId = getYouTubeId(videoUrl)

  // If it's a YouTube URL, render an iframe instead
  if (youtubeId) {
    return (
      <div className="my-8 overflow-hidden rounded-3xl border border-border/60 bg-black aspect-video relative shadow-lg">
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}?rel=0`}
          title={altText || "YouTube video player"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 w-full h-full border-0"
        ></iframe>
      </div>
    )
  }

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
        setIsPlaying(false)
      } else {
        videoRef.current
          .play()
          .catch((err) => console.error("Playback failed", err))
        setIsPlaying(true)
      }
    }
  }

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  return (
    <div className="my-8 overflow-hidden rounded-3xl border border-border/60 bg-black aspect-video relative group shadow-lg">
      <video
        ref={videoRef}
        src={videoUrl}
        poster={posterUrl}
        loop
        muted={isMuted}
        playsInline
        onClick={togglePlay}
        className="w-full h-full object-cover cursor-pointer"
      />

      {/* Video controls overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none flex flex-col justify-end p-4 md:p-6">
        <div className="flex items-center justify-between w-full pointer-events-auto">
          {/* Play/Pause Button */}
          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-white/90 dark:bg-black/80 backdrop-blur-md text-foreground flex items-center justify-center hover:scale-105 transition-transform"
          >
            {isPlaying ? (
              <Pause size={18} />
            ) : (
              <Play size={18} className="ml-0.5" />
            )}
          </button>

          {/* Mute Button */}
          <button
            onClick={toggleMute}
            className="w-10 h-10 rounded-full bg-white/90 dark:bg-black/80 backdrop-blur-md text-foreground flex items-center justify-center hover:scale-105 transition-transform"
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>
      </div>

      {/* Center Big Play Button (when paused) */}
      {!isPlaying && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-white/90 dark:bg-black/85 backdrop-blur-lg text-foreground flex items-center justify-center shadow-2xl hover:scale-110 transition-transform animate-pulse"
        >
          <Play size={26} className="ml-1 text-primary" />
        </button>
      )}
    </div>
  )
}
