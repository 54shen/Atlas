<script setup lang="ts">
import { ref } from 'vue'
import type { SearchEngine } from '@/types'
import { useNavStore } from '@/stores/nav'
import { showSettings } from '@/composables/ui'
import { downloadTextFile, parseBookmarkHtml, parseJsonData, serializeJson } from '@/utils/exportImport'

const nav = useNavStore()
const newEngineName = ref('')
const newEngineUrl = ref('')

function onSiteNameChange(e: Event) {
  nav.updateSiteName((e.target as HTMLInputElement).value)
}

// ---------- 数据管理 ----------

function onExport() {
  if (!nav.data) return
  downloadTextFile('nav-links.json', serializeJson(nav.data))
}

function onImportJson(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    const parsed = parseJsonData(String(reader.result))
    if (!parsed) {
      alert('JSON 格式不正确或版本不匹配，导入失败')
      return
    }
    nav.importData(parsed)
    alert('导入成功')
  }
  reader.readAsText(file)
}

function onImportHtml(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    const groups = parseBookmarkHtml(String(reader.result))
    if (groups.length === 0) {
      alert('未解析到书签数据')
      return
    }
    nav.importGroups(groups)
    alert(`导入成功：${groups.length} 个分组`)
  }
  reader.readAsText(file)
}

function onReset() {
  if (!nav.hasLocalData) {
    alert('当前没有本地修改')
    return
  }
  if (confirm('将清除本地所有修改并恢复为仓库数据，确定？')) {
    nav.resetToBase()
  }
}

// ---------- 搜索引擎 ----------

function onEngineChange(engine: SearchEngine, key: 'name' | 'url', e: Event) {
  const value = (e.target as HTMLInputElement).value.trim()
  if (value) nav.updateEngine(engine.id, { [key]: value })
}

function onAddEngine() {
  const name = newEngineName.value.trim()
  const url = newEngineUrl.value.trim()
  if (!name || !url.includes('{q}')) {
    alert('请填写名称，且 URL 需包含 {q} 占位符')
    return
  }
  nav.addEngine({ name, url })
  newEngineName.value = ''
  newEngineUrl.value = ''
}
</script>

<template>
  <Teleport to="body">
    <!-- mousedown.self：只有真正在遮罩上按下才关闭；输入框拖选文字拖出弹窗松手不会误关 -->
    <div v-if="showSettings" class="modal-mask" @mousedown.self="showSettings = false">
      <div class="modal" role="dialog" aria-modal="true">
        <div class="modal-head">
          <h3 class="modal-title">设置</h3>
          <button class="icon-btn" aria-label="关闭" @click="showSettings = false">✕</button>
        </div>

        <section class="panel-section">
          <h4>站点设置</h4>
          <div class="panel-row">
            <input
              class="engine-input wide"
              :value="nav.siteName"
              aria-label="站点名称"
              placeholder="站点名称（显示在左上角与浏览器标签）"
              @change="onSiteNameChange"
            />
          </div>
          <div class="panel-row">
            <button class="btn primary" @click="nav.saveNow()">保存到服务器</button>
            <span v-if="nav.saveStatus !== 'idle'" class="save-status" :class="nav.saveStatus">
              {{ nav.saveStatus === 'saving' ? '保存中…' : nav.saveStatus === 'saved' ? '✅ 已保存' : '⚠️ 保存失败（纯静态托管无保存接口）' }}
            </span>
          </div>
          <p class="panel-tip">
            编辑模式的改动会自动保存到服务器（需 dev server 部署，见 README）；纯静态托管（Vercel 等）无保存接口，修改仅存浏览器本地。
          </p>
        </section>

        <section class="panel-section">
          <h4>数据管理</h4>
          <div class="panel-row">
            <button class="btn" @click="onExport">导出 JSON</button>
            <label class="btn" for="import-json">导入 JSON</label>
            <input
              id="import-json"
              type="file"
              accept=".json,application/json"
              class="hidden-file"
              @change="onImportJson"
            />
          </div>
          <div class="panel-row">
            <label class="btn" for="import-html">导入浏览器书签</label>
            <input
              id="import-html"
              type="file"
              accept=".html,.htm"
              class="hidden-file"
              @change="onImportHtml"
            />
          </div>
          <p class="panel-tip">
            导入 JSON 会整体替换当前数据；导入书签（Chrome/Edge/Firefox 导出的 HTML）会追加为新分组。
          </p>
          <div class="panel-row">
            <button class="btn danger" @click="onReset">恢复仓库数据</button>
          </div>
          <p v-if="nav.hasLocalData" class="panel-tip">
            当前浏览器正在使用本地修改数据。导出 JSON 后回填仓库并重新部署，即可全站生效。
          </p>
        </section>

        <section class="panel-section">
          <h4>搜索引擎</h4>
          <ul class="engine-list">
            <li v-for="e in nav.engines" :key="e.id" class="engine-item">
              <input
                class="engine-input"
                :value="e.name"
                aria-label="引擎名称"
                @change="onEngineChange(e, 'name', $event)"
              />
              <input
                class="engine-input wide"
                :value="e.url"
                aria-label="搜索 URL 模板"
                @change="onEngineChange(e, 'url', $event)"
              />
              <button class="mini-btn danger" title="删除引擎" aria-label="删除引擎" @click="nav.removeEngine(e.id)">
                🗑️
              </button>
            </li>
          </ul>
          <div class="engine-add">
            <input
              v-model="newEngineName"
              class="engine-input"
              placeholder="名称，如 知乎"
            />
            <input
              v-model="newEngineUrl"
              class="engine-input wide"
              placeholder="URL 模板，如 https://www.zhihu.com/search?type=content&q={q}"
            />
            <button class="btn primary" @click="onAddEngine">添加</button>
          </div>
        </section>
      </div>
    </div>
  </Teleport>
</template>
