<template>
  <div class="p-5">
    <ArtTable :data="tableData" :loading="loading" :pagination="{ total, current, size }"
      @pagination:current-change="onCurrentChange" @pagination:size-change="onSizeChange">
      <template #search>
        <el-form :model="queryForm" inline>
          <el-form-item label="名称">
            <el-input v-model="queryForm.name" clearable placeholder="数据源名称" />
          </el-form-item>
          <el-form-item label="产品类型">
            <el-select v-model="queryForm.productType" clearable placeholder="全部">
              <el-option v-for="t in productTypes" :key="t" :label="productLabel(t)" :value="t" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="queryForm.status" clearable placeholder="全部">
              <el-option label="正常" value="active" />
              <el-option label="异常" value="error" />
              <el-option label="停用" value="disabled" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="doSearch">搜索</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </el-form-item>
        </el-form>
      </template>

      <template #toolbar>
        <el-button type="primary" @click="openAdd">新增数据源</el-button>
      </template>

      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="name" label="名称" min-width="140" />
      <el-table-column label="产品类型" width="140">
        <template #default="{ row }">{{ productLabel(row.productType) }}</template>
      </el-table-column>
      <el-table-column prop="connectionType" label="连接方式" width="80">
        <template #default="{ row }">{{ row.connectionType === 'api' ? 'API' : '数据库' }}</template>
      </el-table-column>
      <el-table-column label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : row.status === 'error' ? 'danger' : 'info'" size="small">
            {{ row.status === 'active' ? '正常' : row.status === 'error' ? '异常' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="最近检测" width="160">
        <template #default="{ row }">
          {{ row.healthCheck?.lastCheckTime || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="160" />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button link type="success" @click="doTestConnection(row)">测试</el-button>
          <el-button link type="warning" @click="openDiscover(row)">发现对象</el-button>
          <el-button link type="danger" @click="doDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </ArtTable>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑数据源' : '新增数据源'" width="640px" @close="resetForm">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="如：星空生产环境" />
        </el-form-item>
        <el-form-item label="产品类型" prop="productType">
          <el-select v-model="form.productType" placeholder="选择产品" style="width:100%">
            <el-option v-for="t in productTypes" :key="t" :label="productLabel(t)" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="连接方式" prop="connectionType">
          <el-radio-group v-model="form.connectionType">
            <el-radio value="api">API 连接</el-radio>
            <el-radio value="db">数据库直连</el-radio>
          </el-radio-group>
        </el-form-item>

        <template v-if="form.connectionType === 'api'">
          <el-form-item label="API 地址" prop="connectionConfig.baseUrl">
            <el-input v-model="form.connectionConfig.baseUrl" placeholder="https://api.kingdee.com/K3Cloud" />
          </el-form-item>
          <el-form-item label="AppId" prop="connectionConfig.appId">
            <el-input v-model="form.connectionConfig.appId" placeholder="应用ID" />
          </el-form-item>
          <el-form-item label="AppSecret" prop="connectionConfig.appSecret">
            <el-input v-model="form.connectionConfig.appSecret" type="password" show-password placeholder="应用密钥" />
          </el-form-item>
          <el-form-item label="数据中心ID" v-if="form.productType.startsWith('kingdee')">
            <el-input v-model="form.connectionConfig.accountId" placeholder="账套ID" />
          </el-form-item>
          <el-form-item label="租户ID" v-if="form.productType.startsWith('yonyou')">
            <el-input v-model="form.connectionConfig.tenantId" placeholder="租户ID" />
          </el-form-item>
        </template>

        <template v-if="form.connectionType === 'db'">
          <el-row :gutter="12">
            <el-col :span="12">
              <el-form-item label="数据库类型">
                <el-select v-model="form.connectionConfig.dbType" placeholder="选择" style="width:100%">
                  <el-option label="PostgreSQL" value="postgresql" />
                  <el-option label="MySQL" value="mysql" />
                  <el-option label="SQL Server" value="sqlserver" />
                  <el-option label="Oracle" value="oracle" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="主机">
                <el-input v-model="form.connectionConfig.host" placeholder="192.168.1.1" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="12">
            <el-col :span="12">
              <el-form-item label="端口">
                <el-input-number v-model="form.connectionConfig.port" :min="1" :max="65535" style="width:100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="数据库名">
                <el-input v-model="form.connectionConfig.database" placeholder="database" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="12">
            <el-col :span="12">
              <el-form-item label="用户名">
                <el-input v-model="form.connectionConfig.username" placeholder="username" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="密码">
                <el-input v-model="form.connectionConfig.password" type="password" show-password placeholder="password" />
              </el-form-item>
            </el-col>
          </el-row>
        </template>
      </el-form>

      <div v-if="testResult" class="mt-2">
        <el-alert :type="testResult.success ? 'success' : 'error'" :closable="false">
          {{ testResult.success ? `连接成功 (延迟: ${testResult.latency}ms)` : `连接失败: ${testResult.error}` }}
        </el-alert>
      </div>

      <template #footer>
        <el-button @click="doTestConnectionForm" :loading="testing">测试连接</el-button>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="doSave">保存</el-button>
      </template>
    </el-dialog>

    <!-- Discover Objects Dialog -->
    <el-dialog v-model="discoverVisible" :title="`发现对象 — ${discoverSource?.name || ''}`" width="700px">
      <el-table :data="discoverList" v-loading="discovering" max-height="400" size="small">
        <el-table-column prop="objectCode" label="对象编码" width="180" />
        <el-table-column prop="objectName" label="对象名称" min-width="150" />
        <el-table-column label="类型" width="90">
          <template #default="{ row }">{{ objectTypeLabel(row.objectType) }}</template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="120" />
        <el-table-column label="操作" width="80">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="addDiscoveredObject(row)">添加</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  fetchSourceList, fetchSourceDetail, createSource, updateSource, deleteSource,
  testConnection, fetchProductTypes, fetchSourceObjects,
} from '@/api/integration/source'
import { createObject } from '@/api/integration/object'

const loading = ref(false)
const tableData = ref<any[]>([])
const total = ref(0)
const current = ref(1)
const size = ref(10)
const queryForm = reactive({ name: '', productType: '', status: '' })
const productTypes = ref<string[]>([])

const loadData = async () => {
  loading.value = true
  try {
    const res = await fetchSourceList({ ...queryForm, pageNum: current.value, pageSize: size.value })
    tableData.value = (res as any)?.data?.list || res?.list || []
    total.value = (res as any)?.data?.total || res?.total || 0
  } finally { loading.value = false }
}

const doSearch = () => { current.value = 1; loadData() }
const resetSearch = () => { queryForm.name = ''; queryForm.productType = ''; queryForm.status = ''; doSearch() }
const onCurrentChange = (page: number) => { current.value = page; loadData() }
const onSizeChange = (val: number) => { size.value = val; loadData() }

const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref()
const form = reactive<Record<string, any>>({
  name: '', productType: '', connectionType: 'api',
  connectionConfig: { baseUrl: '', appId: '', appSecret: '', accountId: '', tenantId: '', dbType: 'postgresql', host: '', port: 5432, username: '', password: '', database: '' },
})
const rules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  productType: [{ required: true, message: '请选择产品类型', trigger: 'change' }],
}
const testing = ref(false)
const testResult = ref<{ success?: boolean; error?: string; latency?: number } | null>(null)

const productLabel = (t: string) => {
  const map: Record<string, string> = {
    'kingdee-galaxy': '金蝶云·星空', 'kingdee-cosmic': '金蝶云·苍穹', 'kingdee-jdy': '金蝶精斗云',
    'kingdee-k3-wise': '金蝶 K/3 WISE', 'kingdee-eas': '金蝶 EAS',
    'yonyou-yonsuite': '用友 YonSuite', 'yonyou-ncc': '用友 NCC', 'yonyou-nc': '用友 NC',
    'yonyou-u8': '用友 U8+', 'yonyou-tplus': '用友 T+', 'generic-db': '通用数据库',
  }
  return map[t] || t
}

const cleanConnectionConfig = () => {
  form.connectionConfig = form.connectionType === 'api'
    ? { baseUrl: '', appId: '', appSecret: '', accountId: '', tenantId: '' }
    : { dbType: 'postgresql', host: '', port: 5432, username: '', password: '', database: '' }
}

const openAdd = () => {
  isEdit.value = false
  testResult.value = null
  cleanConnectionConfig()
  form.name = ''; form.productType = ''; form.connectionType = 'api'
  dialogVisible.value = true
}

const openEdit = async (row: any) => {
  isEdit.value = true
  testResult.value = null
  dialogVisible.value = true
  try {
    const detail: any = await fetchSourceDetail(row.id)
    const d = detail?.data || detail
    form.id = d.id
    form.name = d.name
    form.productType = d.productType
    form.connectionType = d.connectionType
    form.connectionConfig = { ...d.connectionConfig }
  } catch { ElMessage.warning('获取详情失败') }
}

const doSave = async () => {
  await formRef.value?.validate()
  const payload = { ...form }
  if (isEdit.value) {
    await updateSource(payload)
    ElMessage.success('更新成功')
  } else {
    await createSource(payload)
    ElMessage.success('创建成功')
  }
  dialogVisible.value = false
  loadData()
}

const doDelete = async (row: any) => {
  await ElMessageBox.confirm(`确定要删除数据源"${row.name}"吗？`, '提示', { type: 'warning' })
  await deleteSource(String(row.id))
  ElMessage.success('删除成功')
  loadData()
}

const doTestConnection = async (row: any) => {
  testing.value = true
  try {
    const res: any = await testConnection({
      productType: row.productType,
      connectionConfig: row.connectionConfig,
    })
    testResult.value = (res?.data || res)
    if (testResult.value?.success) {
      ElMessage.success('连接成功')
    } else {
      ElMessage.error(testResult.value?.error || '连接失败')
    }
  } catch {
    testResult.value = { success: false, error: '请求异常' }
  } finally { testing.value = false }
}

const doTestConnectionForm = async () => {
  if (!form.productType) { ElMessage.warning('请先选择产品类型'); return }
  testing.value = true
  try {
    const res: any = await testConnection({
      productType: form.productType,
      connectionType: form.connectionType,
      connectionConfig: form.connectionConfig,
    })
    testResult.value = (res?.data || res)
    if (testResult.value?.success) {
      ElMessage.success(`连接成功 (${testResult.value?.latency}ms)`)
    } else {
      ElMessage.error(testResult.value?.error || '连接失败')
    }
  } catch {
    testResult.value = { success: false, error: '请求异常' }
  } finally { testing.value = false }
}

const resetForm = () => {
  formRef.value?.resetFields()
  testResult.value = null
  cleanConnectionConfig()
}

// Discover objects
const discoverVisible = ref(false)
const discoverList = ref<any[]>([])
const discoverSource = ref<any>(null)
const discovering = ref(false)
const openDiscover = async (row: any) => {
  discoverSource.value = row
  discoverVisible.value = true
  discovering.value = true
  try {
    const res: any = await fetchSourceObjects(row.id)
    discoverList.value = (res?.data || res || [])
  } catch { discoverList.value = [] }
  finally { discovering.value = false }
}

const objectTypeLabel = (t: string) => {
  const m: Record<string, string> = { basic: '基础资料', finance: '财务', supply_chain: '供应链', hr: '人力资源', manufacture: '制造', crm: 'CRM' }
  return m[t] || t
}

const addDiscoveredObject = async (row: any) => {
  try {
    await createObject({ sourceId: discoverSource.value.id, objectCode: row.objectCode, objectName: row.objectName, objectType: row.objectType })
    ElMessage.success(`已添加: ${row.objectName}`)
  } catch { /* handled */ }
}

onMounted(async () => {
  loadData()
  try {
    const res: any = await fetchProductTypes()
    productTypes.value = res?.data || res || []
  } catch { /* ignore */ }
})
</script>
