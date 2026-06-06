import { defineConfig } from 'vite'
import build from '@hono/vite-build/vercel'
import devServer from '@hono/vite-dev-server'

export default defineConfig({
  plugins: [
    build(),
    devServer({
      entry: 'src/index.ts'
    })
  ]
})
