import type { Config } from 'tailwindcss'

// Tailwind v4 is CSS-first (see src/index.css @theme block) and auto-detects
// content via the Vite plugin, so this file is intentionally minimal — it
// exists mainly for editor/tooling support that still expects it.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
} satisfies Config
