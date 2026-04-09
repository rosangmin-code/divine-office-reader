import fs from "fs/promises"
import path from "path"
import { NextResponse } from "next/server"
import { ALL_CONTENT_GROUPS } from "@/modules/shared"
import type { ContentGroup } from "@/modules/shared"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ group: string }> }
) {
  const { group } = await params
  if (!ALL_CONTENT_GROUPS.includes(group as ContentGroup)) {
    return NextResponse.json({ error: "Invalid group" }, { status: 404 })
  }

  const filePath = path.join(process.cwd(), "public", "data", "content", `${group}.json`)
  try {
    const data = await fs.readFile(filePath, "utf-8")
    return new NextResponse(data, {
      headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=31536000, immutable" },
    })
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
}
