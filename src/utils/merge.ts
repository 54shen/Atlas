import type { NavData } from '@/types'

/** 当前数据 schema 版本，与 links.json 中的 version 一致 */
export const DATA_VERSION = 1

/** 校验数据是否为本项目可用的完整 NavData */
export function isNavData(value: unknown): value is NavData {
  if (!value || typeof value !== 'object') return false
  const v = value as Partial<NavData>
  return (
    v.version === DATA_VERSION &&
    Array.isArray(v.groups) &&
    !!v.settings &&
    Array.isArray(v.settings.searchEngines)
  )
}

/**
 * 双源数据合并规则（见开发文档 §6.3）：
 * - local 为空 / 非法 / 版本不匹配 → 使用基线数据 base
 * - local 合法 → 本地优先（全量快照）
 */
export function mergeNavData(base: NavData, local: NavData | null): NavData {
  if (!local) return base
  if (!isNavData(local) || local.version !== base.version) return base
  return local
}

/** 按 order 排序分组与站点，并重新编号为 1..n（就地修改） */
export function normalizeOrder(data: NavData): void {
  data.groups.sort((a, b) => a.order - b.order)
  data.groups.forEach((group, gi) => {
    group.order = gi + 1
    group.links.sort((a, b) => a.order - b.order)
    group.links.forEach((link, li) => {
      link.order = li + 1
    })
  })
}
