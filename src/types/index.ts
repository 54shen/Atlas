/** 主题模式：亮色 / 暗色 / 跟随系统 */
export type ThemeMode = 'light' | 'dark' | 'auto'

/** 搜索引擎定义，url 中的 {q} 会被替换为查询词 */
export interface SearchEngine {
  id: string
  name: string
  url: string
}

/** 站点设置：默认引擎 + 引擎列表 */
export interface NavSettings {
  searchEngine: string
  searchEngines: SearchEngine[]
}

/** 单个站点 */
export interface NavLink {
  id: string
  name: string
  url: string
  desc?: string
  /** 自定义图标地址；缺省时自动使用站点 /favicon.ico */
  icon?: string
  order: number
}

/** 导航分组 */
export interface NavGroup {
  id: string
  name: string
  icon?: string
  order: number
  links: NavLink[]
}

/** 导航数据（links.json 与 localStorage 共用同一 schema） */
export interface NavData {
  version: number
  updatedAt: string
  settings: NavSettings
  groups: NavGroup[]
}
