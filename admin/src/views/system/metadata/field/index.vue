<template>
  <div class="field-page art-full-height">
    <div class="mb-4 flex items-center">
      <ElButton v-ripple @click="goBack" :icon="ArrowLeft">返回列表</ElButton>
      <span class="ml-4 text-lg font-medium" v-if="collectionInfo">
        {{ collectionInfo.label }} ({{ collectionInfo.tableName }})
        <ElTag class="ml-2" :type="statusTag(collectionInfo.status)">{{ statusLabel(collectionInfo.status) }}</ElTag>
      </span>
    </div>

    <ElCard class="art-table-card" shadow="never">
      <ArtTableHeader :loading="loading" @refresh="refreshData">
        <template #left>
          <ElSpace v-if="canEdit" wrap>
            <ElButton v-auth="'system:metadata:field:create'" type="primary" @click="showDialog('add')" v-ripple>
              新增字段
            </ElButton>
            <ElButton v-auth="'system:metadata:field:update'" @click="showSortDialog" v-ripple>
              批量排序
            </ElButton>
          </ElSpace>
        </template>
      </ArtTableHeader>

      <ArtTable :loading="loading" :data="data" :columns="columns" :pagination="pagination"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange">
      </ArtTable>
    </ElCard>

    <FieldDialog v-model:visible="dialogVisible" :type="dialogType" :collection-id="collectionId"
      :data="currentFieldData" @submit="handleDialogSubmit" />

    <FieldSortDialog v-model:visible="sortDialogVisible" :fields="data"
      @submit="handleSortSubmit" />
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft } from '@element-plus/icons-vue'
import { useAuth } from '@/hooks'
import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
import { useTable } from '@/hooks/core/useTable'
import { fetchGetFieldList, fetchDeleteField } from '@/api/metadata/field'
import { fetchGetCollectionDetail } from '@/api/metadata/collection'
import FieldDialog from './modules/field-dialog.vue'
import FieldSortDialog from './modules/field-sort-dialog.vue'
import { ElTag, ElMessageBox, ElMessage } from 'element-plus'
import { DialogType } from '@/types'
import { useRoute, useRouter } from 'vue-router'

const auth = useAuth()
const route = useRoute()
const router = useRouter()

defineOptions({ name: 'MetadataField' })

type FieldListItem = Api.MetadataField.FieldListItem
type CollectionListItem = Api.MetadataCollection.CollectionListItem

const collectionId = ref(Number(route.params.collectionId))
const collectionInfo = ref<CollectionListItem | null>(null)

const dialogType = ref<DialogType>('add')
const dialogVisible = ref(false)
const sortDialogVisible = ref(false)
const currentFieldData = ref<Partial<FieldListItem>>({})

const canEdit = computed(() => {
  const s = collectionInfo.value?.status
  return s === 'draft' || s === 'sync_failed'
})

const typeTagMap: Record<string, string> = {
  string: '', integer: 'success', boolean: 'warning',
  decimal: 'success', date: '', datetime: '', text: 'info',
  json: 'danger', email: '', phone: '', url: '',
  enum: 'primary', richtext: 'info',
}

const statusTag = (s: string) => {
  const map: Record<string, string> = { draft: 'info', active: 'success', inactive: 'danger' }
  return map[s] || 'info'
}
const statusLabel = (s: string) => {
  const map: Record<string, string> = { draft: '草稿', active: '已发布', inactive: '已停用' }
  return map[s] || s
}

const {
  columns,
  data,
  loading,
  pagination,
  getData,
  handleSizeChange,
  handleCurrentChange,
  refreshData
} = useTable({
  core: {
    apiFn: fetchGetFieldList,
    apiParams: { collectionId: collectionId.value },
    columnsFactory: () => [
      { type: 'index', width: 60, label: '序号' },
      { prop: 'columnName', label: '数据库列名', width: 160 },
      { prop: 'label', label: '显示名称', width: 140 },
      {
        prop: 'type', label: '字段类型', width: 100,
        formatter: (row) => h(ElTag, { type: typeTagMap[row.type] || '' }, () => row.type)
      },
      {
        prop: 'required', label: '必填', width: 60,
        formatter: (row) => row.required ? '√' : '×'
      },
      {
        prop: 'isUnique', label: '唯一', width: 60,
        formatter: (row) => row.isUnique ? '√' : '×'
      },
      {
        prop: 'indexed', label: '索引', width: 60,
        formatter: (row) => row.indexed ? '√' : '×'
      },
      { prop: 'sortOrder', label: '排序', width: 70 },
      {
        prop: 'status', label: '状态', width: 80,
        formatter: (row) => h(ElTag, { type: statusTag(row.status) }, () => statusLabel(row.status))
      },
      { prop: 'version', label: '版本', width: 60 },
      {
        prop: 'operation', label: '操作', width: 140, fixed: 'right',
        formatter: (row) => {
          const btns = []
          if (canEdit.value) {
            if (auth.hasAuth('system:metadata:field:update')) {
              btns.push(h(ArtButtonTable, { type: 'edit', onClick: () => showDialog('edit', row) }))
            }
            if (auth.hasAuth('system:metadata:field:delete')) {
              btns.push(h(ArtButtonTable, { type: 'delete', onClick: () => deleteField(row) }))
            }
          }
          return h('div', btns)
        }
      }
    ]
  },
})

const goBack = () => {
  router.push('/system/metadata/collection')
}

const loadCollectionInfo = async () => {
  const res = await fetchGetCollectionDetail(collectionId.value)
  collectionInfo.value = res
}

const showDialog = (type: DialogType, row?: FieldListItem) => {
  dialogType.value = type
  currentFieldData.value = row || {}
  nextTick(() => { dialogVisible.value = true })
}

const showSortDialog = () => {
  sortDialogVisible.value = true
}

const deleteField = (row: FieldListItem) => {
  ElMessageBox.confirm(`确定要删除字段"${row.columnName}"吗？`, '删除确认', {
    confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
  }).then(() => {
    fetchDeleteField(row.id as number).then(() => refreshData())
  }).catch(() => { ElMessage.info('已取消') })
}

const handleDialogSubmit = async () => {
  try {
    await refreshData()
    currentFieldData.value = {}
  } catch (error) {
    console.error('提交失败:', error)
  }
}

const handleSortSubmit = async () => {
  await refreshData()
}

onMounted(async () => {
  await loadCollectionInfo()
  getData()
})
</script>
