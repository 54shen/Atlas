import type { NavData } from '@/types'

/**
 * 将导航数据保存到服务器（全局生效）。
 * dev server（Vite 插件）提供 POST /api/data 写入 public/data/links.json；
 * 纯静态托管（Vercel 等）没有该接口，返回 false，修改仅存浏览器本地。
 */
export async function saveToServer(data: NavData): Promise<boolean> {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}api/data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) return false
    const result = (await res.json()) as { ok?: boolean }
    return result.ok === true
  } catch {
    return false
  }
}
