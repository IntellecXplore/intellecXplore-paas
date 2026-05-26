<template>
  <div class="p-5">
    <ArtTable :data="tableData" :loading="loading" :pagination="{ total, current, size }"
      @pagination:current-change="onCurrentChange" @pagination:size-change="onSizeChange">
      <template #search>
        <el-form :model="queryForm" inline>
          <el-form-item label="数据源">
            <el-select v-model="queryForm.sourceId" clearable placeholder="全部" style="width:180px" @change="doSearch">
              <el-option v-for="s in sourceList" :key="s.id" :label="s.name" :value="s.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="对象编码">
            <el-input v-model="queryForm.objectCode" clearable placeholder="如 BD_CUSTOMER" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="doSearch">搜索</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </el-form-item>
        </el-form>
      </template>

      <template #toolbar>
        <el-button type="primary" @click="openAdd">新增对象</el-button>
      </template>

      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="objectCode" label="对象编码" width="160" />
      <el-table-column prop="objectName" label="对象名称" min-width="140" />
      <el-table-column label="类型" width="90">
        <template #default="{ row }">{{ objectTypeLabel(row.objectType) }}</template>
      </el-table-column>
      <el-table-column label="数据源" width="140">
        <template #default="{ row }">{{ getSourceName(row.sourceId) }}</template>
      </el-table-column>
      <el-table-column label="增量字段" width="120">
        <template #default="{ row }">{{ row.incrementalKey || '无' }}</template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button link type="success" @click="viewFields(row)">查看字段</el-button>
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" @click="doDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </ArtTable>

    <!-- Add/Edit Dialog -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑对象' : '新增对象'" width="520px" @close="resetForm">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="数据源" prop="sourceId">
          <el-select v-model="form.sourceId" placeholder="选择数据源" :disabled="isEdit" style="width:100%">
            <el-option v-for="s in sourceList" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="对象编码" prop="objectCode">
          <el-input v-model="form.objectCode" placeholder="如 BD_CUSTOMER" />
        </el-form-item>
        <el-form-item label="对象名称" prop="objectName">
          <el-input v-model="form.objectName" placeholder="如 客户" />
        </el-form-item>
        <el-form-item label="对象类型" prop="objectType">
          <el-select v-model="form.objectType" placeholder="选择类型" style="width:100%">
            <el-option label="基础资料" value="basic" />
            <el-option label="财务" value="finance" />
            <el-option label="供应链" value="supply_chain" />
            <el-option label="人力资源" value="hr" />
            <el-option label="生产制造" value="manufacture" />
            <el-option label="客户关系" value="crm" />
          </el-select>
        </el-form-item>
        <el-form-item label="增量字段">
          <el-input v-model="form.incrementalKey" placeholder="如 modify_time" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="doSave">保存</el-button>
      </template>
    </el-dialog>

    <!-- Fields Dialog -->
    <el-dialog v-model="fieldsVisible" :title="`字段列表 — ${currentObject?.objectName || ''}`" width="700px">
      <el-table :data="fieldList" max-height="400" size="small">
        <el-table-column prop="field" label="字段名" width="160" />
        <el-table-column prop="label" label="显示名" width="140" />
        <el-table-column prop="type" label="类型" width="80" />
        <el-table-column label="可空" width="60">
          <template #default="{ row }">{{ row.nullable ? '是' : '否' }}</template>
        </el-table-column>
        <el-table-column label="主键" width="60">
          <template #default="{ row }">{{ row.isKey ? '是' : '' }}</template>
        </el-table-column>
        <el-table-column prop="length" label="长度" width="60" />
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { fetchObjectList, createObject, updateObject, deleteObject, fetchObjectFields } from '@/api/integration/object'
import { fetchSourceList } from '@/api/integration/source'

const loading = ref(false)
const tableData = ref<any[]>([])
const total = ref(0)
const current = ref(1)
const size = ref(10)
const queryForm = reactive({ sourceId: '', objectCode: '' })
const sourceList = ref<any[]>([])

const loadData = async () => {
  loading.value = true
  try {
    const res = await fetchObjectList({ ...queryForm, pageNum: current.value, pageSize: size.value })
    tableData.value = (res as any)?.data?.list || res?.list || []
    total.value = (res as any)?.data?.total || res?.total || 0
  } finally { loading.value = false }
}

const doSearch = () => { current.value = 1; loadData() }
const resetSearch = () => { queryForm.sourceId = ''; queryForm.objectCode = ''; doSearch() }
const onCurrentChange = (page: number) => { current.value = page; loadData() }
const onSizeChange = (val: number) => { size.value = val; loadData() }
const getSourceName = (id: number) => sourceList.value.find(s => s.id === id)?.name || '-'
const objectTypeLabel = (t: string) => {
  const m: Record<string, string> = { basic: '基础资料', finance: '财务', supply_chain: '供应链', hr: '人力资源', manufacture: '制造', crm: 'CRM' }
  return m[t] || t
}

const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref()
const form = reactive({ id: undefined, sourceId: '', objectCode: '', objectName: '', objectType: 'basic', incrementalKey: '' })
const rules = {
  sourceId: [{ required: true, message: '请选择数据源', trigger: 'change' }],
  objectCode: [{ required: true, message: '请输入对象编码', trigger: 'blur' }],
  objectName: [{ required: true, message: '请输入对象名称', trigger: 'blur' }],
  objectType: [{ required: true, message: '请选择对象类型', trigger: 'change' }],
}

const openAdd = () => { isEdit.value = false; Object.assign(form, { id: undefined, sourceId: '', objectCode: '', objectName: '', objectType: 'basic', incrementalKey: '' }); dialogVisible.value = true }
const openEdit = (row: any) => { isEdit.value = true; Object.assign(form, row); dialogVisible.value = true }
const doSave = async () => {
  await formRef.value?.validate()
  isEdit.value ? await updateObject({ ...form }) : await createObject({ ...form })
  ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
  dialogVisible.value = false
  loadData()
}
const doDelete = async (row: any) => {
  await ElMessageBox.confirm(`确定要删除对象"${row.objectName}"吗？`, '提示', { type: 'warning' })
  await deleteObject(String(row.id))
  ElMessage.success('删除成功')
  loadData()
}
const resetForm = () => formRef.value?.resetFields()

// Fields dialog
const fieldsVisible = ref(false)
const fieldList = ref<any[]>([])
const currentObject = ref<any>(null)
const viewFields = async (row: any) => {
  currentObject.value = row
  fieldsVisible.value = true
  try {
    const res: any = await fetchObjectFields(row.id)
    fieldList.value = (res?.data || res || [])
  } catch { fieldList.value = [] }
}

onMounted(async () => {
  loadData()
  try {
    const res: any = await fetchSourceList({ pageNum: 1, pageSize: 200 })
    sourceList.value = (res?.data?.list || res?.list || [])
  } catch { /* ignore */ }
})
</script>
