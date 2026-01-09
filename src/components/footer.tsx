export default function Footer() {
  return (
    <footer className="mb-12 mt-8">
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>© {new Date().getFullYear()}</span>
        <a href="/rss" className="hover:text-foreground transition-colors">
          rss feed
        </a>
        <a
          href="https://x.com/btn0s"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground transition-colors"
        >
          x.com/btn0s
        </a>
      </div>
    </footer>
  );
}
