import { beforeEach, describe, expect, it } from 'vitest'
import { clearLocalData, loadLocalData, saveLocalData } from './storage'

beforeEach(() => {
  localStorage.clear()
})

describe('saveLocalData / loadLocalData', () => {
  it('保存后可读回相同结构', () => {
    const value = { a: 1, b: ['x', 'y'] }
    saveLocalData('nav:test', value)
    expect(loadLocalData<typeof value>('nav:test')).toEqual(value)
  })

  it('键不存在时返回 null', () => {
    expect(loadLocalData('nav:missing')).toBeNull()
  })

  it('损坏的 JSON 返回 null 而不抛错', () => {
    localStorage.setItem('nav:bad', '{oops')
    expect(loadLocalData('nav:bad')).toBeNull()
  })

  it('不可序列化的值静默失败而不抛错', () => {
    const circular: Record<string, unknown> = {}
    circular.self = circular
    expect(() => saveLocalData('nav:circular', circular)).not.toThrow()
    expect(loadLocalData('nav:circular')).toBeNull()
  })
})

describe('clearLocalData', () => {
  it('可清除多个键', () => {
    saveLocalData('nav:a', 1)
    saveLocalData('nav:b', 2)
    clearLocalData('nav:a', 'nav:b')
    expect(localStorage.getItem('nav:a')).toBeNull()
    expect(localStorage.getItem('nav:b')).toBeNull()
  })
})
