import { execFile } from "child_process";
import { promisify } from "util";

const run = promisify(execFile);

/** Runs git in the repo and returns its trimmed output. */
export async function git(...args: string[]) {
  const { stdout } = await run("git", args, { cwd: process.cwd() });
  return stdout.trim();
}
