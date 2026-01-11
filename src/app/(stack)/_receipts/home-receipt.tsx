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
    <ReceiptShell variant="dossier" className="flex flex-col">
      <div className="flex flex-col mb-10 gap-4">
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold uppercase tracking-tight leading-none mb-1">
              OPERATIONAL MANIFEST
            </h1>
            <p className="text-[10px] leading-none opacity-40 font-mono uppercase tracking-widest">
              Subject: BT NORRIS // ID: 01001010
            </p>
          </div>
          <div className="opacity-60 mix-blend-multiply border border-current p-0.5">
            <PixelPattern size={32} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-px bg-current/10 border border-current/10">
          <div className="bg-[#2c3e2d] p-2 flex flex-col gap-1">
            <span className="text-[8px] opacity-40 uppercase font-bold tracking-tighter">STATUS</span>
            <span className="text-[10px] font-bold uppercase">ACTIVE_DUTY</span>
          </div>
          <div className="bg-[#2c3e2d] p-2 flex flex-col gap-1">
            <span className="text-[8px] opacity-40 uppercase font-bold tracking-tighter">LOCATION</span>
            <span className="text-[10px] font-bold uppercase">PHOENIX, AZ</span>
          </div>
        </div>

        <div className="border-y border-current border-dashed py-2 w-full flex justify-between px-2 text-[10px] font-mono">
          <span>DATE: {today.toUpperCase()}</span>
          <span>TIME: {time}</span>
        </div>
      </div>

      <div className="flex flex-col flex-1">
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="bg-[#fdf6e3] text-[#2c3e2d] px-1.5 py-0.5 uppercase font-bold tracking-tighter text-[10px]">
              01 // PROFILE_SUMMARY
            </h2>
            <div className="h-px bg-current/10 flex-1" />
          </div>
          <div className="pl-2 border-l-2 border-current/20">
            <p className="text-xs leading-relaxed opacity-90 italic">
              "Product designer, coder, tinkerer. Specialized in building
              interfaces that bridge the gap between design and engineering."
            </p>
          </div>
        </section>

        <section className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="bg-[#fdf6e3] text-[#2c3e2d] px-1.5 py-0.5 uppercase font-bold tracking-tighter text-[10px]">
              02 // OPERATIONAL_HISTORY
            </h2>
            <div className="h-px bg-current/10 flex-1" />
          </div>
          <div className="space-y-4">
            {CAREER_ITEMS.map((item) => (
              <div key={`${item.date}-${item.title}`} className="relative group pl-3">
                <div className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-current/10 group-hover:bg-current/40 transition-colors" />
                <ListItem
                  title={item.title}
                  subtext={`@${item.company.toLowerCase()}`}
                  date={item.date}
                  href={item.href}
                  className="text-current"
                />
              </div>
            ))}
          </div>
          <a
            href="/resume.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border-2 border-current px-4 py-1.5 text-[10px] font-bold uppercase mt-8 hover:bg-[#fdf6e3] hover:text-[#2c3e2d] transition-all active:translate-y-0.5 font-mono"
          >
            <span>DOWNLOAD_FULL_DOSSIER.PDF</span>
            <span className="opacity-40 group-hover:opacity-100">→</span>
          </a>
        </section>

        <section className="mt-10">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="bg-[#fdf6e3] text-[#2c3e2d] px-1.5 py-0.5 uppercase font-bold tracking-tighter text-[10px]">
              03 // DEPLOYED_ASSETS
            </h2>
            <div className="h-px bg-current/10 flex-1" />
          </div>
          <div className="grid grid-cols-1 gap-4">
            {PROJECTS.map((project) => (
              <div key={project.title} className="border border-current/10 p-3 hover:border-current/30 transition-colors">
                <ListItem
                  title={project.title}
                  description={project.description}
                  href={project.href}
                  subtext={project.href.replace(/^https?:\/\//, "").toLowerCase()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-current"
                />
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="bg-[#fdf6e3] text-[#2c3e2d] px-1.5 py-0.5 uppercase font-bold tracking-tighter text-[10px]">
              04 // CAPABILITY_MATRIX
            </h2>
            <div className="h-px bg-current/10 flex-1" />
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-[10px] uppercase opacity-80 font-mono">
            <div className="flex flex-col gap-1 border-b border-current/10 pb-1.5">
              <div className="flex justify-between">
                <span>TypeScript</span>
                <span className="font-bold">LVL_5</span>
              </div>
              <div className="h-0.5 bg-current/10 w-full"><div className="h-full bg-current/40 w-full" /></div>
            </div>
            <div className="flex flex-col gap-1 border-b border-current/10 pb-1.5">
              <div className="flex justify-between">
                <span>React</span>
                <span className="font-bold">LVL_5</span>
              </div>
              <div className="h-0.5 bg-current/10 w-full"><div className="h-full bg-current/40 w-full" /></div>
            </div>
            <div className="flex flex-col gap-1 border-b border-current/10 pb-1.5">
              <div className="flex justify-between">
                <span>Next.js</span>
                <span className="font-bold">LVL_4</span>
              </div>
              <div className="h-0.5 bg-current/10 w-full"><div className="h-full bg-current/40 w-[80%]" /></div>
            </div>
            <div className="flex flex-col gap-1 border-b border-current/10 pb-1.5">
              <div className="flex justify-between">
                <span>Tailwind</span>
                <span className="font-bold">LVL_5</span>
              </div>
              <div className="h-0.5 bg-current/10 w-full"><div className="h-full bg-current/40 w-full" /></div>
            </div>
            <div className="flex flex-col gap-1 border-b border-current/10 pb-1.5">
              <div className="flex justify-between">
                <span>Design</span>
                <span className="font-bold">LVL_5</span>
              </div>
              <div className="h-0.5 bg-current/10 w-full"><div className="h-full bg-current/40 w-full" /></div>
            </div>
            <div className="flex flex-col gap-1 border-b border-current/10 pb-1.5">
              <div className="flex justify-between">
                <span>Product</span>
                <span className="font-bold">LVL_4</span>
              </div>
              <div className="h-0.5 bg-current/10 w-full"><div className="h-full bg-current/40 w-[80%]" /></div>
            </div>
          </div>
          <div className="mt-10 pt-6 flex justify-between items-end border-t-2 border-current">
            <div className="flex flex-col">
              <span className="text-[8px] opacity-40 font-mono tracking-widest">XP_TOTAL</span>
              <span className="text-lg font-bold tracking-tighter leading-none">TEN_PLUS_YEARS</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[8px] opacity-40 font-mono">REV_2026.04</span>
              <div className="text-[10px] leading-none opacity-60 font-mono whitespace-pre select-none mt-1">
                {`[ OK ]`}
              </div>
            </div>
          </div>
        </section>

        <div className="pt-12 flex flex-col items-center gap-6 mt-auto">
          <div className="w-full h-px bg-current/20 border-b border-current/10" />
          
          <div className="flex flex-col items-center text-center">
            <p className="uppercase font-bold text-[10px] tracking-[0.4em] mb-1">
              MANIFEST_END
            </p>
            <div className="flex items-center gap-4 mt-2">
              <div className="h-8 w-px bg-current/20 rotate-12" />
              <Barcode className="opacity-70 invert h-8" />
              <div className="h-8 w-px bg-current/20 -rotate-12" />
            </div>
          </div>

          <div className="text-[8px] opacity-20 text-center uppercase tracking-[0.8em] font-mono mt-2">
            STAY_CURIOUS
          </div>
        </div>
      </div>
    </ReceiptShell>
  );
}
