// GitHub Pages has no SPA routing: serve the app for unknown paths so that
// reloading /leaderboard or /findings works. React Router then renders the page.
import { copyFileSync } from 'node:fs'
copyFileSync('dist/index.html', 'dist/404.html')
console.log('dist/404.html written')
