import Link from 'next/link'
import { BlogPosts } from '@/components/blog-posts'
import { PixelPattern } from "@/components/pixel-pattern";
import { Barcode } from "@/components/barcode";
import { ReceiptShell } from "@/components/receipt/receipt-shell";

const CAREER_ITEMS: {
  title: string;
  company: string;
  date: string;
  href?: string;
}[] = [
  {
    title: "Principal Design Engineer",
    company: "thinkhuman.co",
    date: "2025",
  },
  {
    title: "Labs Program Lead",
    company: "Backbone",
    date: "2024",
  },
  {
    title: "Senior Design Engineer",
    company: "Backbone",
    date: "2021",
  },
  {
    title: "SWE II",
    company: "American Express",
    date: "2019",
  },
];

const PROJECTS = [
  {
    title: "IndieFindr",
    description:
      "Discover your next favorite indie game through AI-powered recommendations",
    href: "https://indiefindr.gg",
  },
  {
    title: "Computer",
    description: "Slack-native agent harness for Cursor Background Agents",
    href: "https://github.com/btn0s/computer",
  },
  {
    title: "Unreal MCP",
    description:
      "Control Unreal Engine through natural language using Model Context Protocol",
    href: "https://github.com/btn0s/unreal-mcp",
  },
];

export function HomeReceipt() {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const time = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <ReceiptShell className="flex flex-col">
      <div className="flex flex-col items-center text-center mb-8 gap-1">
        <h1 className="text-3xl font-bold uppercase tracking-widest mb-2">
          BT NORRIS
        </h1>
        <p className="text-xs leading-none opacity-70">DESIGN ENGINEER // 2026</p>
        <p className="text-xs leading-none opacity-70">PHOENIX, AZ</p>
        <div className="mt-4 border-y border-(--paper-foreground) border-dashed py-2 w-full flex justify-between px-2 text-xs">
          <span>{today.toUpperCase()}</span>
          <span>{time}</span>
        </div>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="border-b border-(--paper-foreground) border-dashed pb-1 mb-4 uppercase font-bold tracking-tighter text-sm">
            personal_summary
          </h2>
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-8">
              <p className="text-sm leading-relaxed opacity-90">
                I&apos;m bt norris—product designer, coder, tinkerer. I specialize
                in building interfaces that bridge the gap between design and
                engineering.
              </p>
            </div>
            <div className="col-span-4 aspect-square opacity-80 mix-blend-multiply">
              <PixelPattern size={28} />
            </div>
          </div>
        </section>

        <section>
          <h2 className="border-b border-(--paper-foreground) border-dashed pb-1 mb-4 uppercase font-bold tracking-tighter text-sm">
            career_history
          </h2>
          <div className="space-y-2">
            {CAREER_ITEMS.map((item) => (
              <div
                key={`${item.date}-${item.title}`}
                className="flex justify-between items-baseline gap-2 text-sm"
              >
                <div className="flex flex-col">
                  <span className="font-bold uppercase">{item.title}</span>
                  <span className="opacity-70">@{item.company.toLowerCase()}</span>
                </div>
                <span className="shrink-0">{item.date}</span>
              </div>
            ))}
          </div>
          <a
            href="/resume.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block border border-(--paper-foreground) px-3 py-1 text-xs uppercase mt-4 hover:bg-(--paper-foreground) hover:text-(--paper) transition-colors"
          >
            view_resume.pdf
          </a>
        </section>

        <section>
          <h2 className="border-b border-(--paper-foreground) border-dashed pb-1 mb-4 uppercase font-bold tracking-tighter text-sm">
            selected_projects
          </h2>
          <div className="space-y-4">
            {PROJECTS.map((project) => (
              <a
                key={project.title}
                href={project.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group block"
              >
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-bold uppercase text-sm underline decoration-dotted underline-offset-2 group-hover:decoration-solid">
                    {project.title}
                  </h3>
                </div>
                <p className="text-xs leading-tight opacity-70 mb-1">
                  {project.description}
                </p>
                <span className="text-[10px] opacity-50 block truncate">
                  {project.href.replace(/^https?:\/\//, '')}
                </span>
              </a>
            ))}
          </div>
        </section>

        <section>
          <h2 className="border-b border-(--paper-foreground) border-dashed pb-1 mb-4 uppercase font-bold tracking-tighter text-sm">
            itemized_skills
          </h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs uppercase opacity-80">
            <div className="flex justify-between"><span>TypeScript</span><span>1.0</span></div>
            <div className="flex justify-between"><span>React</span><span>1.0</span></div>
            <div className="flex justify-between"><span>Next.js</span><span>1.0</span></div>
            <div className="flex justify-between"><span>Tailwind</span><span>1.0</span></div>
            <div className="flex justify-between"><span>Design</span><span>1.0</span></div>
            <div className="flex justify-between"><span>Product</span><span>1.0</span></div>
          </div>
          <div className="mt-4 border-t border-(--paper-foreground) border-dashed pt-2 flex justify-between font-bold text-sm uppercase">
            <span>Total_Capabilities</span>
            <span>6.0</span>
          </div>
        </section>

        <section>
          <h2 className="border-b border-(--paper-foreground) border-dashed pb-1 mb-4 uppercase font-bold tracking-tighter text-sm">
            recent_thoughts
          </h2>
          <div className="receipt-thoughts">
            <BlogPosts />
          </div>
          <Link
            href="/thoughts"
            className="inline-block border border-(--paper-foreground) px-3 py-1 text-xs uppercase mt-4 hover:bg-(--paper-foreground) hover:text-(--paper) transition-colors"
          >
            view_all_posts
          </Link>
        </section>

        <div className="border-t border-(--paper-foreground) border-dashed pt-8 flex flex-col items-center gap-4">
          <div className="text-center">
            <p className="uppercase font-bold text-sm tracking-[0.2em]">Thank you</p>
            <p className="text-xs opacity-70">FOR VISITING MY PORTFOLIO</p>
          </div>
          
          <Barcode className="opacity-80 mix-blend-multiply" />
          
          <div className="text-[10px] opacity-40 text-center uppercase tracking-widest">
            01001010 01001111 01001001 01001110
          </div>
        </div>
      </div>
    </ReceiptShell>
  );
}
