import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "ChetnaDhara",
        short_name: "ChetnaDhara",
        description: "A calm session companion for children, with a caregiver note afterward.",
        theme_color: "#F3F0E8",
        background_color: "#F3F0E8",
        display: "standalone",
        lang: "en",
        icons: [{ src: "favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,woff,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /\/v1\/media\/calm\/.*/,
            handler: "CacheFirst",
            options: {
              cacheName: "calm-pack",
              expiration: { maxEntries: 8, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
  server: {
    proxy: {
      "/v1": "http://127.0.0.1:8000",
    },
  },
});
