<template>
  <ElDialog v-model="dialogVisible" :title="dialogType === 'add' ? '新增字段' : '编辑字段'" width="700px" align-center
    @closed="handleClosed">
    <ArtForm ref="formRef" v-model="formData" :items="formItems" :rules="rules" :span="12" label-width="100px"
      :show-reset="false" :show-submit="false" />
    <template #footer>
      <div class="dialog-footer">
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="loading" @click="handleSubmit">提交</ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
import type { FormRules } from 'element-plus'
import type { FormItem } from '@/components/core/forms/art-form/index.vue'
import ArtForm from '@/components/core/forms/art-form/index.vue'
import { fetchCreateField, fetchUpdateField, fetchGetFieldDetail } from '@/api/metadata/field'

interface Props {
  visible: boolean
  type: string
  collectionId: number
  data?: Partial<Api.MetadataField.FieldListItem>
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
const dialogType = computed(() => props.type)
const formRef = ref()

const defaultFormData = () => ({
  id: undefined,
  collectionId: props.collectionId,
  columnName: '',
  label: '',
  type: 'string',
  nullable: true,
  required: false,
  isUnique: false,
  indexed: false,
  default_value: '',
  length: 255,
})

const formData = reactive(defaultFormData())

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

const formItems = computed<FormItem[]>(() => [
  {
    label: '数据库列名',
    key: 'columnName',
    type: 'input',
    props: { placeholder: '请输入数据库列名（如 customer_name）' }
  },
  {
    label: '显示名称',
    key: 'label',
    type: 'input',
    props: { placeholder: '请输入显示名称' }
  },
  {
    label: '字段类型',
    key: 'type',
    type: 'select',
    props: { placeholder: '请选择字段类型', options: typeOptions }
  },
  {
    label: '长度',
    key: 'length',
    type: 'number',
    props: { placeholder: '字符串类型长度' }
  },
  {
    label: '是否可为空',
    key: 'nullable',
    type: 'switch'
  },
  {
    label: '是否必填',
    key: 'required',
    type: 'switch'
  },
  {
    label: '是否唯一',
    key: 'isUnique',
    type: 'switch'
  },
  {
    label: '是否建索引',
    key: 'indexed',
    type: 'switch'
  },
  {
    label: '默认值',
    key: 'default_value',
    type: 'input',
    span: 24,
    props: { placeholder: '默认值' }
  },
])

const rules = computed<FormRules>(() => ({
  columnName: [
    { required: true, message: '请输入数据库列名', trigger: 'blur' },
    { min: 1, max: 50, message: '长度在 1 到 50 个字符', trigger: 'blur' }
  ],
  type: [{ required: true, message: '请选择字段类型', trigger: 'change' }],
}))

const initFormData = () => {
  loading.value = false
  Object.assign(formData, defaultFormData())
  const isEdit = props.type === 'edit' && props.data
  if (isEdit && props.data?.id) {
    fetchGetFieldDetail(props.data.id).then(res => {
      if (res) Object.assign(formData, res)
    })
  }
}

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      nextTick(() => { initFormData() })
    }
  }
)

const handleSubmit = async () => {
  if (!formRef.value) return
  formRef.value.validate().then(async () => {
    try {
      loading.value = true
      if (dialogType.value === 'add') {
        await fetchCreateField(formData)
      } else {
        await fetchUpdateField(formData)
      }
      emit('submit')
      dialogVisible.value = false
    } catch {
      loading.value = false
    }
  }).catch(() => {
    ElMessage.error('表单校验失败，请检查输入')
  })
}

const handleClosed = () => {
  formRef.value?.reset()
}
</script>
