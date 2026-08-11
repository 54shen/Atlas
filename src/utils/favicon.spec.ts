import { describe, expect, it } from 'vitest'
import { fallbackLetter, isEmojiIcon, resolveIcon } from './favicon'

describe('isEmojiIcon', () => {
  it('URL 不是 emoji', () => {
    expect(isEmojiIcon('https://x.com/i.png')).toBe(false)
    expect(isEmojiIcon('data:image/png;base64,xxx')).toBe(false)
    expect(isEmojiIcon('/local/path.png')).toBe(false)
  })

  it('emoji 与文字按 emoji 处理', () => {
    expect(isEmojiIcon('🛠️')).toBe(true)
    expect(isEmojiIcon('Atlas')).toBe(true)
  })
})

describe('resolveIcon', () => {
  it('自定义图标直接返回', () => {
    expect(resolveIcon('https://x.com/i.png', 'https://a.com')).toBe('https://x.com/i.png')
  })

  it('无自定义图标时自动取域名 /favicon.ico', () => {
    expect(resolveIcon(undefined, 'https://github.com')).toBe('https://github.com/favicon.ico')
    expect(resolveIcon(undefined, 'https://a.com/path/page')).toBe('https://a.com/favicon.ico')
  })

  it('空字符串图标视为未设置', () => {
    expect(resolveIcon('', 'https://a.com')).toBe('https://a.com/favicon.ico')
  })

  it('非法 URL 返回空字符串', () => {
    expect(resolveIcon(undefined, 'not-a-url')).toBe('')
    expect(resolveIcon(undefined, '')).toBe('')
  })
})

describe('fallbackLetter', () => {
  it('取名称首字符并大写', () => {
    expect(fallbackLetter('github')).toBe('G')
    expect(fallbackLetter('Bilibili')).toBe('B')
  })

  it('去除首尾空白', () => {
    expect(fallbackLetter('  GitHub  ')).toBe('G')
  })

  it('空名称返回 ?', () => {
    expect(fallbackLetter('')).toBe('?')
    expect(fallbackLetter('   ')).toBe('?')
  })
})
