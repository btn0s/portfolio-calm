import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Lab routes
      {
        source: "/lab",
        destination: "https://old.btn0s.dev/lab",
        permanent: true,
      },
      {
        source: "/lab/pov",
        destination: "https://old.btn0s.dev/lab/pov",
        permanent: true,
      },
      {
        source: "/lab/who-am-i",
        destination: "https://old.btn0s.dev/lab/who-am-i",
        permanent: true,
      },
      {
        source: "/lab/clarity-loop",
        destination: "https://old.btn0s.dev/lab/clarity-loop",
        permanent: true,
      },
      {
        source: "/lab/artifacts/delphi-falling-chips",
        destination: "https://old.btn0s.dev/lab/artifacts/delphi-falling-chips",
        permanent: true,
      },
      {
        source: "/lab/artifacts/game-dev-prototypes",
        destination: "https://old.btn0s.dev/lab/artifacts/game-dev-prototypes",
        permanent: true,
      },
      {
        source: "/lab/artifacts/tldraw-rts",
        destination: "https://old.btn0s.dev/lab/artifacts/tldraw-rts",
        permanent: true,
      },
      {
        source: "/lab/portfolio-v1",
        destination: "https://old.btn0s.dev/lab/portfolio-v1",
        permanent: true,
      },
      {
        source: "/lab/echelon",
        destination: "https://old.btn0s.dev/lab/echelon",
        permanent: true,
      },
      {
        source: "/lab/strella",
        destination: "https://old.btn0s.dev/lab/strella",
        permanent: true,
      },
      // Work routes
      {
        source: "/work/amex",
        destination: "https://old.btn0s.dev/work/amex",
        permanent: true,
      },
      {
        source: "/work/amex/time-machine",
        destination: "https://old.btn0s.dev/work/amex/time-machine",
        permanent: true,
      },
      {
        source: "/work/backbone",
        destination: "https://old.btn0s.dev/work/backbone",
        permanent: true,
      },
      {
        source: "/work/backbone/labs-program",
        destination: "https://old.btn0s.dev/work/backbone/labs-program",
        permanent: true,
      },
      {
        source: "/work/backbone/post-malone",
        destination: "https://old.btn0s.dev/work/backbone/post-malone",
        permanent: true,
      },
      {
        source: "/work/backbone/games-db-figma-plugin",
        destination: "https://old.btn0s.dev/work/backbone/games-db-figma-plugin",
        permanent: true,
      },
      {
        source: "/work/backbone/web",
        destination: "https://old.btn0s.dev/work/backbone/web",
        permanent: true,
      },
      {
        source: "/work/backbone/emulator",
        destination: "https://old.btn0s.dev/work/backbone/emulator",
        permanent: true,
      },
      {
        source: "/work/sobol",
        destination: "https://old.btn0s.dev/work/sobol",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
