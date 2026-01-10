export default function Footer() {
  return (
    <footer className="p-8 isolate z-10 bg-background relative">
      {/* Gradient mask above footer */}
      <div className="absolute bottom-full left-0 right-0 h-8 bg-linear-to-t from-background to-transparent pointer-events-none" />
      <div className="mx-auto flex justify-between text-xs text-muted-foreground">
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
