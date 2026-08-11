<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import NavCard from './NavCard.vue'
import type { NavGroup as NavGroupType } from '@/types'
import { useNavStore } from '@/stores/nav'
import { useSearchStore } from '@/stores/search'
import { openEdit, setDragActive } from '@/composables/ui'

// 拖拽库懒加载：仅在编辑模式首次渲染时加载，平时不增加主包体积
const Draggable = defineAsyncComponent(() => import('vuedraggable'))

const props = defineProps<{ group: NavGroupType }>()
const nav = useNavStore()
const search = useSearchStore()

/** 拖拽结束：恢复文字可选 + 持久化拖拽结果 */
function onLinkDragEnd() {
  setDragActive(false)
  nav.persistFromDrag()
}

function onDeleteGroup() {
  if (confirm(`确定删除分组「${props.group.name}」及其全部站点？`)) {
    nav.deleteGroup(props.group.id)
  }
}

function onDeleteLink(linkId: string) {
  if (confirm(`确定删除站点「${props.group.links.find((l) => l.id === linkId)?.name ?? ''}」？`)) {
    nav.deleteLink(props.group.id, linkId)
  }
}
</script>

<template>
  <section class="group">
    <div class="group-head">
      <h2 class="group-title">
        <span v-if="group.icon" class="group-icon">{{ group.icon }}</span>
        {{ group.name }}
      </h2>
      <div v-if="nav.isEditing" class="group-actions">
        <span class="group-grip" title="拖动分组排序">⠿</span>
        <button
          class="mini-btn"
          title="新增站点"
          aria-label="新增站点"
          @click="openEdit({ mode: 'link', groupId: group.id, linkId: null })"
        >
          ➕
        </button>
        <button
          class="mini-btn"
          title="编辑分组"
          aria-label="编辑分组"
          @click="
            openEdit({
              mode: 'group',
              groupId: group.id,
              linkId: null,
              initial: { name: group.name, icon: group.icon },
            })
          "
        >
          ✏️
        </button>
        <button
          class="mini-btn danger"
          title="删除分组"
          aria-label="删除分组"
          @click="onDeleteGroup"
        >
          🗑️
        </button>
      </div>
    </div>
    <!-- 编辑模式：SortableJS 拖拽（组内 + 跨组），搜索时禁用拖拽 -->
    <Draggable
      v-if="nav.isEditing && !search.query"
      :list="group.links"
      :group="{ name: 'links' }"
      item-key="id"
      class="group-grid"
      ghost-class="drag-ghost"
      fallback-class="drag-fallback"
      :animation="150"
      :force-fallback="true"
      :fallback-on-body="true"
      @start="setDragActive(true)"
      @end="onLinkDragEnd"
    >
      <template #item="{ element }">
        <NavCard
          :link="element"
          :is-editing="true"
          @edit="
            openEdit({
              mode: 'link',
              groupId: group.id,
              linkId: element.id,
              initial: {
                name: element.name,
                url: element.url,
                desc: element.desc,
                icon: element.icon,
              },
            })
          "
          @delete="onDeleteLink(element.id)"
        />
      </template>
    </Draggable>
    <!-- 普通模式：静态网格 -->
    <div v-else class="group-grid">
      <NavCard
        v-for="link in group.links"
        :key="link.id"
        :link="link"
        :is-editing="nav.isEditing"
        @edit="
          openEdit({
            mode: 'link',
            groupId: group.id,
            linkId: link.id,
            initial: { name: link.name, url: link.url, desc: link.desc, icon: link.icon },
          })
        "
        @delete="onDeleteLink(link.id)"
      />
    </div>
  </section>
</template>

<style scoped>
.group {
  margin-bottom: 36px;
}

.group-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.group-head {
  user-select: none; /* 分组标题栏拖拽时禁止选中文字 */
}

.group-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 17px;
  font-weight: 600;
}

.group-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.group-grip {
  font-size: 14px;
  color: var(--text-secondary);
  padding: 0 2px;
  cursor: grab;
  user-select: none;
}

.group-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 12px;
}

@media (max-width: 640px) {
  .group-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 10px;
  }
}
</style>
