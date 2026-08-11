/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

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
    allowedHosts: ['atlas.54shen.cn'], // 自定义域名访问白名单（否则 Vite 报 Blocked request）
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.spec.ts'],
  },
})
