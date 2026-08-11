import { describe, expect, it } from 'vitest'
import { parseBookmarkHtml, parseJsonData, serializeJson } from './exportImport'
import { DATA_VERSION } from './merge'
import type { NavData } from '@/types'

/** Chrome/Edge 导出的书签 HTML 典型结构（含嵌套文件夹与松散链接） */
const chromeHtml = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
    <DT><H3 ADD_DATE="1700000000" LAST_MODIFIED="1700000001">书签栏</H3>
    <DL><p>
        <DT><A HREF="https://github.com" ADD_DATE="1700000002">GitHub</A>
        <DT><A HREF="https://example.com/page" ADD_DATE="1700000003">Example Page</A>
        <DT><H3 ADD_DATE="1700000004">内层目录</H3>
        <DL><p>
            <DT><A HREF="https://developer.mozilla.org" ADD_DATE="1700000005">MDN</A>
        </DL><p>
    </DL><p>
    <DT><A HREF="https://www.bilibili.com" ADD_DATE="1700000006">Bilibili</A>
    <DT><A HREF="javascript:void(0)" ADD_DATE="1700000007">Bad Link</A>
</DL><p>`

describe('parseBookmarkHtml', () => {
  const groups = parseBookmarkHtml(chromeHtml)

  it('解析出文件夹分组与嵌套分组', () => {
    const names = groups.map((g) => g.name)
    expect(names).toContain('书签栏')
    expect(names).toContain('书签栏 / 内层目录')
  })

  it('文件夹内的链接归入对应分组', () => {
    const g = groups.find((x) => x.name === '书签栏')
    expect(g?.links.map((l) => l.name)).toEqual(['GitHub', 'Example Page'])
    expect(g?.links[0].url).toBe('https://github.com')
  })

  it('嵌套分组链接归入父/子命名分组', () => {
    const g = groups.find((x) => x.name === '书签栏 / 内层目录')
    expect(g?.links.map((l) => l.name)).toEqual(['MDN'])
  })

  it('松散链接归入未分类分组', () => {
    const g = groups.find((x) => x.name === '未分类')
    expect(g?.links.map((l) => l.name)).toEqual(['Bilibili'])
  })

  it('忽略 javascript: 伪协议链接', () => {
    const all = groups.flatMap((g) => g.links)
    expect(all.some((l) => l.name === 'Bad Link')).toBe(false)
  })
})

describe('serializeJson / parseJsonData', () => {
  function makeData(): NavData {
    return {
      version: DATA_VERSION,
      updatedAt: '2026-08-11',
      settings: {
        searchEngine: 'bing',
        searchEngines: [{ id: 'bing', name: 'Bing', url: 'https://www.bing.com/search?q={q}' }],
      },
      groups: [
        {
          id: 'g1',
          name: '开发',
          order: 1,
          links: [{ id: 'l1', name: 'GitHub', url: 'https://github.com', order: 1 }],
        },
      ],
    }
  }

  it('序列化后可被解析回同结构数据', () => {
    const data = makeData()
    const parsed = parseJsonData(serializeJson(data))
    expect(parsed).toEqual(data)
  })

  it('拒绝非 JSON 文本', () => {
    expect(parseJsonData('not json')).toBeNull()
  })

  it('拒绝版本不匹配的 JSON', () => {
    const data = makeData()
    data.version = DATA_VERSION + 1
    expect(parseJsonData(JSON.stringify(data))).toBeNull()
  })
})
