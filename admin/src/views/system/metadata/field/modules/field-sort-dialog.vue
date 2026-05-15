<template>
  <ElDialog v-model="dialogVisible" title="字段排序" width="500px" align-center
    @closed="handleClosed">
    <ElTable :data="sortList" row-key="id" max-height="400px">
      <ElTableColumn label="拖拽" width="60" align="center">
        <template #default>
          <span class="drag-handle" style="cursor: grab; user-select: none">⋮⋮</span>
        </template>
      </ElTableColumn>
      <ElTableColumn prop="columnName" label="数据库列名" width="180" />
      <ElTableColumn label="排序号" width="120" align="center">
        <template #default="{ row }">
          <ElInputNumber v-model="row.sortOrder" :min="0" size="small" controls-position="right" />
        </template>
      </ElTableColumn>
      <ElTableColumn label="操作" width="100" align="center">
        <template #default="{ $index }">
          <ElButton size="small" :disabled="$index === 0" @click="moveUp($index)" v-ripple>上移</ElButton>
          <ElButton size="small" :disabled="$index === sortList.length - 1" @click="moveDown($index)" v-ripple class="ml-1">下移</ElButton>
        </template>
      </ElTableColumn>
    </ElTable>
    <template #footer>
      <div class="dialog-footer">
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="loading" @click="handleSubmit">保存排序</ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
import { fetchSortFields } from '@/api/metadata/field'

interface Props {
  visible: boolean
  fields: Api.MetadataField.FieldListItem[]
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'submit'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const loading = ref(false)
const sortList = ref<{ id: number; columnName: string; sortOrder: number }[]>([])

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      sortList.value = (props.fields || [])
        .filter((f: any) => f.id)
        .map((f: any, index: number) => ({
          id: f.id,
          columnName: f.columnName,
          sortOrder: f.sortOrder ?? index,
        }))
    }
  }
)

const moveUp = (index: number) => {
  if (index <= 0) return
  const temp = sortList.value[index]
  sortList.value[index] = sortList.value[index - 1]
  sortList.value[index - 1] = temp
  renumber()
}

const moveDown = (index: number) => {
  if (index >= sortList.value.length - 1) return
  const temp = sortList.value[index]
  sortList.value[index] = sortList.value[index + 1]
  sortList.value[index + 1] = temp
  renumber()
}

const renumber = () => {
  sortList.value.forEach((item, index) => {
    item.sortOrder = index
  })
}

const handleSubmit = async () => {
  loading.value = true
  try {
    await fetchSortFields({
      fields: sortList.value.map((item) => ({
        id: item.id,
        sortOrder: item.sortOrder,
      })),
    })
    emit('submit')
    dialogVisible.value = false
  } catch {
    // error handled by request interceptor
  } finally {
    loading.value = false
  }
}

const handleClosed = () => {
  loading.value = false
}
</script>

<style scoped>
.drag-handle {
  font-size: 18px;
  color: #909399;
  letter-spacing: 2px;
}
</style>
