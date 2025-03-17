import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    css: {
        postcss: {
            plugins: [
                tailwindcss,
                autoprefixer,
            ],
        },
    },
    server: {
        host: 'localhost',
        port: 5173,
        strictPort: true,
        hmr: {
            clientPort: 5173,
            host: 'localhost',
            protocol: 'ws',
            timeout: 30000
        },
        watch: {
            usePolling: true
        }
    }
});
