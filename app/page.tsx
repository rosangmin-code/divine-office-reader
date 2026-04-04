import fs from "fs"
import path from "path"
import { BookmarkNode, SectionContent } from "@/lib/types"
import ReaderShell from "@/components/ReaderShell"

export default function HomePage() {
  const dataDir = path.join(process.cwd(), "public", "data")
  const bookmarks: BookmarkNode = JSON.parse(
    fs.readFileSync(path.join(dataDir, "bookmarks.json"), "utf-8")
  )
  const content: Record<string, SectionContent> = JSON.parse(
    fs.readFileSync(path.join(dataDir, "content.json"), "utf-8")
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

  return <ReaderShell bookmarks={bookmarks} content={content} orderedIds={orderedIds} />
}
