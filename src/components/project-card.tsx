import Link from 'next/link'

export interface Project {
  title: string
  description: string
  href: string
  date?: string
  tags?: string[]
  thumbnail?: string
}

interface ProjectCardProps {
  project: Project
  className?: string
}

export function ProjectCard({ project, className = '' }: ProjectCardProps) {
  return (
    <Link
      href={project.href}
      className={`group flex flex-col gap-2 ${className}`}
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-baseline gap-2">
          <h3 className="font-medium text-sm text-foreground group-hover:text-muted-foreground transition-colors">
            {project.title}
          </h3>
          {project.date && (
            <span className="text-xs text-muted-foreground font-mono">
              {project.date}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{project.description}</p>
        {project.tags && project.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-1">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs text-muted-foreground font-mono"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}
