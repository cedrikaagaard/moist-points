import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";

// Dev only: stand-ins for the Netlify functions (netlify/functions/auth.mjs),
// so the logged-in state can be previewed with `npm run dev`.
// DEV_BNET=Drikkle,Otheralt npm run dev  -> "logged in" with those characters.
function devApi() {
  return {
    name: "dev-api",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/api/me", (req, res) => {
        const names = (process.env.DEV_BNET || "").split(",").map((s) => s.trim()).filter(Boolean);
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ verified: names.length > 0, characters: names.map((name) => ({ name, realm: "firemaw", class: null, level: 60 })) }));
      });
      server.middlewares.use("/api/reviews", (req, res) => {
        const mine = new Set((process.env.DEV_BNET || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean));
        const dir = "data/reviews";
        const out = [];
        for (const f of fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(".json")) : []) {
          const raid = JSON.parse(fs.readFileSync(`${dir}/${f}`, "utf8"));
          for (const [name, p] of Object.entries(raid.players || {}))
            if (p.review && mine.has(name.toLowerCase())) out.push({ night: raid.night, date: raid.date, zones: raid.zones, zoneIds: raid.zoneIds, icons: raid.icons, kind: raid.kind, raiders: raid.raiders, durationMin: raid.durationMin, player: name, stats: p.stats, review: p.review });
        }
        out.sort((a, b) => (a.night < b.night ? 1 : -1));
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ verified: mine.size > 0, reviews: out }));
      });
    },
  };
}

export default defineConfig({
  // Relative base so the built `dist/` works no matter where it's hosted —
  // root domain, a subpath (e.g. GitHub Pages project sites), or a local file.
  base: "./",
  plugins: [react(), devApi()],
});
