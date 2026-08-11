import { describe, expect, it } from 'vitest'
import { newId } from './id'

describe('newId', () => {
  it('返回非空字符串', () => {
    expect(newId()).toBeTruthy()
  })

  it('带前缀时前缀在开头', () => {
    expect(newId('g')).toMatch(/^g-/)
    expect(newId('l')).toMatch(/^l-/)
  })

  it('大量生成不重复', () => {
    const ids = new Set(Array.from({ length: 1000 }, () => newId()))
    expect(ids.size).toBe(1000)
  })

  it('不同类型前缀互不冲突', () => {
    const g = newId('g')
    const l = newId('l')
    expect(g).not.toBe(l)
  })
})
