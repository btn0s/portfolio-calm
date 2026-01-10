import Link from 'next/link'
import Image from "next/image";
import logo from "@/assets/images/logo-pixel.svg";
import { ThemeToggle } from "@/components/theme-toggle";

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
    <aside className="mb-2 tracking-tight isolate z-10 lg:sticky lg:top-4">
      <nav
        id="nav"
        className="flex flex-row items-center justify-between relative px-0 pb-0 fade md:overflow-auto scroll-pr-6 md:relative"
      >
        <div className="flex flex-row items-center">
          <Link
            href="/"
            className="flex items-center gap-1 mr-6 text-foreground"
          >
            <Image
              src={logo}
              alt="bt norris"
              className="size-3 dark:invert relative top-px"
              priority
            />
            <span className="font-bold">bt norris</span>
          </Link>
          <div className="flex flex-row space-x-0 pr-10">
            {Object.entries(navItems).map(([path, { name }]) => {
              return (
                <Link
                  key={path}
                  href={path}
                  className="transition-all hover:text-foreground text-sm flex align-middle relative py-1 px-2 m-1 text-muted-foreground"
                >
                  {name}
                </Link>
              );
            })}
          </div>
        </div>
        <ThemeToggle />
      </nav>
    </aside>
  );
}
