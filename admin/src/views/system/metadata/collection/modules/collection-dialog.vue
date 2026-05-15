<template>
  <ElDialog v-model="dialogVisible" :title="dialogType === 'add' ? '新增数据表' : '编辑数据表'" width="600px" align-center
    @closed="handleClosed">
    <ArtForm ref="formRef" v-model="formData" :items="formItems" :rules="rules" :span="24" label-width="100px"
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
import { fetchCreateCollection, fetchUpdateCollection, fetchGetCollectionDetail } from '@/api/metadata/collection'

interface Props {
  visible: boolean
  type: string
  data?: Partial<Api.MetadataCollection.CollectionListItem>
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
  tableName: '',
  label: '',
  description: '',
  databaseType: 'postgresql',
  namespace: 'business',
})

const formData = reactive(defaultFormData())

const formItems = computed<FormItem[]>(() => [
  {
    label: '物理表名',
    key: 'tableName',
    type: 'input',
    props: {
      placeholder: '请输入数据库表名（如 t_orders）',
      disabled: dialogType.value === 'edit'
    }
  },
  {
    label: '显示名称',
    key: 'label',
    type: 'input',
    props: { placeholder: '请输入显示名称（如 订单管理）' }
  },
  {
    label: '描述',
    key: 'description',
    type: 'input',
    props: { type: 'textarea', rows: 3, placeholder: '请输入描述' }
  },
  {
    label: '存储类型',
    key: 'databaseType',
    type: 'select',
    props: {
      placeholder: '请选择存储类型',
      options: [
        { label: 'PostgreSQL', value: 'postgresql' },
        { label: 'MongoDB (开发中)', value: 'mongodb', disabled: true },
      ]
    }
  },
  {
    label: '命名空间',
    key: 'namespace',
    type: 'select',
    props: {
      placeholder: '请选择命名空间',
      options: [
        { label: '业务', value: 'business' },
        { label: '系统', value: 'system' },
        { label: '自定义', value: 'custom' },
      ]
    }
  },
])

const rules = computed<FormRules>(() => ({
  tableName: [
    { required: true, message: '请输入物理表名', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  label: [
    { required: true, message: '请输入显示名称', trigger: 'blur' },
  ],
  databaseType: [{ required: true, message: '请选择存储类型', trigger: 'change' }],
}))

const initFormData = () => {
  loading.value = false
  Object.assign(formData, defaultFormData())
  const isEdit = props.type === 'edit' && props.data
  if (isEdit && props.data?.id) {
    fetchGetCollectionDetail(props.data.id).then(res => {
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
        await fetchCreateCollection(formData)
      } else {
        await fetchUpdateCollection(formData)
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
