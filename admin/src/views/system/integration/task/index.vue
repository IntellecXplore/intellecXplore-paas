<template>
  <div class="p-5">
    <ArtTable :data="tableData" :loading="loading" :pagination="{ total, current, size }"
      @pagination:current-change="onCurrentChange" @pagination:size-change="onSizeChange">
      <template #search>
        <el-form :model="queryForm" inline>
          <el-form-item label="任务名称">
            <el-input v-model="queryForm.name" clearable placeholder="任务名称" />
          </el-form-item>
          <el-form-item label="数据源">
            <el-select v-model="queryForm.sourceId" clearable placeholder="全部" style="width:180px">
              <el-option v-for="s in sourceList" :key="s.id" :label="s.name" :value="s.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="queryForm.status" clearable placeholder="全部">
              <el-option label="草稿" value="draft" />
              <el-option label="启用" value="active" />
              <el-option label="暂停" value="paused" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="doSearch">搜索</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </el-form-item>
        </el-form>
      </template>

      <template #toolbar>
        <el-button type="primary" @click="openAdd">新增任务</el-button>
      </template>

      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="name" label="任务名称" min-width="160" />
      <el-table-column label="数据源" width="140">
        <template #default="{ row }">{{ getSourceName(row.sourceId) }}</template>
      </el-table-column>
      <el-table-column label="数据对象" width="120">
        <template #default="{ row }">{{ getObjectName(row.objectId) }}</template>
      </el-table-column>
      <el-table-column label="同步模式" width="80">
        <template #default="{ row }">{{ row.syncMode === 'incremental' ? '增量' : '全量' }}</template>
      </el-table-column>
      <el-table-column label="定时" width="120">
        <template #default="{ row }">{{ row.scheduleCron || '手动' }}</template>
      </el-table-column>
      <el-table-column label="状态" width="70">
        <template #default="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : row.status === 'paused' ? 'warning' : 'info'" size="small">
            {{ row.status === 'active' ? '启用' : row.status === 'paused' ? '暂停' : '草稿' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="最近同步" width="160">
        <template #default="{ row }">{{ row.lastSyncAt || '-' }}</template>
      </el-table-column>
      <el-table-column label="最近状态" width="80">
        <template #default="{ row }">
          <el-tag v-if="row.lastSyncStatus" :type="row.lastSyncStatus === 'success' ? 'success' : row.lastSyncStatus === 'partial' ? 'warning' : 'danger'" size="small">
            {{ row.lastSyncStatus === 'success' ? '成功' : row.lastSyncStatus === 'partial' ? '部分' : '失败' }}
          </el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="260" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button link type="success" v-if="row.status !== 'draft'" @click="doTrigger(row)">同步</el-button>
          <el-button link type="info" @click="doPreview(row)">预览</el-button>
          <el-button link :type="row.status === 'active' ? 'warning' : 'primary'" @click="doToggle(row)">
            {{ row.status === 'active' ? '暂停' : '启用' }}
          </el-button>
          <el-button link type="danger" @click="doDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </ArtTable>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑任务' : '新增任务'" width="600px" @close="resetForm">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="任务名称" prop="name">
          <el-input v-model="form.name" placeholder="如：同步客户数据" />
        </el-form-item>
        <el-form-item label="数据源" prop="sourceId">
          <el-select v-model="form.sourceId" placeholder="选择数据源" style="width:100%" @change="onSourceChange">
            <el-option v-for="s in sourceList" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="数据对象" prop="objectId">
          <el-select v-model="form.objectId" placeholder="先选择数据源" :disabled="!form.sourceId" style="width:100%">
            <el-option v-for="o in objectList" :key="o.id" :label="`${o.objectName} (${o.objectCode})`" :value="o.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="同步模式">
          <el-radio-group v-model="form.syncMode">
            <el-radio value="full">全量同步</el-radio>
            <el-radio value="incremental">增量同步</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="定时表达式">
          <el-input v-model="form.scheduleCron" placeholder="留空为手动触发，如：0 2 * * * (每天凌晨2点)" />
        </el-form-item>
        <el-form-item label="写入目标">
          <el-select v-model="form.targetCollectionId" placeholder="选择目标数据表（动态表单）" filterable style="width:100%">
            <el-option v-for="c in collectionList" :key="c.id" :label="`${c.label} (${c.tableName})`" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="批量条数">
          <el-input-number v-model="form.batchSize" :min="10" :max="5000" :step="100" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="doSave">保存</el-button>
      </template>
    </el-dialog>

    <!-- Preview Dialog -->
    <el-dialog v-model="previewVisible" title="预览同步数据" width="800px">
      <el-table :data="previewList" v-loading="previewing" max-height="400" size="small" border>
        <el-table-column v-for="col in previewCols" :key="col" :prop="col" :label="col" min-width="120" />
      </el-table>
      <div class="mt-2 text-sm text-gray-500">共 {{ previewTotal }} 条预览数据（最多 10 条）</div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { fetchTaskList, createTask, updateTask, deleteTask, triggerSync, toggleTask, previewTaskData } from '@/api/integration/task'
import { fetchSourceList } from '@/api/integration/source'
import { fetchObjectList } from '@/api/integration/object'

const loading = ref(false)
const tableData = ref<any[]>([])
const total = ref(0)
const current = ref(1)
const size = ref(10)
const queryForm = reactive({ name: '', sourceId: '', status: '' })
const sourceList = ref<any[]>([])
const objectList = ref<any[]>([])
const collectionList = ref<any[]>([])

const loadData = async () => {
  loading.value = true
  try {
    const res = await fetchTaskList({ ...queryForm, pageNum: current.value, pageSize: size.value })
    tableData.value = (res as any)?.data?.list || res?.list || []
    total.value = (res as any)?.data?.total || res?.total || 0
  } finally { loading.value = false }
}

const doSearch = () => { current.value = 1; loadData() }
const resetSearch = () => { queryForm.name = ''; queryForm.sourceId = ''; queryForm.status = ''; doSearch() }
const onCurrentChange = (page: number) => { current.value = page; loadData() }
const onSizeChange = (val: number) => { size.value = val; loadData() }

const getSourceName = (id: number) => sourceList.value.find(s => s.id === id)?.name || '-'
const getObjectName = (id: number) => objectList.value.find(o => o.id === id)?.objectName || '-'

const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref()
const form = reactive<Record<string, any>>({
  id: undefined, name: '', sourceId: '', objectId: '',
  syncMode: 'full', scheduleCron: '', targetCollectionId: '', batchSize: 500,
})
const rules = {
  name: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
  sourceId: [{ required: true, message: '请选择数据源', trigger: 'change' }],
  objectId: [{ required: true, message: '请选择数据对象', trigger: 'change' }],
}

const onSourceChange = async (sourceId: number) => {
  form.objectId = ''
  objectList.value = []
  if (!sourceId) return
  try {
    const res: any = await fetchObjectList({ sourceId, pageNum: 1, pageSize: 100 })
    objectList.value = (res?.data?.list || res?.list || [])
  } catch { /* ignore */ }
}

const openAdd = () => {
  isEdit.value = false
  Object.assign(form, { id: undefined, name: '', sourceId: '', objectId: '', syncMode: 'full', scheduleCron: '', targetCollectionId: '', batchSize: 500 })
  objectList.value = []
  dialogVisible.value = true
}

const openEdit = async (row: any) => {
  isEdit.value = true
  await onSourceChange(row.sourceId)
  Object.assign(form, row)
  dialogVisible.value = true
}

const doSave = async () => {
  await formRef.value?.validate()
  const payload = { ...form }
  if (isEdit.value) {
    await updateTask(payload)
    ElMessage.success('更新成功')
  } else {
    await createTask(payload)
    ElMessage.success('创建成功')
  }
  dialogVisible.value = false
  loadData()
}

const doDelete = async (row: any) => {
  await ElMessageBox.confirm(`确定要删除任务"${row.name}"吗？`, '提示', { type: 'warning' })
  await deleteTask(String(row.id))
  ElMessage.success('删除成功')
  loadData()
}

const doTrigger = async (row: any) => {
  await ElMessageBox.confirm(`确定要立即触发同步任务"${row.name}"吗？`, '提示', { type: 'info' })
  try {
    await triggerSync(row.id)
    ElMessage.success('同步已触发，请查看同步日志')
  } catch { /* handled by request interceptor */ }
}

const doToggle = async (row: any) => {
  try {
    const res: any = await toggleTask(row.id)
    const status = (res?.data || res)?.status
    ElMessage.success(status === 'active' ? '任务已启用' : '任务已暂停')
    loadData()
  } catch { /* handled */ }
}

const resetForm = () => { formRef.value?.resetFields() }

// Preview
const previewVisible = ref(false)
const previewList = ref<any[]>([])
const previewCols = ref<string[]>([])
const previewTotal = ref(0)
const previewing = ref(false)
const doPreview = async (row: any) => {
  previewVisible.value = true
  previewing.value = true
  previewList.value = []
  previewCols.value = []
  try {
    const res: any = await previewTaskData(row.id, 10)
    const list = res?.data?.list || res?.list || []
    previewList.value = list
    previewTotal.value = res?.data?.total || res?.total || list.length
    if (list.length > 0) previewCols.value = Object.keys(list[0])
  } catch { /* handled */ }
  finally { previewing.value = false }
}

onMounted(async () => {
  loadData()
  // 加载数据源列表（用于搜索和表单）
  try {
    const res: any = await fetchSourceList({ pageNum: 1, pageSize: 200 })
    sourceList.value = (res?.data?.list || res?.list || [])
  } catch { /* ignore */ }
  // 加载元数据表列表（用于写入目标选择）
  try {
    const { default: request } = await import('@/utils/http')
    const res: any = await request.get({ url: '/api/system/metadata/collection/list', params: { pageNum: 1, pageSize: 200 } })
    collectionList.value = (res?.data?.list || res?.list || [])
  } catch { /* ignore */ }
})
</script>
