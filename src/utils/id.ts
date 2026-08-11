/** 生成唯一 ID：优先 crypto.randomUUID，降级到时间戳+随机数 */
export function newId(prefix = ''): string {
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Date.now().toString(36) + Math.random().toString(36).slice(2)
  return prefix ? `${prefix}-${id}` : id
}
