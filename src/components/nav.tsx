import Image from "next/image";
import logo from "@/assets/images/logo-pixel.svg";
import { SoundToggle } from "@/components/sound-toggle";
import { SoundPlayingLink } from "@/components/sound-playing-link";

const navItems = {
  "/": {
    name: "home",
  },
  "/thoughts": {
    name: "thoughts",
  },
  "/artifacts": {
    name: "artifacts",
  },
};

export function Navbar() {
  return (
    <aside className="fixed top-0 left-0 right-0 p-4 tracking-tight isolate z-20 pointer-events-none">
      <nav
        id="nav"
        className="flex flex-row items-center justify-between relative px-0 pb-0 fade md:overflow-auto scroll-pr-6 pointer-events-auto"
      >
        <div className="flex flex-row items-baseline">
          <SoundPlayingLink
            href="/"
            prefetch
            sound="navigate"
            className="flex items-center gap-1 mr-6 text-foreground rounded-sm"
          >
            <Image
              src={logo}
              alt="btn0s"
              className="size-3 dark:invert relative top-px"
              priority
            />
            <span className="font-bold">btn0s</span>
          </SoundPlayingLink>
          <div className="hidden md:flex flex-row space-x-0 pr-10">
            {Object.entries(navItems).map(([path, { name }]) => {
              return (
                <SoundPlayingLink
                  key={path}
                  href={path}
                  prefetch
                  sound="navigate"
                  className="transition-[color,opacity,background-color] hover:text-foreground hover:bg-muted/50 rounded-sm text-sm flex align-middle relative py-1 px-2 m-1 text-muted-foreground"
                >
                  {name}
                </SoundPlayingLink>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <SoundToggle />
        </div>
      </nav>
    </aside>
  );
}
