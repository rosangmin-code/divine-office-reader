"use client"

import { useState, useEffect, useCallback } from "react"
import { BookmarkNode } from "@/lib/types"

interface Props {
  bookmarks: BookmarkNode
  activeId: string | null
  onNavigate: (id: string) => void
}

function TreeNode({
  node,
  activeId,
  onNavigate,
  depth = 0,
}: {
  node: BookmarkNode
  activeId: string | null
  onNavigate: (id: string) => void
  depth?: number
}) {
  const [expanded, setExpanded] = useState(depth < 2)
  const hasChildren = node.children.length > 0
  const isActive = node.id === activeId
  const isLeaf = !hasChildren

  const hasActiveDescendant = useCallback(
    function check(n: BookmarkNode): boolean {
      if (n.id === activeId) return true
      return n.children.some(check)
    },
    [activeId]
  )
  const containsActive = hasActiveDescendant(node)

  // Auto-expand if descendant is active (via effect, not render phase)
  useEffect(() => {
    if (containsActive && hasChildren) {
      setExpanded(true)
    }
  }, [containsActive, hasChildren])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      if (isLeaf) {
        onNavigate(node.id)
      } else {
        setExpanded(!expanded)
      }
    } else if (e.key === "ArrowRight" && hasChildren && !expanded) {
      e.preventDefault()
      setExpanded(true)
    } else if (e.key === "ArrowLeft" && hasChildren && expanded) {
      e.preventDefault()
      setExpanded(false)
    }
  }

  return (
    <div role="treeitem" aria-expanded={hasChildren ? expanded : undefined}>
      <button
        onClick={() => {
          if (isLeaf) {
            onNavigate(node.id)
          } else {
            setExpanded(!expanded)
          }
        }}
        onKeyDown={handleKeyDown}
        aria-current={isActive ? "location" : undefined}
        className={`
          w-full text-left px-2 py-1.5 rounded text-sm flex items-center gap-1.5 transition-colors
          ${isActive ? "bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 font-medium" : ""}
          ${!isActive && containsActive ? "text-amber-700 dark:text-amber-400" : ""}
          ${!isActive && !containsActive ? "text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800" : ""}
        `}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {hasChildren && (
          <span className="text-[10px] text-stone-400 w-3 flex-shrink-0" aria-hidden="true">
            {expanded ? "\u25BC" : "\u25B6"}
          </span>
        )}
        {isLeaf && <span className="w-3 flex-shrink-0" />}
        <span className="truncate">{node.titleMn || node.title}</span>
      </button>
      {hasChildren && expanded && (
        <div role="group">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              activeId={activeId}
              onNavigate={onNavigate}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function Sidebar({ bookmarks, activeId, onNavigate }: Props) {
  const [search, setSearch] = useState("")

  const searchResults: BookmarkNode[] = []
  if (search.length >= 2) {
    const q = search.toLowerCase()
    function collectMatches(node: BookmarkNode) {
      const text = `${node.title} ${node.titleMn}`.toLowerCase()
      if (text.includes(q) && node.children.length === 0) {
        searchResults.push(node)
      }
      node.children.forEach(collectMatches)
    }
    collectMatches(bookmarks)
  }

  return (
    <aside className="w-72 md:w-80 border-r border-stone-200 dark:border-stone-800 flex flex-col bg-white dark:bg-stone-900 overflow-hidden flex-shrink-0">
      <div className="p-3 border-b border-stone-200 dark:border-stone-800">
        <label htmlFor="sidebar-search" className="sr-only">검색</label>
        <input
          id="sidebar-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Хайх... (검색)"
          className="w-full px-3 py-1.5 text-sm rounded border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
      </div>
      <nav className="flex-1 overflow-y-auto p-2" role="tree" aria-label="목차">
        {search.length >= 2 ? (
          searchResults.length > 0 ? (
            <div role="listbox" aria-label="검색 결과">
              {searchResults.map((node) => (
                <button
                  key={node.id}
                  role="option"
                  aria-selected={node.id === activeId}
                  onClick={() => {
                    onNavigate(node.id)
                    setSearch("")
                  }}
                  className="w-full text-left px-3 py-2 rounded text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                >
                  {node.titleMn || node.title}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-stone-400 p-3" role="status">검색 결과 없음</p>
          )
        ) : (
          bookmarks.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              activeId={activeId}
              onNavigate={onNavigate}
              depth={0}
            />
          ))
        )}
      </nav>
    </aside>
  )
}
