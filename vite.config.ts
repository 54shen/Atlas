/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import { resolve } from 'node:path'
import { mkdirSync, writeFileSync } from 'node:fs'
import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'

/** 自定义域名访问白名单（Vite 默认拦截未知域名，报 Blocked request）：
 *  通过环境变量 ALLOWED_HOSTS 配置，多个域名用逗号分隔，如 "a.example.com,b.example.com" */
const allowedHosts = (process.env.ALLOWED_HOSTS ?? '')
  .split(',')
  .map((h) => h.trim())
  .filter(Boolean)

/** 全局保存接口：POST /api/data 把导航数据写回 public/data/links.json（仅 dev server 生效） */
const dataWriteApi: Plugin = {
  name: 'atlas-data-write-api',
  configureServer(server) {
    server.middlewares.use('/api/data', (req, res) => {
      if (req.method !== 'POST') {
        res.writeHead(405, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: false, error: 'Method Not Allowed' }))
        return
      }
      let body = ''
      req.on('data', (chunk) => {
        body += chunk
      })
      req.on('end', () => {
        try {
          const parsed: unknown = JSON.parse(body)
          if (!parsed || typeof parsed !== 'object' || !Array.isArray((parsed as { groups?: unknown }).groups)) {
            throw new Error('数据格式不正确')
          }
          const dir = resolve(process.cwd(), 'public/data')
          mkdirSync(dir, { recursive: true })
          writeFileSync(resolve(dir, 'links.json'), JSON.stringify(parsed, null, 2), 'utf-8')
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ ok: true }))
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(
            JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }),
          )
        }
      })
    })
  },
}

export default defineConfig({
  plugins: [vue(), dataWriteApi],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: true, // 绑定 0.0.0.0：部署后局域网/公网可访问（仅 localhost 则外网连不上）
    port: 5745,
    allowedHosts,
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.spec.ts'],
  },
})
