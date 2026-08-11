import type { NavData, NavGroup, NavLink } from '@/types'
import { isNavData } from './merge'

/** 未分类的书签归入的分组名 */
export const UNCLASSIFIED_GROUP = '未分类'

/** 数据序列化为可回填仓库的 JSON 字符串 */
export function serializeJson(data: NavData): string {
  return JSON.stringify(data, null, 2)
}

/** 解析并校验 JSON 数据，非法返回 null */
export function parseJsonData(text: string): NavData | null {
  try {
    const parsed: unknown = JSON.parse(text)
    return isNavData(parsed) ? parsed : null
  } catch {
    return null
  }
}

/** 触发浏览器下载文本文件 */
export function downloadTextFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** 直接子元素匹配（避免 :scope 兼容性问题） */
function directChild(el: Element, tag: string): Element | null {
  for (const child of Array.from(el.children)) {
    if (child.tagName.toLowerCase() === tag) return child
  }
  return null
}

/**
 * 文件夹 DT 对应的内容 DL：
 * - 优先 DT 内的子 DL（部分工具导出格式）
 * - 其次为 DT 后的兄弟 DL（Chrome/Edge 导出格式：<DT><H3>…</H3> 后跟 <DL><p>…</DL>）
 */
function folderDlOf(dt: Element): Element | null {
  const direct = directChild(dt, 'dl')
  if (direct) return direct
  let el = dt.nextElementSibling
  while (el) {
    const tag = el.tagName.toLowerCase()
    if (tag === 'dl') return el
    if (tag === 'dt') return null // 已到下一个条目，说明无内容目录
    el = el.nextElementSibling
  }
  return null
}

/**
 * 解析 Netscape 书签 HTML（Chrome/Edge/Firefox 导出的 HTML 格式）：
 * - H3 文件夹 → 分组，嵌套文件夹以「父 / 子」命名
 * - 文件夹外的链接 → 归入「未分类」分组
 * - 忽略 javascript:/place: 等伪协议链接
 * - 返回的分组/链接 id 与 order 为空字符串/0，由调用方重新分配
 */
export function parseBookmarkHtml(html: string): NavGroup[] {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const groups: NavGroup[] = []
  const index = new Map<string, NavGroup>()
  const loose: NavLink[] = []

  function ensureGroup(name: string): NavGroup {
    let g = index.get(name)
    if (!g) {
      g = { id: '', name, order: 0, links: [] }
      index.set(name, g)
      groups.push(g)
    }
    return g
  }

  function visit(dt: Element, parentName: string | null): void {
    const h3 = directChild(dt, 'h3')
    const a = directChild(dt, 'a')

    if (h3) {
      const name = (h3.textContent ?? '').trim() || '未命名'
      const fullName = parentName ? `${parentName} / ${name}` : name
      const dl = folderDlOf(dt)
      if (dl) {
        for (const child of Array.from(dl.children)) {
          if (child.tagName.toLowerCase() === 'dt') visit(child, fullName)
        }
      }
      return
    }

    if (a) {
      const url = (a.getAttribute('href') ?? '').trim()
      if (!url || url.startsWith('javascript:') || url.startsWith('place:')) return
      const link: NavLink = {
        id: '',
        name: (a.textContent ?? '').trim() || url,
        url,
        order: 0,
      }
      if (parentName) ensureGroup(parentName).links.push(link)
      else loose.push(link)
    }
  }

  const topDl = doc.querySelector('body > dl') ?? doc.querySelector('dl')
  if (topDl) {
    for (const child of Array.from(topDl.children)) {
      if (child.tagName.toLowerCase() === 'dt') visit(child, null)
    }
  }

  if (loose.length > 0) ensureGroup(UNCLASSIFIED_GROUP).links.push(...loose)
  return groups
}
