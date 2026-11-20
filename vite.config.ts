import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import vinext from "vinext";
import { cloudflare } from "@cloudflare/vite-plugin";
import { staticAssetsAdapter } from "@vinext/cloudflare/cache/static-assets-adapter";

export default defineConfig({
  resolve: {
    alias: [
      {
        // sharp går inte att köra på Workers, så där kodas profilbilder om med
        // Cloudflare Images. next dev och next build använder reencode.ts.
        find: /^@\/lib\/avatar\/reencode$/,
        replacement: fileURLToPath(new URL("./src/lib/avatar/reencode.workers.ts", import.meta.url)),
      },
    ],
  },
  plugins: [
    vinext({
      cache: { cdn: staticAssetsAdapter() },
      prerender: { routes: "*" },
    }),
    cloudflare({
      viteEnvironment: {
        name: "rsc",
        childEnvironments: ["ssr"],
      },
    }),
  ],
});
