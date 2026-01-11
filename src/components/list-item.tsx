import Link from 'next/link'
import { cn } from "@/lib/utils"

interface ListItemProps {
  title: string
  description?: string
  subtext?: string
  date?: string
  href?: string
  underline?: boolean
  className?: string
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
  target,
  rel,
}: ListItemProps) {
  const isExternal = href?.startsWith('http') || href?.startsWith('mailto')
  const Component = href ? (isExternal ? 'a' : Link) : 'div'
  
  const content = (
    <>
      <div className="flex justify-between items-baseline mb-1">
        <span className={cn(
          "font-bold uppercase text-xs text-pretty",
          href && underline && "underline decoration-dotted underline-offset-2 group-hover:decoration-solid"
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
        <p className="text-[10px] leading-tight opacity-70 mb-1 max-w-[75%]">
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

  return (
    <Component
      href={href as any}
      target={target}
      rel={rel}
      className={cn(
        "group block transition-all",
        href && "border-l-2 border-transparent hover:border-current/20 hover:pl-2",
        className
      )}
    >
      {content}
    </Component>
  )
}
