import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { componentTagger } from "lovable-tagger";
import sitemap from "vite-plugin-sitemap";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    // Only include componentTagger in development mode
    mode === "development" && componentTagger(),
    sitemap({
      hostname: 'https://chillmechanic.com',
      dynamicRoutes: [
        '/', '/about', '/contact', '/blog', '/gallery', '/privacy',
        '/services/ac', '/services/refrigerator', '/services/washing-machine',
        '/services/ro', '/services/geyser', '/services/microwave',
        '/services/water-dispenser', '/services/deep-freezer',
      ],
      outDir: 'public',
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Ensure build doesn't fail on warnings
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress certain warnings during build
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
        warn(warning);
      },
    },
  },
}));
