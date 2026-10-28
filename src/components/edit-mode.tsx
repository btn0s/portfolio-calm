"use client";

import { useEffect, useState } from "react";

// Dev-only inline editor: add ?edit to a post's URL and its prose becomes editable. Save
// writes the changes back to the MDX; Copy puts a before/after list on the clipboard.
const BLOCKS = ".post > p, .post > h2, .post > h3, .post > ul > li, .post > ol > li, .post > blockquote > p";

// The block's inline markup as markdown, so bold, italics, code and links survive the edit.
function toMarkdown(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
  if (!(node instanceof HTMLElement)) return "";
  const inner = [...node.childNodes].map(toMarkdown).join("");
  switch (node.tagName) {
    case "STRONG":
    case "B":
      return inner.trim() ? `**${inner}**` : inner;
    case "EM":
    case "I":
      return inner.trim() ? `*${inner}*` : inner;
    case "CODE":
      return `\`${node.textContent}\``;
    case "A":
      return `[${inner}](${node.getAttribute("href")})`;
    case "BR":
      return " ";
    default:
      return inner;
  }
}

type Change = { el: HTMLElement; before: string; after: string };

export function EditMode({ slug }: { slug: string }) {
  const [on, setOn] = useState(false);
  const [changes, setChanges] = useState<Change[]>([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!new URLSearchParams(location.search).has("edit")) return;
    setOn(true);
    const els = [...document.querySelectorAll<HTMLElement>(BLOCKS)];
    const original = new Map(els.map((el) => [el, { text: el.textContent ?? "", md: el.tagName.startsWith("H") ? el.textContent ?? "" : toMarkdown(el) }]));
    const collect = () => {
      const list: Change[] = [];
      for (const [el, o] of original) {
        const md = el.tagName.startsWith("H") ? el.textContent ?? "" : toMarkdown(el);
        const changed = md !== o.md;
        el.classList.toggle("edited", changed);
        if (changed) list.push({ el, before: o.text, after: md });
      }
      setChanges(list);
    };
    for (const el of els) {
      el.contentEditable = "true";
      el.spellcheck = true;
      el.classList.add("editable");
      el.addEventListener("input", collect);
      // Keep paste plain, so no stray styles end up in the post.
      el.addEventListener("paste", (e) => {
        e.preventDefault();
        document.execCommand("insertText", false, e.clipboardData?.getData("text/plain") ?? "");
      });
      // One block is one line of MDX, so Enter ends the edit instead of splitting it.
      el.addEventListener("keydown", (e) => e.key === "Enter" && (e.preventDefault(), el.blur()));
    }
    document.documentElement.classList.add("edit-mode");
  }, []);

  if (!on) return null;

  const list = () => changes.map((c) => `BEFORE: ${c.before}\nAFTER:  ${c.after}`).join("\n\n");
  const copy = async () => {
    await navigator.clipboard.writeText(`Edits to ${slug}:\n\n${list()}`);
    setStatus("Copied");
  };
  const save = async () => {
    setStatus("Saving…");
    const res = await fetch("/api/dev-edit", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug, edits: changes.map(({ before, after }) => ({ before, after })) }) });
    const out = (await res.json()) as { applied: number; missed: string[] };
    if (out.missed.length) {
      setStatus(`Saved ${out.applied}, couldn't place ${out.missed.length}. Copy those instead.`);
      setChanges((cs) => cs.filter((c) => out.missed.includes(c.before)));
      return;
    }
    setStatus(`Saved ${out.applied}`);
    setTimeout(() => location.reload(), 500);
  };

  return (
    <div className="edit-bar" role="toolbar" aria-label="Edit post">
      <span>
        {changes.length ? `${changes.length} edit${changes.length > 1 ? "s" : ""}` : "Click any text to edit"}
        {status && ` · ${status}`}
      </span>
      <button type="button" onClick={copy} disabled={!changes.length}>
        Copy edits
      </button>
      <button type="button" className="primary" onClick={save} disabled={!changes.length}>
        Save
      </button>
    </div>
  );
}
