<template>
  <ElDialog :title="dialogTitle" :model-value="visible" @update:model-value="handleCancel" width="650px" align-center
    @closed="handleClosed">
    <ArtForm ref="formRef" v-model="formData" :items="formItems" :span="24" label-width="100px"
      :show-reset="false" :show-submit="false" />

    <template #footer>
      <div class="dialog-footer">
        <ElButton @click="handleCancel">取消</ElButton>
        <ElButton type="primary" :loading="loading" @click="handleSubmit">确定</ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import type { FormItem } from '@/components/core/forms/art-form/index.vue'
import ArtForm from '@/components/core/forms/art-form/index.vue'
import { fetchCreateCollectionData, fetchUpdateCollectionData } from '@/api/metadata/data-service'

interface Props {
  visible: boolean
  type: 'add' | 'edit'
  data?: Record<string, any>
  fields: Api.MetadataField.FieldListItem[]
  tableName: string
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'submit'): void
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  type: 'add',
  data: () => ({}),
  fields: () => [],
  tableName: '',
})

const emit = defineEmits<Emits>()

const formRef = ref()
const loading = ref(false)
const formData = ref<Record<string, any>>({})

const dialogTitle = computed(() => props.type === 'add' ? '新增数据' : '编辑数据')

// Field type to ArtForm component type
const fieldTypeToFormType: Record<string, string> = {
  string: 'input',
  text: 'input',
  email: 'input',
  phone: 'input',
  url: 'input',
  integer: 'number',
  decimal: 'number',
  boolean: 'switch',
  date: 'date',
  datetime: 'datetime',
  enum: 'select',
  richtext: 'input',
  json: 'input',
}

// Patterns for field validation
const FIELD_PATTERNS: Record<string, { regex: RegExp; message: string }> = {
  email: { regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: '请输入有效的邮箱地址' },
  phone: { regex: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' },
  url: { regex: /^https?:\/\/.+/, message: '请输入有效的 URL 地址' },
}

function parseEnumOptions(field: any): { label: string; value: string }[] {
  if (field.uiConfig?.options) return field.uiConfig.options
  if (typeof field.uiConfig === 'string') {
    try { const parsed = JSON.parse(field.uiConfig); return parsed.options || []; } catch { return []; }
  }
  return []
}

// Exclude system-managed columns from form
const EXCLUDE_COLUMNS = new Set(['id', 'create_time', 'create_by', 'update_time', 'update_by', 'del_flag', 'remark'])

const formItems = computed<FormItem[]>(() => {
  return props.fields
    .filter(f => !EXCLUDE_COLUMNS.has(f.columnName) && !f.isPrimaryKey)
    .map(f => {
      const baseType = fieldTypeToFormType[f.type] || 'input'
      const props: Record<string, any> = {
        placeholder: `请输入${f.label || f.columnName}`,
        clearable: f.nullable !== false,
      }
      if (f.type === 'integer' || f.type === 'decimal') {
        props.controlsPosition = 'right'
        props.style = { width: '100%' }
      }
      if (f.type === 'date') props.valueFormat = 'YYYY-MM-DD'
      if (f.type === 'datetime') {
        props.type = 'datetime'
        props.valueFormat = 'YYYY-MM-DD HH:mm:ss'
      }
      if (f.type === 'text') {
        props.type = 'textarea'
        props.rows = 3
      }
      if (f.type === 'richtext') {
        props.type = 'textarea'
        props.rows = 6
      }
      if (f.type === 'json') {
        props.type = 'textarea'
        props.rows = 4
      }
      if (f.type === 'enum') {
        const options = parseEnumOptions(f)
        if (options.length > 0) {
          props.options = options.map((o: any) => ({ label: o.label, value: o.value }))
        }
      }

      return { key: f.columnName, label: f.label || f.columnName, type: baseType, props }
    })
})

function initForm() {
  const init: Record<string, any> = {}
  for (const f of props.fields) {
    if (EXCLUDE_COLUMNS.has(f.columnName)) continue
    if (props.type === 'edit' && props.data) {
      init[f.columnName] = props.data[f.columnName] ?? undefined
    } else {
      init[f.columnName] = undefined
    }
  }
  formData.value = init
}

watch(() => props.visible, (val) => {
  if (val) {
    nextTick(() => initForm())
  }
})

async function handleSubmit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()

    // 额外校验：email/phone/url 格式 + json 合法性
    for (const f of props.fields) {
      const val = formData.value[f.columnName]
      if (val === undefined || val === null || val === '') continue
      if (FIELD_PATTERNS[f.type]) {
        const { regex, message } = FIELD_PATTERNS[f.type]
        if (!regex.test(String(val))) {
          ElMessage.warning(`${f.label || f.columnName}: ${message}`)
          return
        }
      }
      if (f.type === 'json') {
        try { JSON.parse(String(val)) } catch {
          ElMessage.warning(`${f.label || f.columnName}: JSON 格式不合法`)
          return
        }
      }
    }

    loading.value = true

    if (props.type === 'add') {
      await fetchCreateCollectionData(props.tableName, formData.value)
    } else {
      const id = props.data?.id
      if (!id) {
        ElMessage.error('缺少数据ID')
        return
      }
      await fetchUpdateCollectionData(props.tableName, id, formData.value)
    }

    emit('submit')
    emit('update:visible', false)
  } catch {
    ElMessage.error('表单校验失败，请检查输入')
  } finally {
    loading.value = false
  }
}

function handleCancel() {
  emit('update:visible', false)
}

function handleClosed() {
  formRef.value?.reset()
  formData.value = {}
}
</script>
