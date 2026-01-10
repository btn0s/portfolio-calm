export default function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 p-8 isolate z-20 pointer-events-none">
      <div className="mx-auto flex justify-between text-xs text-muted-foreground pointer-events-auto">
        <span>© {new Date().getFullYear()}</span>
        <div className="flex items-center gap-4 ">
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
      </div>
    </footer>
  );
}
