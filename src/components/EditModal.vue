<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { useNavStore } from '@/stores/nav'
import { editTarget, openEdit } from '@/composables/ui'

const nav = useNavStore()

const form = reactive({ name: '', url: '', desc: '', icon: '' })

watch(editTarget, (t) => {
  form.name = t?.initial?.name ?? ''
  form.url = t?.initial?.url ?? ''
  form.desc = t?.initial?.desc ?? ''
  form.icon = t?.initial?.icon ?? ''
})

/** Esc 关闭 */
watch(editTarget, (t) => {
  if (t) window.addEventListener('keydown', onKeydown)
  else window.removeEventListener('keydown', onKeydown)
})

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') openEdit(null)
}

const isGroup = computed(() => editTarget.value?.mode === 'group')

const title = computed(() => {
  const t = editTarget.value
  if (!t) return ''
  if (t.mode === 'group') return t.groupId ? '编辑分组' : '新增分组'
  return t.linkId ? '编辑站点' : '新增站点'
})

function submit() {
  const t = editTarget.value
  if (!t) return

  if (t.mode === 'group') {
    const name = form.name.trim()
    if (!name) return
    const icon = form.icon.trim() || undefined
    if (t.groupId) nav.updateGroup(t.groupId, { name, icon })
    else nav.addGroup(name, icon)
  } else if (t.groupId) {
    const patch = {
      name: form.name.trim(),
      url: form.url.trim(),
      desc: form.desc.trim() || undefined,
      icon: form.icon.trim() || undefined,
    }
    if (t.linkId) nav.updateLink(t.groupId, t.linkId, patch)
    else nav.addLink(t.groupId, patch)
  }
  openEdit(null)
}

function cancel() {
  openEdit(null)
}
</script>

<template>
  <Teleport to="body">
    <!-- mousedown.self：只有真正在遮罩上按下才关闭；输入框拖选文字拖出弹窗松手不会误关 -->
    <div v-if="editTarget" class="modal-mask" @mousedown.self="cancel">
      <div class="modal" role="dialog" aria-modal="true">
        <h3 class="modal-title">{{ title }}</h3>
        <form @submit.prevent="submit">
          <label class="field">
            <span>名称 *</span>
            <input v-model="form.name" required autofocus placeholder="站点名称" />
          </label>
          <label v-if="!isGroup" class="field">
            <span>网址 *</span>
            <input v-model="form.url" required type="url" placeholder="https://example.com" />
          </label>
          <label v-if="!isGroup" class="field">
            <span>描述</span>
            <input v-model="form.desc" placeholder="可选，展示在卡片上" />
          </label>
          <label class="field">
            <span>图标</span>
            <input v-model="form.icon" placeholder="可选：图片地址或 emoji" />
          </label>
          <div class="modal-actions">
            <button type="button" class="btn" @click="cancel">取消</button>
            <button type="submit" class="btn primary">保存</button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>
