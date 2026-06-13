import { describe, it, expect } from "vitest";
import { getBlogPosts, parseFrontmatter } from "./blog";

describe("getBlogPosts", () => {
  const posts = getBlogPosts();

  it("returns at least 10 entries", () => {
    expect(posts.length).toBeGreaterThanOrEqual(10);
  });

  it("every entry has non-empty slug, metadata.title, metadata.publishedAt, and content", () => {
    for (const post of posts) {
      expect(typeof post.slug).toBe("string");
      expect(post.slug.length).toBeGreaterThan(0);
      expect(typeof post.metadata.title).toBe("string");
      expect(post.metadata.title.length).toBeGreaterThan(0);
      expect(typeof post.metadata.publishedAt).toBe("string");
      expect(post.metadata.publishedAt.length).toBeGreaterThan(0);
      expect(typeof post.content).toBe("string");
      expect(post.content.length).toBeGreaterThan(0);
    }
  });

  it("every metadata.publishedAt is a valid date", () => {
    for (const post of posts) {
      expect(!isNaN(new Date(post.metadata.publishedAt).getTime())).toBe(true);
    }
  });

  it("slugs are unique", () => {
    const slugs = posts.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("contains an entry with slug 'why-i-build'", () => {
    expect(posts.some((p) => p.slug === "why-i-build")).toBe(true);
  });
});

describe("parseFrontmatter", () => {
  it("throws matching /frontmatter/i when there are no --- delimiters", () => {
    expect(() => parseFrontmatter("title: Hello\nNo delimiters here")).toThrow(
      /frontmatter/i
    );
  });

  it("throws naming 'title' when title field is missing", () => {
    const content = `---
publishedAt: "2026-01-01"
summary: "A summary"
---
Body content`;
    expect(() => parseFrontmatter(content)).toThrow(/title/);
  });

  it("throws when publishedAt is not a valid date", () => {
    const content = `---
title: "My Post"
publishedAt: not-a-date
summary: "A summary"
---
Body content`;
    expect(() => parseFrontmatter(content)).toThrow(/not a valid date|publishedAt/i);
  });

  it("round-trips title, summary, and publishedAt from valid frontmatter", () => {
    const content = `---
title: "Hello World"
publishedAt: "2026-03-15"
summary: "This is a summary"
---
The body text`;
    const { metadata, content: body } = parseFrontmatter(content);
    expect(metadata.title).toBe("Hello World");
    expect(metadata.publishedAt).toBe("2026-03-15");
    expect(metadata.summary).toBe("This is a summary");
    expect(body).toBe("The body text");
  });
});
