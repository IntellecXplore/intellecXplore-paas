<template>
  <div class="p-5">
    <ArtTable
      :data="tableData"
      :loading="loading"
      :pagination="{ total, pageNum, pageSize }"
      @page-change="onPageChange"
    >
      <template #search>
        <el-form :model="queryForm" inline>
          <el-form-item :label="$t('tenant.tenantName')">
            <el-input v-model="queryForm.tenantName" clearable />
          </el-form-item>
          <el-form-item :label="$t('tenant.tenantCode')">
            <el-input v-model="queryForm.tenantCode" clearable />
          </el-form-item>
          <el-form-item :label="$t('tenant.status')">
            <el-select v-model="queryForm.status" clearable>
              <el-option :label="$t('common.enabled')" value="true" />
              <el-option :label="$t('common.disabled')" value="false" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="doSearch">{{ $t('common.search') }}</el-button>
            <el-button @click="resetSearch">{{ $t('common.reset') }}</el-button>
          </el-form-item>
        </el-form>
      </template>

      <template #toolbar>
        <el-button type="primary" @click="openAdd">{{ $t('common.add') }}</el-button>
      </template>

      <el-table-column prop="tenantId" label="ID" width="80" />
      <el-table-column prop="tenantName" :label="$t('tenant.tenantName')" min-width="120" />
      <el-table-column prop="tenantCode" :label="$t('tenant.tenantCode')" width="120" />
      <el-table-column prop="contactName" :label="$t('tenant.contactName')" width="100" />
      <el-table-column prop="contactPhone" :label="$t('tenant.contactPhone')" width="130" />
      <el-table-column prop="status" :label="$t('tenant.status')" width="80">
        <template #default="{ row }">
          <el-tag :type="row.status ? 'success' : 'danger'">
            {{ row.status ? $t('common.enabled') : $t('common.disabled') }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="expireTime" :label="$t('tenant.expireTime')" width="160" />
      <el-table-column prop="createTime" :label="$t('common.createTime')" width="160" />
      <el-table-column :label="$t('common.operation')" width="180" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">{{ $t('common.edit') }}</el-button>
          <el-button link type="danger" @click="doDelete(row)">{{ $t('common.delete') }}</el-button>
        </template>
      </el-table-column>
    </ArtTable>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? $t('common.edit') : $t('common.add')"
      width="560px"
      @close="resetForm"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item :label="$t('tenant.tenantName')" prop="tenantName">
          <el-input v-model="form.tenantName" />
        </el-form-item>
        <el-form-item :label="$t('tenant.tenantCode')" prop="tenantCode">
          <el-input v-model="form.tenantCode" :disabled="isEdit" />
        </el-form-item>
        <el-form-item :label="$t('tenant.contactName')">
          <el-input v-model="form.contactName" />
        </el-form-item>
        <el-form-item :label="$t('tenant.contactPhone')">
          <el-input v-model="form.contactPhone" />
        </el-form-item>
        <el-form-item :label="$t('tenant.status')">
          <el-switch v-model="form.status" />
        </el-form-item>
        <el-form-item :label="$t('tenant.expireTime')">
          <el-date-picker v-model="form.expireTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" />
        </el-form-item>
        <el-form-item :label="$t('common.remark')">
          <el-input v-model="form.remark" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="doSave">{{ $t('common.confirm') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { fetchTenantList, createTenant, updateTenant, deleteTenant } from '@/api/system/tenant'

const loading = ref(false)
const tableData = ref<Api.SystemTenant.TenantRecord[]>([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)

const queryForm = reactive({ tenantName: '', tenantCode: '', status: '' })

const loadData = async () => {
  loading.value = true
  try {
    const res = await fetchTenantList({ ...queryForm, pageNum: pageNum.value, pageSize: pageSize.value })
    tableData.value = res?.list || []
    total.value = res?.total || 0
  } finally {
    loading.value = false
  }
}

const doSearch = () => { pageNum.value = 1; loadData() }
const resetSearch = () => { Object.assign(queryForm, { tenantName: '', tenantCode: '', status: '' }); doSearch() }
const onPageChange = (page: number, size: number) => { pageNum.value = page; pageSize.value = size; loadData() }

const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref()
const form = reactive<Record<string, any>>({
  tenantName: '', tenantCode: '', contactName: '', contactPhone: '',
  status: true, expireTime: '', remark: ''
})
const rules = {
  tenantName: [{ required: true, message: '请输入企业名称', trigger: 'blur' }],
  tenantCode: [{ required: true, message: '请输入租户标识', trigger: 'blur' }],
}

const openAdd = () => { isEdit.value = false; resetForm(); dialogVisible.value = true }
const openEdit = (row: Api.SystemTenant.TenantRecord) => {
  isEdit.value = true
  Object.assign(form, row, { expireTime: row.expireTime || '' })
  dialogVisible.value = true
}

const doSave = async () => {
  await formRef.value?.validate()
  if (isEdit.value) {
    await updateTenant({ ...form })
    ElMessage.success('更新成功')
  } else {
    await createTenant({ ...form })
    ElMessage.success('创建成功')
  }
  dialogVisible.value = false
  loadData()
}

const doDelete = async (row: Api.SystemTenant.TenantRecord) => {
  await ElMessageBox.confirm(`确定要删除租户"${row.tenantName}"吗？`, '提示', { type: 'warning' })
  await deleteTenant(String(row.tenantId))
  ElMessage.success('删除成功')
  loadData()
}

const resetForm = () => { formRef.value?.resetFields(); Object.assign(form, { tenantName: '', tenantCode: '', contactName: '', contactPhone: '', status: true, expireTime: '', remark: '' }) }

onMounted(loadData)
</script>
