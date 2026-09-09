import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
const base = process.env.RIGUNO_PAGES_BASE || '/riguno/';
export default defineConfig({
  root:fileURLToPath(new URL('./pages',import.meta.url)),
  publicDir:fileURLToPath(new URL('./public',import.meta.url)),
  base,
  plugins:[react()],
  resolve:{alias:{'@':fileURLToPath(new URL('.',import.meta.url))}},
  define:{'process.env.NEXT_PUBLIC_RIGUNO_STATIC':JSON.stringify('true'),'process.env.NEXT_PUBLIC_RIGUNO_BASE':JSON.stringify(base)},
  build:{outDir:fileURLToPath(new URL('./dist-pages',import.meta.url)),emptyOutDir:true},
});
