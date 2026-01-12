import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Image metadata
export const alt = "bt norris, design engineer";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image() {
  const [oracleData, departureData] = await Promise.all([
    readFile(
      join(
        process.cwd(),
        "src/assets/fonts/ABC-Stefan/ABCOracleVariable-Trial.ttf"
      )
    ),
    readFile(
      join(
        process.cwd(),
        "src/assets/fonts/DepartureMono-1.500/DepartureMono-Regular.otf"
      )
    ),
  ]);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const time = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return new ImageResponse(
    (
      <div
        tw="flex flex-col w-full h-full bg-black items-center justify-center"
        style={{
          fontFamily: "Departure Mono",
        }}
      >
        {/* Dossier Card */}
        <div
          tw="flex flex-col w-[1000px] h-[500px] bg-[#2c3e2d] text-[#fdf6e3] border-2 border-[#41503E] p-12 relative overflow-hidden"
          style={{
            clipPath:
              "polygon(40px 0%, calc(100% - 40px) 0%, 100% 40px, 100% 100%, 0% 100%, 0% 40px)",
          }}
        >
          {/* Grain Overlay */}
          <div tw="absolute inset-0 opacity-[0.05] pointer-events-none bg-black" />

          {/* Header Section */}
          <div tw="flex justify-between items-start w-full mb-12">
            <div tw="flex flex-col">
              <h1
                tw="text-6xl font-bold uppercase tracking-tight m-0 leading-none"
                style={{ fontFamily: "ABC Oracle" }}
              >
                OPERATIONAL MANIFEST
              </h1>
              <p tw="text-sm opacity-40 uppercase tracking-[0.3em] mt-4">
                Subject: BT NORRIS // ID: 01001010
              </p>
            </div>

            {/* Grid Pattern */}
            <div tw="flex flex-wrap w-48 h-48 border border-[#fdf6e3]/20 p-1 opacity-60">
              {Array.from({ length: 256 }).map((_, i) => (
                <div
                  key={i}
                  tw="w-2.5 h-2.5 border border-[#fdf6e3]/5"
                  style={{
                    backgroundColor: Math.random() > 0.9 ? "#fdf6e3" : "transparent",
                    opacity: Math.random() * 0.3 + 0.1,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Status/Location Grid */}
          <div tw="grid grid-cols-2 gap-px bg-[#fdf6e3]/10 border border-[#fdf6e3]/10 mb-8">
            <div tw="bg-[#2c3e2d] p-4 flex flex-col">
              <span tw="text-[10px] opacity-40 uppercase font-bold tracking-tighter mb-1">
                STATUS
              </span>
              <span tw="text-xl font-bold uppercase">ACTIVE_DUTY</span>
            </div>
            <div tw="bg-[#2c3e2d] p-4 flex flex-col">
              <span tw="text-[10px] opacity-40 uppercase font-bold tracking-tighter mb-1">
                LOCATION
              </span>
              <span tw="text-xl font-bold uppercase">PHOENIX, AZ</span>
            </div>
          </div>

          {/* Date/Time Bar */}
          <div tw="border-y border-[#fdf6e3] border-dashed py-4 w-full flex justify-between px-4 text-sm">
            <span>DATE: {today.toUpperCase()}</span>
            <span>TIME: {time}</span>
          </div>

          {/* Profile Summary Footer */}
          <div tw="mt-auto flex items-center gap-4">
            <div
              tw="bg-[#fdf6e3] text-[#2c3e2d] px-3 py-1 uppercase font-bold tracking-tighter text-xs"
              style={{ fontFamily: "ABC Oracle" }}
            >
              01 // PROFILE_SUMMARY
            </div>
            <p tw="text-sm opacity-90 italic flex-1 m-0">
              "Product designer, coder, tinkerer. Specialized in building
              interfaces that bridge the gap between design and engineering."
            </p>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "ABC Oracle",
          data: oracleData,
          style: "normal",
          weight: 700,
        },
        {
          name: "Departure Mono",
          data: departureData,
          style: "normal",
          weight: 400,
        },
      ],
    }
  );
}
