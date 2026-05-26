<template>
  <ElDialog v-model="dialogVisible" title="配置元数据表" width="1100px" align-center
    @closed="handleClosed" :close-on-click-modal="false">
    <!-- 基本信息 -->
    <ElDivider content-position="left">基本信息</ElDivider>
    <ElForm ref="baseFormRef" :model="baseForm" :rules="baseRules" label-width="90px" :inline="true">
      <ElFormItem label="物理表名" prop="tableName">
        <ElInput v-model="baseForm.tableName" placeholder="如 t_orders" style="width: 200px" />
      </ElFormItem>
      <ElFormItem label="显示名称" prop="label">
        <ElInput v-model="baseForm.label" placeholder="如 订单管理" style="width: 200px" />
      </ElFormItem>
      <ElFormItem label="存储类型" prop="databaseType">
        <ElSelect v-model="baseForm.databaseType" style="width: 160px">
          <ElOption label="PostgreSQL" value="postgresql" />
          <ElOption label="MongoDB" value="mongodb" disabled />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="命名空间" prop="namespace">
        <ElSelect v-model="baseForm.namespace" style="width: 140px">
          <ElOption label="业务" value="business" />
          <ElOption label="自定义" value="custom" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="描述">
        <ElInput v-model="baseForm.description" placeholder="可选描述" style="width: 400px" />
      </ElFormItem>
    </ElForm>

    <!-- 数据库配置 -->
    <ElDivider content-position="left">
      数据库配置
      <span class="text-xs text-gray-400 ml-2">（不填则使用系统默认数据库）</span>
    </ElDivider>
    <ElForm v-if="savedDbConfigs.length > 0" label-width="120px" class="mb-2">
      <ElFormItem label="选择已保存的配置">
        <ElSelect v-model="selectedDbConfigId" placeholder="选择已保存的数据库配置快速填充" clearable
          @change="onDbConfigSelect" style="width: 400px">
          <ElOption v-for="item in savedDbConfigs" :key="item.id" :label="item.name" :value="item.id as number" />
        </ElSelect>
        <span class="text-xs text-gray-400 ml-2">选择后字段仍可手动修改</span>
      </ElFormItem>
    </ElForm>
    <ElForm :model="dbForm" label-width="90px" :inline="true">
      <ElFormItem label="主机地址">
        <ElInput v-model="dbForm.host" placeholder="localhost" style="width: 180px" />
      </ElFormItem>
      <ElFormItem label="端口">
        <ElInputNumber v-model="dbForm.port" :min="1" :max="65535" style="width: 120px" />
      </ElFormItem>
      <ElFormItem label="用户名">
        <ElInput v-model="dbForm.username" placeholder="postgres" style="width: 160px" />
      </ElFormItem>
      <ElFormItem label="密码">
        <ElInput v-model="dbForm.password" type="password" show-password placeholder="密码" style="width: 160px" />
      </ElFormItem>
      <ElFormItem label="数据库名">
        <ElInput v-model="dbForm.database" placeholder="database_name" style="width: 180px" />
      </ElFormItem>
      <ElFormItem label="Schema">
        <ElInput v-model="dbForm.schema" placeholder="public" style="width: 160px" />
      </ElFormItem>
      <ElFormItem label="SSL">
        <ElSwitch v-model="dbForm.ssl" />
        <span class="ml-2 text-xs text-gray-400">云数据库通常需开启</span>
      </ElFormItem>
      <ElFormItem>
        <ElButton size="small" @click="handleTestConnection" :loading="testing">
          测试连接
        </ElButton>
        <ElButton size="small" @click="handleTestSchema" :loading="testingSchema" class="ml-2">
          验证/创建 Schema
        </ElButton>
      </ElFormItem>
    </ElForm>

    <!-- 字段定义 -->
    <ElDivider content-position="left">
      字段定义
      <ElButton size="small" type="primary" :icon="Plus" @click="addField" class="ml-4" v-ripple>添加字段</ElButton>
    </ElDivider>
    <ElTable :data="fieldList" border stripe max-height="360px" style="width: 100%">
      <ElTableColumn label="数据库列名" width="170">
        <template #default="{ row, $index }">
          <ElInput v-model="fieldList[$index].columnName" placeholder="如 customer_name" size="small" />
        </template>
      </ElTableColumn>
      <ElTableColumn label="显示名称" width="140">
        <template #default="{ row, $index }">
          <ElInput v-model="fieldList[$index].label" placeholder="展示名" size="small" />
        </template>
      </ElTableColumn>
      <ElTableColumn label="字段类型" width="150">
        <template #default="{ row, $index }">
          <ElSelect v-model="fieldList[$index].type" size="small">
            <ElOption v-for="t in typeOptions" :key="t.value" :label="t.label" :value="t.value" />
          </ElSelect>
        </template>
      </ElTableColumn>
      <ElTableColumn label="长度" width="80">
        <template #default="{ row, $index }">
          <ElInputNumber v-model="fieldList[$index].length" :min="1" size="small" controls-position="right" />
        </template>
      </ElTableColumn>
      <ElTableColumn label="必填" width="65" align="center">
        <template #default="{ row, $index }">
          <ElCheckbox v-model="fieldList[$index].required" size="small" />
        </template>
      </ElTableColumn>
      <ElTableColumn label="唯一" width="65" align="center">
        <template #default="{ row, $index }">
          <ElCheckbox v-model="fieldList[$index].isUnique" size="small" />
        </template>
      </ElTableColumn>
      <ElTableColumn label="索引" width="65" align="center">
        <template #default="{ row, $index }">
          <ElCheckbox v-model="fieldList[$index].indexed" size="small" />
        </template>
      </ElTableColumn>
      <ElTableColumn label="可为空" width="75" align="center">
        <template #default="{ row, $index }">
          <ElCheckbox v-model="fieldList[$index].nullable" size="small" />
        </template>
      </ElTableColumn>
      <ElTableColumn label="默认值" width="140">
        <template #default="{ row, $index }">
          <ElInput v-model="fieldList[$index].default_value" placeholder="默认值" size="small" />
        </template>
      </ElTableColumn>
      <ElTableColumn label="枚举选项" width="200">
        <template #default="{ row, $index }">
          <ElInput v-if="row.type === 'enum'" v-model="fieldList[$index].enumOptions"
            placeholder="每行: label value" type="textarea" :rows="2" size="small" />
          <span v-else class="text-xs text-gray-400">仅 enum 类型</span>
        </template>
      </ElTableColumn>
      <ElTableColumn label="操作" width="70" align="center" fixed="right">
        <template #default="{ $index }">
          <ElButton size="small" type="danger" :icon="Delete" circle @click="removeField($index)" />
        </template>
      </ElTableColumn>
    </ElTable>
    <ElText v-if="fieldList.length === 0" type="info" size="small" class="mt-2 ml-1">
      暂未添加字段，请点击「添加字段」按钮定义表结构
    </ElText>

    <template #footer>
      <div class="dialog-footer">
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="loading" @click="handleGenerate">
          生成
        </ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
