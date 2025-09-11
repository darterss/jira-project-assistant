import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
    plugins: [react()],
    build: {
        outDir: resolve(__dirname, '../apps/forge-app/resources/static/main'),
        emptyOutDir: true
    },
    server: {
        port: 3000
    }
});
