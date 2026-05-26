<template>
  <div class="p-5">
    <ArtTable :data="tableData" :loading="loading" :pagination="{ total, current, size }"
      @pagination:current-change="onCurrentChange" @pagination:size-change="onSizeChange">
      <template #search>
        <el-form :model="queryForm" inline>
          <el-form-item label="数据对象">
            <el-select v-model="queryForm.objectId" clearable placeholder="全部" style="width:200px" @change="doSearch">
              <el-option v-for="o in objectList" :key="o.id" :label="`${o.objectName} (${o.objectCode})`" :value="o.id" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="doSearch">搜索</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </el-form-item>
        </el-form>
      </template>

      <template #toolbar>
        <el-button type="primary" @click="openAdd">新增映射</el-button>
      </template>

      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="sourceField" label="源字段" width="160" />
      <el-table-column prop="targetField" label="目标字段" width="160" />
      <el-table-column prop="targetLabel" label="目标字段名" width="140" />
      <el-table-column label="转换规则" width="100">
        <template #default="{ row }">{{ transformLabel(row.transformRule) }}</template>
      </el-table-column>
      <el-table-column label="必填" width="60">
        <template #default="{ row }">{{ row.isRequired ? '是' : '否' }}</template>
      </el-table-column>
      <el-table-column label="排序" width="60" prop="sortOrder" />
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" @click="doDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </ArtTable>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑映射' : '新增映射'" width="500px" @close="resetForm">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="数据对象" prop="objectId">
          <el-select v-model="form.objectId" placeholder="选择对象" :disabled="isEdit" style="width:100%">
            <el-option v-for="o in objectList" :key="o.id" :label="`${o.objectName} (${o.objectCode})`" :value="o.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="源字段" prop="sourceField">
          <el-input v-model="form.sourceField" placeholder="ERP系统中的字段名" />
        </el-form-item>
        <el-form-item label="目标字段" prop="targetField">
          <el-input v-model="form.targetField" placeholder="元数据表中的字段名" />
        </el-form-item>
        <el-form-item label="字段标签">
          <el-input v-model="form.targetLabel" placeholder="字段显示名" />
        </el-form-item>
        <el-form-item label="转换规则">
          <el-select v-model="form.transformRule" style="width:100%">
            <el-option label="直接映射" value="direct" />
            <el-option label="常量" value="constant" />
            <el-option label="表达式" value="expression" />
            <el-option label="拼接" value="composite" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sortOrder" :min="0" />
        </el-form-item>
        <el-form-item label="必填">
          <el-switch v-model="form.isRequired" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="doSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { fetchMappingList, createMapping, updateMapping, deleteMapping } from '@/api/integration/mapping'
import { fetchObjectList } from '@/api/integration/object'

const loading = ref(false)
const tableData = ref<any[]>([])
const total = ref(0)
const current = ref(1)
const size = ref(10)
const queryForm = reactive({ objectId: '' })
const objectList = ref<any[]>([])

const loadData = async () => {
  loading.value = true
  try {
    const res = await fetchMappingList({ ...queryForm, pageNum: current.value, pageSize: size.value })
    tableData.value = (res as any)?.data?.list || res?.list || []
    total.value = (res as any)?.data?.total || res?.total || 0
  } finally { loading.value = false }
}

const doSearch = () => { current.value = 1; loadData() }
const resetSearch = () => { queryForm.objectId = ''; doSearch() }
const onCurrentChange = (page: number) => { current.value = page; loadData() }
const onSizeChange = (val: number) => { size.value = val; loadData() }

const transformLabel = (r: string) => ({ direct: '直接映射', constant: '常量', expression: '表达式', composite: '拼接' } as any)[r] || r

const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref()
const form = reactive({ id: undefined, objectId: '', sourceField: '', targetField: '', targetLabel: '', transformRule: 'direct', sortOrder: 0, isRequired: false })
const rules = {
  objectId: [{ required: true, message: '请选择数据对象', trigger: 'change' }],
  sourceField: [{ required: true, message: '请输入源字段', trigger: 'blur' }],
  targetField: [{ required: true, message: '请输入目标字段', trigger: 'blur' }],
}

const openAdd = () => { isEdit.value = false; Object.assign(form, { id: undefined, objectId: queryForm.objectId || '', sourceField: '', targetField: '', targetLabel: '', transformRule: 'direct', sortOrder: 0, isRequired: false }); dialogVisible.value = true }
const openEdit = (row: any) => { isEdit.value = true; Object.assign(form, row); dialogVisible.value = true }
const doSave = async () => {
  await formRef.value?.validate()
  isEdit.value ? await updateMapping({ ...form }) : await createMapping({ ...form })
  ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
  dialogVisible.value = false
  loadData()
}
const doDelete = async (row: any) => {
  await ElMessageBox.confirm(`确定要删除映射"${row.sourceField} → ${row.targetField}"吗？`, '提示', { type: 'warning' })
  await deleteMapping(String(row.id))
  ElMessage.success('删除成功')
  loadData()
}
const resetForm = () => formRef.value?.resetFields()

onMounted(async () => {
  loadData()
  try {
    const res: any = await fetchObjectList({ pageNum: 1, pageSize: 200 })
    objectList.value = (res?.data?.list || res?.list || [])
  } catch { /* ignore */ }
})
</script>
