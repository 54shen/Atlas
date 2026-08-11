import type { NavGroup } from '@/types'

/** 站内模糊过滤：匹配分组名、站点名、URL、描述（纯函数，可单测） */
export function filterGroups(groups: NavGroup[], query: string): NavGroup[] {
  const q = query.trim().toLowerCase()
  if (!q) return groups

  const result: NavGroup[] = []
  for (const group of groups) {
    const groupHit = group.name.toLowerCase().includes(q)
    if (groupHit) {
      result.push(group)
      continue
    }
    const matchedLinks = group.links.filter(
      (link) =>
        link.name.toLowerCase().includes(q) ||
        link.url.toLowerCase().includes(q) ||
        (link.desc ?? '').toLowerCase().includes(q),
    )
    if (matchedLinks.length > 0) {
      result.push({ ...group, links: matchedLinks })
    }
  }
  return result
}

/** 输入是否为网址（http(s):// 开头，或「无空格且含点」的形式） */
export function isUrlLike(input: string): boolean {
  if (/^https?:\/\//i.test(input)) return true
  return /^\S+\.\S+$/.test(input)
}

/** 无协议时补全 https:// */
export function normalizeUrl(input: string): string {
  if (/^https?:\/\//i.test(input)) return input
  return `https://${input}`
}

/** 用查询词替换引擎模板中的 {q} 占位符 */
export function buildEngineUrl(template: string, query: string): string {
  return template.replaceAll('{q}', encodeURIComponent(query))
}
