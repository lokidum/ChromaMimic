import { defineConfig, type Plugin } from "vite";
import { existsSync } from "node:fs";
import { join } from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

// ChromaMimic — static, client-only build. No server, nothing uploaded.

/** Dev only: /guides/foo serves public/guides/foo.html and /guides serves its index.html,
 *  matching Vercel's cleanUrls, so the static guide pages can be checked locally. */
const cleanUrls = (): Plugin => ({
  name: "chromamimic-clean-urls",
  apply: "serve",
  configureServer(server) {
    const pub = fileURLToPath(new URL("./public", import.meta.url));
    server.middlewares.use((req, _res, next) => {
      const url = req.url ?? "";
      const path = url.split("?")[0];
      if (path.length > 1 && !path.includes(".")) {
        const bare = path.replace(/\/$/, "");
        if (existsSync(join(pub, bare + ".html"))) req.url = bare + ".html" + url.slice(path.length);
        else if (existsSync(join(pub, bare, "index.html")))
          req.url = bare + "/index.html" + url.slice(path.length);
      }
      next();
    });
  },
});

export default defineConfig({
  plugins: [react(), tailwindcss(), cleanUrls()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    target: "es2022",
    cssMinify: "lightningcss",
  },
  worker: {
    format: "es",
  },
});
