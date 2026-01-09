import Link from 'next/link'
import type { Project } from './project-card'

export interface WorkItemProps {
  company: string
  title: string
  date: string
  description: string
  projects?: Project[]
  href?: string
}

export function WorkItem({
  company,
  title,
  date,
  description,
  projects,
  href,
}: WorkItemProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-4">
        <span className="text-xs text-muted-foreground font-mono tabular-nums w-32 shrink-0">
          {date}
        </span>
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h3 className="font-medium text-foreground text-sm font-sans">{title}</h3>
            {href && !projects ? (
              <Link href={href} className="text-xs text-muted-foreground font-mono hover:text-foreground transition-colors">
                @{company.toLowerCase()}
              </Link>
            ) : (
              <span className="text-xs text-muted-foreground font-mono">
                @{company.toLowerCase()}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
          {projects && projects.length > 0 && (
            <div className="mt-3 flex flex-col gap-2">
              {projects.map((project) => (
                <Link
                  key={project.href}
                  href={project.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors pl-3 border-l-2 border-muted"
                >
                  {project.title}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
