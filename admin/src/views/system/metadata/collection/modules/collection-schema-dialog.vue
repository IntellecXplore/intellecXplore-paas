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
          <ElOption label="系统" value="system" />
          <ElOption label="自定义" value="custom" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="描述">
        <ElInput v-model="baseForm.description" placeholder="可选描述" style="width: 400px" />
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
import { fetchCreateCollection } from '@/api/metadata/collection'
import { fetchCreateField } from '@/api/metadata/field'

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
})

const fieldList = ref<FieldDef[]>([])

const addField = () => {
  fieldList.value.push(defaultField())
}

const removeField = (index: number) => {
  fieldList.value.splice(index, 1)
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
    // 1. 创建 collection
    const res: any = await fetchCreateCollection({
      tableName: baseForm.tableName,
      label: baseForm.label,
      description: baseForm.description,
      databaseType: baseForm.databaseType,
      namespace: baseForm.namespace || undefined,
    })
    const collectionId = res?.id
    if (!collectionId) {
      ElMessage.error('创建数据表失败：未获取到 ID')
      loading.value = false
      return
    }

    // 2. 逐个创建字段
    for (const f of validFields) {
      await fetchCreateField({
        collectionId,
        columnName: f.columnName,
        label: f.label || undefined,
        type: f.type,
        length: f.length,
        required: f.required,
        isUnique: f.isUnique,
        indexed: f.indexed,
        nullable: f.nullable,
        default_value: f.default_value || undefined,
      })
    }

    ElMessage.success(`数据表 "${baseForm.label}" 创建成功，已添加 ${validFields.length} 个字段`)
    emit('submit')
    dialogVisible.value = false
  } catch (e: any) {
    ElMessage.error(e?.message || '创建失败')
  } finally {
    loading.value = false
  }
}

const handleClosed = () => {
  Object.assign(baseForm, defaultBaseForm())
  fieldList.value = []
  baseFormRef.value?.resetFields()
  loading.value = false
}
</script>
