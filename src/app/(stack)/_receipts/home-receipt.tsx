import { PixelPattern } from "@/components/pixel-pattern";
import { Barcode } from "@/components/barcode";
import { ReceiptShell } from "@/components/receipt/receipt-shell";
import { ListItem } from "@/components/list-item";

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
        <h1 className="text-2xl font-bold uppercase tracking-[0.2em] mb-1">
          BT NORRIS
        </h1>
        <p className="text-[10px] leading-none opacity-60 font-mono">
          DESIGN ENGINEER // 2026
        </p>
        <p className="text-[10px] leading-none opacity-60 font-mono">
          PHOENIX, AZ
        </p>

        <div className="mt-6 border-y border-(--paper-foreground) border-dashed py-2 w-full flex justify-between px-2 text-[10px] font-mono">
          <span>{today.toUpperCase()}</span>
          <span>{time}</span>
        </div>
      </div>

      <div className="flex flex-col flex-1">
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="border-b border-(--paper-foreground) border-dashed pb-1 uppercase font-bold tracking-tighter text-xs flex-1">
              personal_summary
            </h2>
          </div>
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-8">
              <p className="text-xs leading-relaxed opacity-90">
                Product designer, coder, tinkerer. Specialized in building
                interfaces that bridge the gap between design and engineering.
              </p>
            </div>
            <div className="col-span-4 aspect-square opacity-60 mix-blend-multiply p-1">
              <PixelPattern size={24} />
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="border-b border-(--paper-foreground) border-dashed pb-1 uppercase font-bold tracking-tighter text-xs flex-1">
              career_history
            </h2>
          </div>
          <div className="space-y-3">
            {CAREER_ITEMS.map((item) => (
              <ListItem
                key={`${item.date}-${item.title}`}
                title={item.title}
                subtext={`@${item.company.toLowerCase()}`}
                date={item.date}
                href={item.href}
              />
            ))}
          </div>
          <a
            href="/resume.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-(--paper-foreground) px-3 py-1 text-[10px] uppercase mt-6 hover:bg-(--paper-foreground) hover:text-(--paper) transition-colors group font-mono"
          >
            <span>view_resume.pdf</span>
            <span className="opacity-40 group-hover:opacity-100">→</span>
          </a>
        </section>

        <section className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="border-b border-(--paper-foreground) border-dashed pb-1 uppercase font-bold tracking-tighter text-xs flex-1">
              selected_projects
            </h2>
          </div>
          <div className="space-y-4">
            {PROJECTS.map((project) => (
              <ListItem
                key={project.title}
                title={project.title}
                description={project.description}
                href={project.href}
                subtext={project.href.replace(/^https?:\/\//, "").toLowerCase()}
                target="_blank"
                rel="noopener noreferrer"
              />
            ))}
          </div>
        </section>

        <section className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="border-b border-(--paper-foreground) border-dashed pb-1 uppercase font-bold tracking-tighter text-xs flex-1">
              itemized_skills
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-[10px] uppercase opacity-80 font-mono">
            <div className="flex justify-between border-b border-black/5 pb-1">
              <span>TypeScript</span>
              <span>★★★★★</span>
            </div>
            <div className="flex justify-between border-b border-black/5 pb-1">
              <span>React</span>
              <span>★★★★★</span>
            </div>
            <div className="flex justify-between border-b border-black/5 pb-1">
              <span>Next.js</span>
              <span>★★★★☆</span>
            </div>
            <div className="flex justify-between border-b border-black/5 pb-1">
              <span>Tailwind</span>
              <span>★★★★★</span>
            </div>
            <div className="flex justify-between border-b border-black/5 pb-1">
              <span>Design</span>
              <span>★★★★★</span>
            </div>
            <div className="flex justify-between border-b border-black/5 pb-1">
              <span>Product</span>
              <span>★★★★☆</span>
            </div>
          </div>
          <div className="mt-6 border-t border-(--paper-foreground) border-dashed pt-4 flex justify-between items-end font-bold uppercase">
            <div className="flex flex-col">
              <span className="text-[8px] opacity-40 font-mono">XP_PTS</span>
              <span className="text-xs tracking-tight">Total_Experience</span>
            </div>
            <div className="flex items-end gap-1">
              <div className="text-[10px] leading-[0.8] opacity-60 font-mono whitespace-pre select-none pb-1">
                {` _  _ 
/ |/ |
| || |
|_||_|`}
              </div>
              <span className="text-[10px] opacity-40 font-mono">YEARS</span>
            </div>
          </div>
        </section>

        <div className="border-t border-(--paper-foreground) border-dashed pt-12 flex flex-col items-center gap-6 mt-auto">
          <div className="text-center relative">
            <p className="uppercase font-bold text-xs tracking-[0.3em] mb-1">
              Thank you
            </p>
            <p className="text-[9px] opacity-50 font-mono">
              PORTFOLIO SESSION ENDED
            </p>
          </div>

          <Barcode className="opacity-40 mix-blend-multiply h-6" />

          <div className="text-[8px] opacity-20 text-center uppercase tracking-[0.5em] font-mono">
            *** 01001010 01001111 01001001 01001110 ***
          </div>
        </div>
      </div>
    </ReceiptShell>
  );
}
