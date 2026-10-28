import { NextResponse } from "next/server";
import { git } from "../git";

// Dev-only: GET says how many local commits aren't live yet; POST pushes them to main,
// which Vercel deploys. Only ever a fast-forward: if main has moved on, it refuses.
const dev = () => process.env.NODE_ENV === "development";

async function pending() {
  await git("fetch", "-q", "origin", "main");
  return Number(await git("rev-list", "--count", "origin/main..HEAD"));
}

export async function GET() {
  if (!dev()) return new NextResponse(null, { status: 404 });
  return NextResponse.json({ pending: await pending(), branch: await git("rev-parse", "--abbrev-ref", "HEAD") });
}

export async function POST() {
  if (!dev()) return new NextResponse(null, { status: 404 });
  try {
    const count = await pending();
    if (!count) return NextResponse.json({ pushed: 0 });
    await git("push", "origin", "HEAD:main");
    // Keep the local main in step, unless it's the branch we're on (then it already is).
    if ((await git("rev-parse", "--abbrev-ref", "HEAD")) !== "main") await git("fetch", ".", "HEAD:main");
    return NextResponse.json({ pushed: count });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message.split("\n").slice(0, 3).join(" ") }, { status: 500 });
  }
}
