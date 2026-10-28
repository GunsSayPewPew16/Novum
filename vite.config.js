import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  plugins: [react()],
  server: { proxy: { "/api": { target: "http://127.0.0.1:3001", changeOrigin: false, configure: (proxy) => {
    proxy.on("proxyReq", (proxyReq, req) => proxyReq.setHeader("host", req.headers.host))
  } } } },
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
})
