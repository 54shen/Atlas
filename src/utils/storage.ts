/** localStorage 封装：统一 try/catch，损坏数据返回 null */

export function loadLocalData<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function saveLocalData(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // 隐私模式或存储已满时静默失败，不阻塞使用
  }
}

export function clearLocalData(...keys: string[]): void {
  for (const key of keys) localStorage.removeItem(key)
}
