import { afterEach, describe, expect, it, vi } from 'vitest'
import { saveToServer } from './api'
import { DATA_VERSION } from './merge'
import type { NavData } from '@/types'

function makeData(): NavData {
  return {
    version: DATA_VERSION,
    updatedAt: '2026-08-11',
    settings: {
      searchEngine: 'bing',
      searchEngines: [{ id: 'bing', name: 'Bing', url: 'https://www.bing.com/search?q={q}' }],
    },
    groups: [{ id: 'g1', name: '开发', order: 1, links: [] }],
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('saveToServer', () => {
  it('POST 到 /api/data，接口返回 ok 时返回 true', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
    vi.stubGlobal('fetch', fetchMock)
    expect(await saveToServer(makeData())).toBe(true)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/data')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body as string).groups).toHaveLength(1)
  })

  it('非 2xx 返回 false', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
    expect(await saveToServer(makeData())).toBe(false)
  })

  it('接口返回 ok:false 时返回 false', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: false }) }),
    )
    expect(await saveToServer(makeData())).toBe(false)
  })

  it('网络异常返回 false 而不抛错', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))
    await expect(saveToServer(makeData())).resolves.toBe(false)
  })
})
