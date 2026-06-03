import type { ReactNode } from "react"

export function PageHeader({
  icon,
  title,
  subtitle,
  right,
}: {
  icon: ReactNode
  title: string
  subtitle?: string
  right?: ReactNode
}) {
  return (
    <div className="flex items-start justify-between mb-6 md:mb-8">
      <div className="flex items-center gap-3">
        <span className="shrink-0">{icon}</span>
        <div>
          <h1 className="text-xl md:text-2xl font-serif font-light tracking-wide">{title}</h1>
          {subtitle && <p className="text-xs text-dim mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  )
}
