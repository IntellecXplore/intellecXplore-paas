<template>
  <div class="collection-page art-full-height">
    <CollectionSearch v-model="searchForm" @search="handleSearch" @reset="resetSearchParams" />

    <ElCard class="art-table-card" shadow="never">
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData">
        <template #left>
          <ElSpace wrap>
            <ElButton v-auth="'system:metadata:collection:create'" @click="showDialog('add')" v-ripple>新增数据表</ElButton>
          </ElSpace>
        </template>
      </ArtTableHeader>

      <ArtTable :loading="loading" :data="data" :columns="columns" :pagination="pagination"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange">
      </ArtTable>

      <CollectionDialog v-model:visible="dialogVisible" :type="dialogType" :data="currentData"
        @submit="handleDialogSubmit" />
    </ElCard>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { useAuth } from '@/hooks'
import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
import { useTable } from '@/hooks/core/useTable'
import {
  fetchGetCollectionList, fetchDeleteCollection,
  fetchPublishCollection, fetchDeployCollection, fetchToggleCollectionStatus
} from '@/api/metadata/collection'
import CollectionSearch from './modules/collection-search.vue'
import CollectionDialog from './modules/collection-dialog.vue'
import { ElTag, ElMessageBox } from 'element-plus'
import { DialogType } from '@/types'
import { useRouter } from 'vue-router'

const auth = useAuth()
const router = useRouter()

defineOptions({ name: 'MetadataCollection' })

type CollectionListItem = Api.MetadataCollection.CollectionListItem

const dialogType = ref<DialogType>('add')
const dialogVisible = ref(false)
const currentData = ref<Partial<CollectionListItem>>({})

const searchForm = ref({
  tableName: undefined,
  label: undefined,
  databaseType: undefined,
  namespace: undefined,
  status: undefined
})

const statusTagMap: Record<string, string> = {
  draft: 'info',
  preparing: 'warning',
  staging: 'primary',
  active: 'success',
  inactive: 'danger',
  sync_failed: 'danger',
}

const statusLabelMap: Record<string, string> = {
  draft: '草稿',
  preparing: '准备中',
  staging: '待上线',
  active: '已上线',
  inactive: '已停用',
  sync_failed: '发布失败',
}

const {
  columns,
  columnChecks,
  data,
  loading,
  pagination,
  getData,
  searchParams,
  resetSearchParams,
  handleSizeChange,
  handleCurrentChange,
  refreshData
} = useTable({
  core: {
    apiFn: fetchGetCollectionList,
    apiParams: searchForm.value,
    paginationKey: {
      current: 'pageNum',
      size: 'pageSize'
    },
    columnsFactory: () => [
      { type: 'selection' },
      { type: 'index', width: 60, label: '序号' },
      { prop: 'tableName', label: '物理表名', width: 160 },
      { prop: 'label', label: '显示名称', width: 160 },
      {
        prop: 'databaseType', label: '存储类型', width: 120,
        formatter: (row) => h(ElTag, { type: row.databaseType === 'postgresql' ? 'success' : 'warning' }, () => row.databaseType)
      },
      { prop: 'namespace', label: '命名空间', width: 120 },
      { prop: 'version', label: '版本', width: 70 },
      {
        prop: 'status', label: '状态', width: 100,
        formatter: (row) => h(ElTag, { type: statusTagMap[row.status] || 'info' }, () => statusLabelMap[row.status] || row.status)
      },
      {
        prop: 'createTime', label: '创建时间', width: 170,
        formatter: (row) => dayjs(row.createTime).format('YYYY-MM-DD HH:mm:ss')
      },
      {
        prop: 'operation', label: '操作', width: 320, fixed: 'right',
        formatter: (row) => {
          const btns = []
          if (row.status === 'draft' || row.status === 'sync_failed') {
            if (auth.hasAuth('system:metadata:collection:update')) {
              btns.push(h(ArtButtonTable, { type: 'edit', onClick: () => showDialog('edit', row) }))
            }
          }
          if (row.status === 'draft') {
            btns.push(h(ElButton, { size: 'small', type: 'primary', link: true, onClick: () => router.push(`/system/metadata/field/${row.id}`) }, () => '配置字段'))
          }
          if (row.status === 'draft' || row.status === 'sync_failed') {
            if (auth.hasAuth('system:metadata:collection:update')) {
              btns.push(h(ElButton, { size: 'small', type: 'success', link: true, onClick: () => publishCollection(row) }, () => '发布'))
            }
          }
          if (row.status === 'staging') {
            if (auth.hasAuth('system:metadata:collection:update')) {
              btns.push(h(ElButton, { size: 'small', type: 'warning', link: true, onClick: () => deployCollection(row) }, () => '部署上线'))
            }
          }
          if (row.status === 'active') {
            if (auth.hasAuth('system:metadata:collection:update')) {
              btns.push(h(ElButton, { size: 'small', type: 'danger', link: true, onClick: () => toggleStatus(row) }, () => '停用'))
            }
          }
          if (row.status === 'inactive') {
            if (auth.hasAuth('system:metadata:collection:update')) {
              btns.push(h(ElButton, { size: 'small', type: 'success', link: true, onClick: () => toggleStatus(row) }, () => '激活'))
            }
          }
          if (row.status === 'draft' || row.status === 'inactive') {
            if (auth.hasAuth('system:metadata:collection:delete')) {
              btns.push(h(ArtButtonTable, { type: 'delete', onClick: () => deleteCollection(row) }))
            }
          }
          return h('div', btns)
        }
      }
    ]
  },
})

const handleSearch = (params: Record<string, any>) => {
  Object.assign(searchParams, params)
  getData()
}

const showDialog = (type: DialogType, row?: CollectionListItem) => {
  dialogType.value = type
  currentData.value = row || {}
  nextTick(() => { dialogVisible.value = true })
}

const deleteCollection = (row: CollectionListItem) => {
  ElMessageBox.confirm(`确定要删除数据表"${row.label}"吗？`, '删除确认', {
    confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
  }).then(() => {
    fetchDeleteCollection(row.id as number).then(() => refreshData())
  }).catch(() => { ElMessage.info('已取消') })
}

const publishCollection = (row: CollectionListItem) => {
  ElMessageBox.confirm(`确定要发布"${row.label}"吗？将创建物理数据库表。`, '发布确认', {
    confirmButtonText: '确定', cancelButtonText: '取消', type: 'info'
  }).then(() => {
    fetchPublishCollection(row.id as number).then(() => refreshData())
  }).catch(() => { ElMessage.info('已取消') })
}

const deployCollection = (row: CollectionListItem) => {
  ElMessageBox.confirm(`确定要将"${row.label}"部署上线吗？`, '部署确认', {
    confirmButtonText: '确定', cancelButtonText: '取消', type: 'info'
  }).then(() => {
    fetchDeployCollection(row.id as number).then(() => refreshData())
  }).catch(() => { ElMessage.info('已取消') })
}

const toggleStatus = (row: CollectionListItem) => {
  const action = row.status === 'active' ? '停用' : '激活'
  ElMessageBox.confirm(`确定要${action}"${row.label}"吗？`, `${action}确认`, {
    confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
  }).then(() => {
    fetchToggleCollectionStatus(row.id as number).then(() => refreshData())
  }).catch(() => { ElMessage.info('已取消') })
}

const handleDialogSubmit = async () => {
  try {
    await refreshData()
    currentData.value = {}
  } catch (error) {
    console.error('提交失败:', error)
  }
}
</script>