import { Plus, Delete } from '@element-plus/icons-vue'
import type { FormRules } from 'element-plus'
import { fetchCreateCollection, fetchCreateCollectionWithFields, fetchTestConnection, fetchTestSchema, fetchSystemDbConfig } from '@/api/metadata/collection'
import { fetchGetAllDatabaseConfigs } from '@/api/metadata/database-config'

interface FieldDef {
  columnName: string
  label: string
  type: string
  length: number
  required: boolean
  isUnique: boolean
  indexed: boolean
  nullable: boolean
  default_value: string
  enumOptions: string
  uiConfig?: Record<string, any>
}

interface Props {
  visible: boolean
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
const baseFormRef = ref()

const defaultBaseForm = () => ({
  tableName: '',
  label: '',
  description: '',
  databaseType: 'postgresql',
  namespace: 'business' as string,
})

const baseForm = reactive(defaultBaseForm())

const defaultDbForm = () => ({
  host: '',
  port: 5432 as number,
  username: '',
  password: '',
  database: '',
  schema: 'collection' as string,
  ssl: false,
})

const dbForm = reactive(defaultDbForm())
const testing = ref(false)
const testingSchema = ref(false)

// 已保存的数据库配置
const savedDbConfigs = ref<Api.MetadataDatabaseConfig.DatabaseConfigItem[]>([])
const selectedDbConfigId = ref<number | ''>('')

function fillDbFormFromConfig(config: Api.MetadataDatabaseConfig.DatabaseConfigItem) {
  dbForm.host = config.host
  dbForm.port = config.port
  dbForm.username = config.username
  dbForm.password = config.password || ''
  dbForm.database = config.database
  dbForm.schema = config.schema || 'public'
  dbForm.ssl = !!(config as any).ssl
}

function onDbConfigSelect(val: number | '') {
  if (val === '' || val === undefined) {
    Object.assign(dbForm, defaultDbForm())
    return
  }
  const config = savedDbConfigs.value.find(c => c.id === val)
  if (config) fillDbFormFromConfig(config)
}

async function loadSavedDbConfigs() {
  try {
    const res: any = await fetchGetAllDatabaseConfigs()
    if (Array.isArray(res)) {
      savedDbConfigs.value = res
    }
  } catch { /* 保持空列表 */ }
}

const baseRules: FormRules = {
  tableName: [
    { required: true, message: '请输入物理表名', trigger: 'blur' },
    { min: 2, max: 50, message: '长度 2-50 字符', trigger: 'blur' },
    { pattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/, message: '仅允许字母、数字、下划线，以字母或下划线开头', trigger: 'blur' },
  ],
  label: [{ required: true, message: '请输入显示名称', trigger: 'blur' }],
  databaseType: [{ required: true, message: '请选择存储类型', trigger: 'change' }],
}

const typeOptions = [
  { label: 'string', value: 'string' },
  { label: 'integer', value: 'integer' },
  { label: 'boolean', value: 'boolean' },
  { label: 'date', value: 'date' },
  { label: 'datetime', value: 'datetime' },
  { label: 'text', value: 'text' },
  { label: 'decimal', value: 'decimal' },
  { label: 'json', value: 'json' },
  { label: 'enum', value: 'enum' },
  { label: 'email', value: 'email' },
  { label: 'phone', value: 'phone' },
  { label: 'url', value: 'url' },
  { label: 'richtext', value: 'richtext' },
]

const defaultField = (): FieldDef => ({
  columnName: '',
  label: '',
  type: 'string',
  length: 255,
  required: false,
  isUnique: false,
  indexed: false,
  nullable: true,
  default_value: '',
  enumOptions: '',
})

const fieldList = ref<FieldDef[]>([])

const addField = () => {
  fieldList.value.push(defaultField())
}

const removeField = (index: number) => {
  fieldList.value.splice(index, 1)
}

function getStorageConfig() {
  if (!dbForm.host || !dbForm.database || !dbForm.username) return null
  return {
    host: dbForm.host,
    port: dbForm.port,
    username: dbForm.username,
    password: dbForm.password,
    database: dbForm.database,
    schema: dbForm.schema || 'public',
    ssl: dbForm.ssl,
  }
}

async function handleTestConnection() {
  const config = getStorageConfig()
  if (!config) {
    ElMessage.warning('请先填写主机地址、数据库名和用户名')
    return
  }
  testing.value = true
  try {
    const res: any = await fetchTestConnection(config)
    if (res?.success) {
      ElMessage.success(`连接成功 (${res.latency}ms)`)
    } else {
      ElMessage.error(`连接失败: ${res?.error || '未知错误'}`)
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '测试失败')
  } finally {
    testing.value = false
  }
}

async function handleTestSchema() {
  const config = getStorageConfig()
  if (!config) {
    ElMessage.warning('请先填写主机地址、数据库名和用户名')
    return
  }
  if (!dbForm.schema || dbForm.schema === 'public') {
    ElMessage.info('Schema "public" 默认存在，无需验证')
    return
  }
  testingSchema.value = true
  try {
    const res: any = await fetchTestSchema({ ...config, createIfNotExists: true })
    if (res?.connectionError) {
      ElMessage.error(`连接失败: ${res.connectionError}`)
    } else if (res?.created) {
      ElMessage.success(`Schema "${res.schema}" 已创建`)
    } else if (res?.schemaExists) {
      ElMessage.success(`Schema "${res.schema}" 已存在`)
    } else {
      ElMessage.warning(`Schema "${res.schema}" 不存在`)
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '验证失败')
  } finally {
    testingSchema.value = false
  }
}

const handleGenerate = async () => {
  if (!baseFormRef.value) return
  try {
    await baseFormRef.value.validate()
  } catch {
    ElMessage.error('请完善基本信息')
    return
  }

  const validFields = fieldList.value.filter((f) => f.columnName.trim())
  if (validFields.length === 0) {
    ElMessage.warning('请至少添加一个字段')
    return
  }

  // 校验列名合法性
  for (const f of validFields) {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(f.columnName)) {
      ElMessage.warning(`列名 "${f.columnName}" 格式非法，仅允许字母、数字、下划线`)
      return
    }
  }

