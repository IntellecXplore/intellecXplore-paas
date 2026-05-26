<template>
  <div class="database-config-page art-full-height">
    <ElCard class="art-table-card" shadow="never">
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData">
        <template #left>
          <ElSpace wrap>
            <ElButton v-auth="'system:metadata:database-config:create'" type="primary" @click="showDialog('add')" v-ripple>新增</ElButton>
            <ElButton v-auth="'system:metadata:database-config:delete'" type="danger" :disabled="selectedRows.length === 0"
              @click="handleBatchDelete" v-ripple>
              批量删除
            </ElButton>
          </ElSpace>
        </template>
        <template #right>
          <ElInput v-model="searchName" placeholder="搜索配置名称" clearable style="width: 200px" @keyup.enter="handleSearch" @clear="handleSearch" />
        </template>
      </ArtTableHeader>

      <ArtTable :loading="loading" :data="data" :columns="columns" :pagination="pagination"
        @selection-change="handleSelectionChange"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange">
      </ArtTable>

      <DatabaseConfigDialog v-model:visible="dialogVisible" :type="dialogType" :data="currentData"
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
  fetchGetDatabaseConfigList, fetchDeleteDatabaseConfig,
} from '@/api/metadata/database-config'
import DatabaseConfigDialog from './modules/database-config-dialog.vue'
import { ElTag, ElMessage, ElMessageBox } from 'element-plus'
import { DialogType } from '@/types'

const auth = useAuth()

defineOptions({ name: 'MetadataDatabaseConfig' })

type DatabaseConfigItem = Api.MetadataDatabaseConfig.DatabaseConfigItem

const dialogType = ref<DialogType>('add')
const dialogVisible = ref(false)
const currentData = ref<Partial<DatabaseConfigItem>>({})
const selectedRows = ref<DatabaseConfigItem[]>([])
const searchName = ref('')

const {
  columns,
  columnChecks,
  data,
  loading,
  pagination,
  getData,
  searchParams,
  handleSizeChange,
  handleCurrentChange,
  refreshData
} = useTable({
  core: {
    apiFn: fetchGetDatabaseConfigList,
    apiParams: searchParams,
    paginationKey: {
      current: 'pageNum',
      size: 'pageSize'
    },
    columnsFactory: () => [
      { type: 'selection' },
      { type: 'index', width: 60, label: '序号' },
      { prop: 'name', label: '配置名称', width: 180 },
      { prop: 'host', label: '主机地址', width: 160 },
      { prop: 'port', label: '端口', width: 80 },
      { prop: 'username', label: '用户名', width: 120 },
      { prop: 'database', label: '数据库名', width: 140 },
      { prop: 'schema', label: 'Schema', width: 120 },
      { prop: 'description', label: '描述', minWidth: 150 },
      {
        prop: 'status', label: '状态', width: 80,
        formatter: (row) => h(ElTag, { type: row.status === 'active' ? 'success' : 'danger' }, () => row.status === 'active' ? '启用' : '停用')
      },
      {
        prop: 'createTime', label: '创建时间', width: 170,
        formatter: (row) => dayjs(row.createTime).format('YYYY-MM-DD HH:mm:ss')
      },
      {
        prop: 'operation', label: '操作', width: 180, fixed: 'right',
        formatter: (row) => {
          const btns = []
          if (auth.hasAuth('system:metadata:database-config:update')) {
            btns.push(h(ArtButtonTable, { type: 'edit', onClick: () => showDialog('edit', row) }))
          }
          if (auth.hasAuth('system:metadata:database-config:delete')) {
            btns.push(h(ArtButtonTable, { type: 'delete', onClick: () => deleteRow(row) }))
          }
          return h('div', btns)
        }
      }
    ]
  },
})

const handleSearch = () => {
  searchParams.name = searchName.value || undefined
  getData()
}

const showDialog = (type: DialogType, row?: DatabaseConfigItem) => {
  dialogType.value = type
  currentData.value = row || {}
  nextTick(() => { dialogVisible.value = true })
}

const deleteRow = (row: DatabaseConfigItem) => {
  ElMessageBox.confirm(`确定要删除数据库配置"${row.name}"吗？`, '删除确认', {
    confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
  }).then(() => {
    fetchDeleteDatabaseConfig(row.id as number).then(() => refreshData())
  }).catch(() => { ElMessage.info('已取消') })
}

const handleDialogSubmit = async () => {
  await refreshData()
  currentData.value = {}
}

const handleSelectionChange = (selection: DatabaseConfigItem[]) => {
  selectedRows.value = selection
}

const handleBatchDelete = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请选择要删除的数据')
    return
  }
  const names = selectedRows.value.map((item) => item.name).join('、')
  ElMessageBox.confirm(`确定要删除以下数据库配置吗？此操作不可恢复！\n${names}`, '批量删除', {
    confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
  }).then(() => {
    const ids = selectedRows.value.map((item) => item.id as number)
    fetchDeleteDatabaseConfig(ids).then(() => refreshData())
  }).catch(() => { ElMessage.info('已取消删除') })
}
</script>
