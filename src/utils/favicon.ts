/** 站点图标解析：优先自定义 icon，否则自动使用域名 /favicon.ico */
export function resolveIcon(icon: string | undefined, url: string): string {
  if (icon) return icon
  try {
    return `${new URL(url).origin}/favicon.ico`
  } catch {
    return ''
  }
}

/** 图标加载失败时的兜底：取名称首字符 */
export function fallbackLetter(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?'
}
