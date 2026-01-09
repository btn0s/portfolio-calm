import Link from 'next/link'
import Image from 'next/image'

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
      className={`group flex flex-col -mx-2 px-2 py-2 hover:bg-muted/50 transition-colors ${className}`}
    >
      {project.thumbnail && (
        <div className="mb-3 -mx-2 px-2 py-2 bg-muted/30">
          <Image
            src={project.thumbnail}
            alt={project.title}
            width={1200}
            height={675}
            className="w-full h-auto"
          />
        </div>
      )}
      <div className="flex items-baseline gap-2 mb-1">
        <h3 className="font-medium text-sm text-foreground">
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
    </Link>
  )
}
