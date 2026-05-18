import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from "@tailwindcss/vite"
import { VitePWA } from "vite-plugin-pwa";
import path from "path"

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 1. Muat env file berdasarkan 'mode' (development, production, dll.)
  // npm run dev -> development, npm run build -> production
  // process.cwd() adalah direktori akar proyek Anda
  // .env.[mode].local (Prioritas tertinggi)
  // .env.[mode]
  // .env.local
  // .env (Prioritas terendah)
  const env = loadEnv(mode, process.cwd(), '');

  const check = env.VITE_CHECK;
  if (!check) throw new Error("env is not detected");
  console.log("Berhasil env:", check)

  return {
    base: "/",
    // Sekarang Anda bisa menggunakan variabel env di sini jika butuh, 
    // misalnya untuk mengganti port secara dinamis:
    build: {
      sourcemap: true
    },
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.ico"],
        manifest: {
          name: "TFJS Chatbot",
          short_name: "Chatbot",
          start_url: "/",
          display: "standalone",
          background_color: "#ffffff",
          theme_color: "#000000",
          icons: [],
        },
        workbox: {
          runtimeCaching: [
            {
              urlPattern: ({ url }) =>
                url.pathname.includes("/model-chatbot/"),
              handler: "CacheFirst",
              options: {
                cacheName: "tfjs-model-cache",
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 7, // 7 hari
                },
              },
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: { '@': path.resolve(__dirname, './src') }
    },
    server: {
      port: Number(env.VITE_PORT) || 5173,
      strictPort: true,
      // proxy agar tiap fetch("/api"), yang dipanggil backend url
      proxy: {
        "/api": {
          target: env.VITE_BACKEND_URL || "http://localhost:3000",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, "")
        },
      }
    }
  }
})
