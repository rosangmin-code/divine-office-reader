import fs from "fs"
import path from "path"
import type { BookmarkNode } from "@/modules/shared"
import ReaderShell from "@/components/ReaderShell"

export default function HomePage() {
  const dataDir = path.join(process.cwd(), "public", "data")
  const bookmarks: BookmarkNode = JSON.parse(
    fs.readFileSync(path.join(dataDir, "bookmarks.json"), "utf-8")
  )

  // Build ordered list of leaf section IDs for rendering
  const orderedIds: string[] = []
  function collectLeaves(node: BookmarkNode) {
    if (node.children.length === 0) {
      orderedIds.push(node.id)
    } else {
      for (const child of node.children) {
        collectLeaves(child)
      }
    }
  }
  collectLeaves(bookmarks)

  return <ReaderShell bookmarks={bookmarks} orderedIds={orderedIds} />
}
