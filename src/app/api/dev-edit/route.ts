import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

// Dev-only: writes inline edits from <EditMode> back into a post's MDX. Each edit names a
// block by its rendered text, so we find the source line whose text matches and swap it.
type Edit = { before: string; after: string };

const flat = (s: string) => s.replace(/\s+/g, " ").trim();
const PREFIX = /^(#{1,6} |> |- |\* |\d+\. )/;
// What a line of markdown reads as once rendered.
const rendered = (line: string) =>
  flat(
    line
      .replace(PREFIX, "")
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/\*\*|__|`/g, "")
      .replace(/(^|[^*])\*([^*]+)\*/g, "$1$2"),
  );

export async function POST(req: Request) {
  if (process.env.NODE_ENV !== "development") return new NextResponse(null, { status: 404 });
  const { slug, edits } = (await req.json()) as { slug: string; edits: Edit[] };
  if (!/^[a-z0-9-]+$/.test(slug)) return NextResponse.json({ error: "bad slug" }, { status: 400 });
  const file = path.join(process.cwd(), "src", "app", "thoughts", "posts", `${slug}.mdx`);
  const lines = fs.readFileSync(file, "utf-8").split("\n");
  const missed: string[] = [];
  for (const { before, after } of edits) {
    const i = lines.findIndex((l) => l.trim() && rendered(l) === flat(before));
    if (i < 0) {
      missed.push(before);
      continue;
    }
    const prefix = lines[i].match(PREFIX)?.[0] ?? "";
    lines[i] = prefix + after.trim();
  }
  fs.writeFileSync(file, lines.join("\n"));
  return NextResponse.json({ applied: edits.length - missed.length, missed });
}
