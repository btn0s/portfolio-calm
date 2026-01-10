export default function Footer() {
  return (
    <footer className="mt-8 pb-12 isolate z-10 bg-background relative -mx-4 px-4">
      {/* Gradient mask above footer */}
      <div className="absolute inset-x-0 bottom-full h-12 bg-linear-to-b from-transparent to-background" />
      <div className="max-w-xl mx-auto">
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
      </div>
    </footer>
  );
}
