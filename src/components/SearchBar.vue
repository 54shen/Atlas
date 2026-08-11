<script setup lang="ts">
import { computed } from 'vue'
import { useSearchStore } from '@/stores/search'
import { useNavStore } from '@/stores/nav'
import { buildEngineUrl, isUrlLike, normalizeUrl } from '@/utils/search'

const search = useSearchStore()
const nav = useNavStore()

/** 引擎下拉：直接绑定当前引擎 id，切换即持久化（F11） */
const engineId = computed({
  get: () => nav.searchEngine?.id ?? '',
  set: (id) => nav.setSearchEngine(id),
})

function openUrl(url: string) {
  window.open(url, '_blank', 'noopener')
}

/** 回车行为（开发文档 §7.3）：URL → 直接打开；有匹配 → 打开第一个；否则 → 引擎跳转 */
function onSubmit() {
  const q = search.query.trim()
  if (!q) return

  if (isUrlLike(q)) {
    openUrl(normalizeUrl(q))
    return
  }

  const first = search.firstMatch
  if (first) {
    openUrl(first.url)
    return
  }

  const engine = nav.searchEngine
  if (engine) openUrl(buildEngineUrl(engine.url, q))
}
</script>

<template>
  <div class="search-box">
    <select
      v-model="engineId"
      class="engine-select"
      :title="'当前引擎：' + (nav.searchEngine?.name ?? '')"
      aria-label="选择搜索引擎"
    >
      <option v-for="e in nav.engines" :key="e.id" :value="e.id">{{ e.name }}</option>
    </select>
    <input
      id="global-search"
      v-model="search.query"
      type="search"
      class="search-input"
      placeholder="搜索站点，回车打开 / 跳转引擎"
      @keydown.enter.prevent="onSubmit"
    />
    <button
      v-if="search.query"
      class="search-clear"
      aria-label="清空搜索"
      @click="search.query = ''"
    >
      ✕
    </button>
  </div>
</template>

<style scoped>
.search-box {
  position: relative;
  width: 100%;
}

.engine-select {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  max-width: 72px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 12px;
  outline: none;
  cursor: pointer;
}

.search-input {
  width: 100%;
  height: 38px;
  padding: 0 36px 0 92px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--card-bg);
  color: var(--text);
  font-size: 14px;
  outline: none;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}

.search-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.search-input::placeholder {
  color: var(--text-secondary);
}

.search-clear {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: none;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-secondary);
  padding: 4px;
}

.search-clear:hover {
  color: var(--text);
}

@media (max-width: 640px) {
  .engine-select {
    display: none;
  }

  .search-input {
    padding-left: 16px;
  }
}
</style>
