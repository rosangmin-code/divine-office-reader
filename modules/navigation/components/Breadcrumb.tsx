"use client"

import type { BookmarkNode } from "@/modules/shared"

interface Props {
  bookmarks: BookmarkNode
  activeId: string | null
}

/** activeId까지의 경로를 찾아 반환 */
function findPath(node: BookmarkNode, targetId: string): BookmarkNode[] | null {
  if (node.id === targetId) return [node]
  for (const child of node.children) {
    const path = findPath(child, targetId)
    if (path) return [node, ...path]
  }
  return null
}

export default function Breadcrumb({ bookmarks, activeId }: Props) {
  if (!activeId) return null

  const path = findPath(bookmarks, activeId)
  if (!path || path.length <= 1) return null

  // Skip root, show intermediate + leaf
  const crumbs = path.slice(1)

  return (
    <div className="px-4 py-1.5 text-xs text-stone-400 dark:text-stone-500 border-b border-stone-100 dark:border-stone-800/50 bg-stone-50/50 dark:bg-stone-900/50 truncate">
      {crumbs.map((node, i) => (
        <span key={node.id}>
          {i > 0 && <span className="mx-1.5">/</span>}
          <span className={i === crumbs.length - 1 ? "text-stone-600 dark:text-stone-300" : ""}>
            {node.titleMn || node.title}
          </span>
        </span>
      ))}
    </div>
  )
}
