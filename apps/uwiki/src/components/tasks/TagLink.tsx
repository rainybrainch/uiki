"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"

export function TagLink({ tag, children }: { tag: string; children: React.ReactNode }) {
  const params = useSearchParams()
  const view = params.get("view") ?? "all"
  const project = params.get("project")
  const currentTag = params.get("tag")

  // 同じタグを再クリックした場合はフィルター解除
  const isSame = currentTag === tag
  const href = isSame
    ? `/tasks?view=${view}${project ? `&project=${project}` : ""}`
    : `/tasks?view=${view}${project ? `&project=${project}` : ""}&tag=${encodeURIComponent(tag)}`

  return (
    <Link
      href={href}
      onClick={(e) => e.stopPropagation()}
      className="text-[10px] badge transition-opacity"
      style={{
        fontWeight: isSame ? 700 : 400,
        opacity: isSame ? 1 : undefined,
        outline: isSame ? "1px solid var(--accent)" : undefined,
      }}
      aria-pressed={isSame}
      aria-label={isSame ? `タグ「${tag}」のフィルターを解除` : `タグ「${tag}」で絞り込む`}
    >
      {children}
    </Link>
  )
}
