import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The site is served from the root of https://radiovista.github.io (repo RadioVISTA/RadioVISTA.github.io).
// Under WSL the project lives on a Windows drive (/mnt/f), where file events do not reach Linux,
// so the dev server polls for changes there.
const env = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env ?? {}
const inWsl = Boolean(env.WSL_DISTRO_NAME)

export default defineConfig({
  base: '/',
  plugins: [react()],
  server: {
    watch: inWsl ? { usePolling: true, interval: 300 } : undefined,
  },
})
