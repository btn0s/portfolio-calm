'use client'

import Image from 'next/image'
import { RotateCcw, X } from 'lucide-react'
import { motion } from 'framer-motion'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import { createPortal } from 'react-dom'

export type ArtifactMedia = {
  id: string
  kind: 'image' | 'video'
  src: string
  alt: string
  caption: string
}

export type ArtifactDeskProps = {
  title: string
  year: string
  description: string
  metadata: Array<{ label: string; value: string }>
  brief: {
    title: string
    paragraphs: string[]
    facts?: Array<{ label: string; value: string }>
  }
  media: ArtifactMedia[]
  note?: { label: string; text: string }
  principle?: { label: string; text: string }
  externalLink?: { label: string; href: string }
}

type DeskItemProps = {
  children: React.ReactNode
  className: string
  label: string
  rotation?: number
  x?: number
  y?: number
  z: number
  dragEnabled: boolean
  style?: React.CSSProperties
  onFocus: () => void
  onTap?: () => void
}

function DeskItem({
  children,
  className,
  label,
  rotation = 0,
  x = 0,
  y = 0,
  z,
  dragEnabled,
  style,
  onFocus,
  onTap,
}: DeskItemProps) {
  const didDrag = useRef(false)

  return (
    <motion.article
      aria-label={label}
      role={onTap ? 'button' : undefined}
      className={`relative select-none focus-visible:ring-2 focus-visible:ring-white/80 md:absolute ${dragEnabled ? 'cursor-grab touch-none active:cursor-grabbing' : ''} ${className}`}
      drag={dragEnabled}
      dragMomentum={false}
      onDragStart={() => {
        didDrag.current = true
      }}
      onDragEnd={() => {
        window.setTimeout(() => {
          didDrag.current = false
        }, 0)
      }}
      initial={{ opacity: 0, scale: 0.97, x, y, rotate: rotation }}
      animate={{ opacity: 1, scale: 1, x, y, rotate: rotation }}
      whileDrag={{ scale: 1.015, rotate: 0 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', duration: 0.3, bounce: 0 }}
      style={{ ...style, zIndex: z }}
      onPointerDown={onFocus}
      onTap={() => {
        if (!didDrag.current) onTap?.()
      }}
      onKeyDown={(event) => {
        if (onTap && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault()
          onTap()
        }
      }}
      tabIndex={0}
    >
      {children}
    </motion.article>
  )
}

const PHOTO_CLASS =
  'bg-[#e8e5df] p-2.5 pb-8 text-[#171717] shadow-[0_2px_2px_rgba(0,0,0,.18),0_18px_50px_rgba(0,0,0,.38)]'

function DeskPhoto({
  image,
  priority = false,
}: {
  image: ArtifactMedia
  priority?: boolean
}) {
  return (
    <div
      draggable={false}
      onDragStart={(event) => event.preventDefault()}
      className="pointer-events-none block w-full"
    >
      <Image
        src={image.src}
        alt={image.alt}
        width={1200}
        height={675}
        priority={priority}
        draggable={false}
        sizes="(min-width: 768px) 58vw, calc(100vw - 4rem)"
        className="pointer-events-none h-auto w-full select-none outline outline-1 -outline-offset-1 outline-black/10"
      />
    </div>
  )
}

function DeskMedia({
  media,
  priority = false,
}: {
  media: ArtifactMedia
  priority?: boolean
}) {
  if (media.kind === 'video') {
    return (
      <video
        src={media.src}
        controls
        autoPlay
        muted
        loop
        playsInline
        draggable={false}
        className="block h-auto w-full outline outline-1 -outline-offset-1 outline-black/10"
      >
        Your browser does not support the video tag.
      </video>
    )
  }

  return <DeskPhoto image={media} priority={priority} />
}

function Lightbox({
  image,
  onClose,
}: {
  image: ArtifactMedia | null
  onClose: () => void
}) {
  useEffect(() => {
    if (!image) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [image, onClose])

  if (typeof document === 'undefined') return null

  return createPortal(
    image ? (
        <div
          className="fixed inset-0 z-[100] grid place-items-center p-4 sm:p-10"
          role="dialog"
          aria-modal="true"
          aria-label={image.alt}
        >
          <button
            type="button"
            aria-label="Close lightbox"
            className="absolute inset-0 cursor-zoom-out bg-black/85"
            onClick={onClose}
          />
          <figure
            className={`relative z-10 w-full max-w-[min(92vw,1400px)] ${PHOTO_CLASS}`}
          >
            <DeskPhoto image={image} />
            <figcaption className="absolute bottom-2.5 left-3 font-mono text-[8px] uppercase tracking-widest text-black/45">
              {image.caption}
            </figcaption>
          </figure>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close lightbox"
            className="absolute right-4 top-4 z-20 grid size-10 place-items-center rounded-full bg-white/12 text-white shadow-[0_2px_12px_rgba(0,0,0,.25)] transition-[background-color,transform] hover:bg-white/20 active:scale-[0.96] sm:right-6 sm:top-6"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>
      ) : null,
    document.body,
  )
}

function subscribeToDesktopBreakpoint(callback: () => void) {
  const mediaQuery = window.matchMedia('(min-width: 768px)')
  mediaQuery.addEventListener('change', callback)
  return () => mediaQuery.removeEventListener('change', callback)
}

function getDesktopSnapshot() {
  return window.matchMedia('(min-width: 768px)').matches
}

function getServerDesktopSnapshot() {
  return false
}

const MEDIA_POSITIONS = [
  { left: '34%', top: '72px', width: '58%', rotation: 1.4 },
  { left: '8%', top: '610px', width: '44%', rotation: 2.1 },
  { left: '55%', top: '748px', width: '39%', rotation: -1.8 },
  { left: '7%', top: '1080px', width: '42%', rotation: -1.2 },
  { left: '53%', top: '1105px', width: '40%', rotation: 1.7 },
  { left: '10%', top: '1450px', width: '39%', rotation: 1.1 },
  { left: '54%', top: '1475px', width: '39%', rotation: -1.4 },
] as const

export function ArtifactDesk({
  title,
  year,
  description,
  metadata,
  brief,
  media,
  note,
  principle,
  externalLink,
}: ArtifactDeskProps) {
  const deskRef = useRef<HTMLDivElement>(null)
  const [lightboxImage, setLightboxImage] = useState<ArtifactMedia | null>(null)
  const closeLightbox = useCallback(() => setLightboxImage(null), [])
  const [resetKey, setResetKey] = useState(0)
  const [, setZCounter] = useState(10)
  const [layers, setLayers] = useState<Record<string, number>>({
    brief: 2,
    media0: 5,
    media1: 4,
    note: 6,
    media2: 3,
    quote: 7,
  })
  const isDesktop = useSyncExternalStore(
    subscribeToDesktopBreakpoint,
    getDesktopSnapshot,
    getServerDesktopSnapshot,
  )

  function bringForward(id: string) {
    setZCounter((current) => {
      const next = current + 1
      setLayers((existing) => ({ ...existing, [id]: next }))
      return next
    })
  }

  function resetDesk() {
    setResetKey((current) => current + 1)
    setZCounter(10)
    setLayers({ brief: 2, media0: 5, media1: 4, note: 6, media2: 3, quote: 7 })
  }

  const extraRows = Math.max(0, Math.ceil((media.length - 3) / 2))
  const desktopDeskHeight = 1160 + extraRows * 370

  return (
    <>
      <section className="relative left-1/2 w-[calc(100vw-2rem)] max-w-[1600px] -translate-x-1/2 pb-16 pt-4 sm:pt-7">
      <header className="relative z-10 mx-auto mb-6 grid max-w-[1500px] grid-cols-1 gap-8 px-1 sm:px-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:gap-12">
        <div className="max-w-4xl">
          <div className="mb-4 flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/40">
            <span>Selected work</span>
            <span className="h-px w-10 bg-foreground/20" />
            <span>{year}</span>
          </div>
          <h1 className="text-balance font-sans-header text-5xl leading-[0.88] tracking-[-0.045em] sm:text-6xl md:text-7xl">
            {title}
          </h1>
          <p className="mt-5 max-w-[36ch] text-pretty text-base leading-snug text-foreground/55 sm:text-lg">
            {description}
          </p>
          <dl className="mt-7 grid max-w-xl grid-cols-3 gap-x-5 font-mono text-[8px] uppercase tracking-[0.16em]">
            {metadata.slice(0, 3).map((item) => (
              <div key={item.label}>
                <dt className="mb-1 text-foreground/30">{item.label}</dt>
                <dd className="text-foreground/65">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="hidden md:flex md:items-end">
          <button
            type="button"
            onClick={resetDesk}
            className="group hidden min-h-10 items-center gap-2 rounded-full bg-foreground/8 px-4 font-mono text-[10px] uppercase tracking-widest text-foreground/60 transition-[background-color,color,transform] hover:bg-foreground/14 hover:text-foreground active:scale-[0.96] md:flex"
          >
            <RotateCcw
              aria-hidden="true"
              className="size-3.5 transition-transform duration-300 group-hover:-rotate-45"
            />
            Reset desk
          </button>
        </div>
      </header>

      <div
        ref={deskRef}
        className="relative overflow-visible md:min-h-[var(--desktop-desk-height)] md:overflow-hidden md:rounded-[3px] md:bg-[#1d2225] md:shadow-[inset_0_1px_rgba(255,255,255,.06),inset_0_0_100px_rgba(0,0,0,.32),0_24px_80px_rgba(0,0,0,.18)]"
        style={{ '--desktop-desk-height': `${desktopDeskHeight}px` } as React.CSSProperties}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 hidden md:block"
          style={{
            backgroundImage:
              'radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,.3) 100%), linear-gradient(rgba(157,190,210,.11) 1px, transparent 1px), linear-gradient(90deg, rgba(157,190,210,.11) 1px, transparent 1px), linear-gradient(rgba(157,190,210,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(157,190,210,.045) 1px, transparent 1px)',
            backgroundSize:
              '100% 100%, 120px 120px, 120px 120px, 24px 24px, 24px 24px',
          }}
        />

        <div
          key={resetKey}
          className="relative z-10 flex flex-col gap-7 md:static md:block"
        >
          <DeskItem
            label="Project brief"
            dragEnabled={isDesktop}
            className="flex min-h-[330px] w-full flex-col bg-[#f0eee8] p-7 text-[#1d1d1b] shadow-[0_2px_2px_rgba(0,0,0,.2),0_18px_45px_rgba(0,0,0,.32)] md:left-[5%] md:top-[132px] md:min-h-0 md:w-[28%] md:max-w-[390px]"
            rotation={-2.2}
            z={layers.brief}
            onFocus={() => bringForward('brief')}
          >
            <div className="mb-8 flex items-start justify-between border-b border-black/15 pb-3 font-mono text-[8px] uppercase tracking-[0.18em]">
              <span>Project brief</span>
              <span>2026 / 01</span>
            </div>
            <h2 className="mb-4 text-balance font-sans-header text-4xl leading-[0.9] tracking-[-0.04em]">
              {brief.title}
            </h2>
            <div className="space-y-3 text-pretty text-sm leading-relaxed text-black/65">
              {brief.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            {externalLink ? (
              <a
                href={externalLink.href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex min-h-10 w-fit items-center font-mono text-[9px] uppercase tracking-widest underline decoration-black/25 underline-offset-4 transition-colors hover:text-black/55"
              >
                {externalLink.label} ↗
              </a>
            ) : null}
            {brief.facts?.length ? (
              <dl className="mt-9 grid grid-cols-2 gap-x-5 gap-y-4 border-t border-black/15 pt-4 font-mono text-[8px] uppercase tracking-wider">
                {brief.facts.map((fact) => (
                  <div key={fact.label}>
                    <dt className="mb-1 text-black/35">{fact.label}</dt>
                    <dd>{fact.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </DeskItem>

          {media.map((item, index) => {
            const position = MEDIA_POSITIONS[index] ?? {
              left: index % 2 === 0 ? '8%' : '53%',
              top: `${1080 + Math.floor((index - 3) / 2) * 370}px`,
              width: '40%',
              rotation: index % 2 === 0 ? -1.2 : 1.4,
            }
            const layerKey = `media${index}`
            return (
              <DeskItem
                key={item.id}
                label={item.alt}
                dragEnabled={isDesktop}
                className={`w-full md:left-[var(--desk-left)] md:top-[var(--desk-top)] md:w-[var(--desk-width)] ${PHOTO_CLASS}`}
                rotation={position.rotation}
                z={layers[layerKey] ?? 3}
                onFocus={() => bringForward(layerKey)}
                onTap={item.kind === 'image' ? () => setLightboxImage(item) : undefined}
                style={{
                  '--desk-left': position.left,
                  '--desk-top': position.top,
                  '--desk-width': position.width,
                } as React.CSSProperties}
                x={0}
                y={0}
              >
                <div>
                  <DeskMedia media={item} priority={index === 0} />
                </div>
                <span className="absolute bottom-2.5 left-3 font-mono text-[8px] uppercase tracking-widest text-black/45">
                  {item.caption}
                </span>
              </DeskItem>
            )
          })}

          {note ? (
            <DeskItem
              label={note.label}
              dragEnabled={isDesktop}
              className="flex min-h-[190px] w-full flex-col justify-between bg-[#d8ee72] p-6 pb-8 text-[#273010] shadow-[0_3px_3px_rgba(0,0,0,.16),0_16px_38px_rgba(0,0,0,.3)] md:left-[45%] md:top-[570px] md:min-h-0 md:w-56"
              rotation={-4.5}
              z={layers.note}
              onFocus={() => bringForward('note')}
            >
              <span className="font-mono text-[8px] uppercase tracking-widest opacity-50">
                {note.label}
              </span>
              <p className="mt-5 font-serif text-2xl italic leading-tight">
                {note.text}
              </p>
              <div className="mt-8 h-px w-12 bg-current opacity-35" />
            </DeskItem>
          ) : null}

          {principle ? (
            <DeskItem
              label={principle.label}
              dragEnabled={isDesktop}
              className="flex min-h-[170px] w-full flex-col justify-between bg-[#b8cae9] p-7 text-[#172339] shadow-[0_3px_3px_rgba(0,0,0,.16),0_16px_38px_rgba(0,0,0,.3)] md:left-[15%] md:top-[955px] md:min-h-0 md:w-[32%] md:max-w-[420px]"
              rotation={-1}
              z={layers.quote}
              onFocus={() => bringForward('quote')}
            >
              <span className="font-mono text-[8px] uppercase tracking-[0.2em] opacity-45">
                {principle.label}
              </span>
              <blockquote className="mt-4 text-pretty font-sans-header text-3xl leading-[0.95] tracking-[-0.035em]">
                “{principle.text}”
              </blockquote>
            </DeskItem>
          ) : null}
        </div>
      </div>
      </section>
      <Lightbox image={lightboxImage} onClose={closeLightbox} />
    </>
  )
}
