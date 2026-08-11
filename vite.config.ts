/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

/** 自定义域名访问白名单（Vite 默认拦截未知域名，报 Blocked request）：
 *  通过环境变量 ALLOWED_HOSTS 配置，多个域名用逗号分隔，如 "a.example.com,b.example.com" */
const allowedHosts = (process.env.ALLOWED_HOSTS ?? '')
  .split(',')
  .map((h) => h.trim())
  .filter(Boolean)

export default defineConfig({
  plugins: [vue()],
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
