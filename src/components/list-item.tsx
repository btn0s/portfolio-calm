import { cn } from "@/lib/utils"
import { SoundPlayingLink } from "@/components/sound-playing-link"

interface ListItemProps {
  title: string
  description?: string
  subtext?: string
  date?: string
  href?: string
  underline?: boolean
  className?: string
  titleClassName?: string
  descriptionClassName?: string
  target?: string
  rel?: string
}

export function ListItem({
  title,
  description,
  subtext,
  date,
  href,
  underline = true,
  className,
  titleClassName,
  descriptionClassName,
  target,
  rel,
}: ListItemProps) {
  const isExternal = href?.startsWith('http') || href?.startsWith('mailto')
  
  const content = (
    <>
      <div className="flex justify-between items-baseline mb-1">
        <span className={cn(
          "font-bold uppercase text-xs text-pretty",
          href && underline && "underline decoration-dotted underline-offset-2 group-hover:decoration-solid",
          titleClassName
        )}>
          {title}
        </span>
        {date && (
          <span className="shrink-0 opacity-40 text-[9px] font-mono italic">
            {date}
          </span>
        )}
      </div>
      {description && (
        <p className={cn(
          "text-[10px] leading-tight opacity-70 mb-1 max-w-[75%]",
          descriptionClassName
        )}>
          {description}
        </p>
      )}
      {subtext && (
        <span className="text-[9px] opacity-50 block truncate font-mono">
          {subtext}
        </span>
      )}
    </>
  )

  const baseClassName = cn(
    "block transition-[border-color,padding-left,opacity]",
    href && "border-l-2 border-transparent group-hover:border-current/20 group-hover:pl-2",
    className
  )

  if (!href) {
    return (
      <div className={baseClassName}>
        {content}
      </div>
    )
  }

  if (isExternal) {
    return (
      <a
        href={href}
        target={target}
        rel={rel}
        className={baseClassName}
      >
        {content}
      </a>
    )
  }

  return (
    <SoundPlayingLink
      href={href}
      sound="click"
      className={baseClassName}
    >
      {content}
    </SoundPlayingLink>
  )
}