  loading.value = true
  try {
    const storageConfig = getStorageConfig()
    const fieldsPayload = validFields.map((f) => {
      let uiConfig: Record<string, any> | undefined
      if (f.type === 'enum' && f.enumOptions.trim()) {
        const options = f.enumOptions.trim().split('\n').filter(Boolean).map(line => {
          const parts = line.trim().split(/\s+/)
          const value = parts.pop() || ''
          const label = parts.join(' ') || value
          return { label, value }
        })
        if (options.length > 0) uiConfig = { options }
      }
      return {
        columnName: f.columnName,
        label: f.label || undefined,
        type: f.type,
        length: f.length,
        required: f.required,
        isUnique: f.isUnique,
        indexed: f.indexed,
        nullable: f.nullable,
        default_value: f.default_value || undefined,
        uiConfig: uiConfig || undefined,
      }
    })

    await fetchCreateCollectionWithFields({
      collection: {
        tableName: baseForm.tableName,
        label: baseForm.label,
        description: baseForm.description,
        databaseType: baseForm.databaseType,
        namespace: baseForm.namespace || undefined,
        storageConfig: storageConfig || undefined,
      },
      fields: fieldsPayload,
    })

    ElMessage.success(`数据表 "${baseForm.label}" 创建成功，已添加 ${validFields.length} 个字段`)
    emit('submit')
    dialogVisible.value = false
  } catch (e: any) {
    ElMessage.error(e?.message || '创建失败')
  } finally {
    loading.value = false
  }
}

watch(() => props.visible, async (val) => {
  if (val) {
    try {
      const res: any = await fetchSystemDbConfig()
      if (res?.host) {
        dbForm.host = res.host
        dbForm.port = res.port
        dbForm.username = res.username
        dbForm.database = res.database
      }
    } catch { /* 保持默认值 */ }
    loadSavedDbConfigs()
  }
})

const handleClosed = () => {
  Object.assign(baseForm, defaultBaseForm())
  Object.assign(dbForm, defaultDbForm())
  fieldList.value = []
  selectedDbConfigId.value = ''
  baseFormRef.value?.resetFields()
  loading.value = false
}
</script>
