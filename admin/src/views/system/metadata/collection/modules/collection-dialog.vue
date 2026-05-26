<template>
  <ElDialog v-model="dialogVisible" :title="dialogType === 'add' ? '新增数据表' : '编辑数据表'" width="600px" align-center
    @closed="handleClosed">
    <ArtForm ref="formRef" v-model="formData" :items="formItems" :rules="rules" :span="24" label-width="100px"
      :show-reset="false" :show-submit="false" />
    <ElDivider content-position="left" v-if="dialogType === 'add'">
      数据库配置
      <span class="text-xs text-gray-400 ml-2">（可选，不选则使用系统默认数据库）</span>
    </ElDivider>
    <ElForm v-if="dialogType === 'add'" label-width="100px">
      <ElFormItem label="选择数据源">
        <ElSelect v-model="selectedDbConfigId" placeholder="选择已保存的数据库配置" clearable style="width: 360px"
          @change="onDbConfigSelect">
          <ElOption v-for="item in savedDbConfigs" :key="item.id" :label="item.name" :value="item.id as number" />
        </ElSelect>
      </ElFormItem>
    </ElForm>
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
import { fetchGetAllDatabaseConfigs } from '@/api/metadata/database-config'

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

// 已保存的数据库配置选择
const savedDbConfigs = ref<Api.MetadataDatabaseConfig.DatabaseConfigItem[]>([])
const selectedDbConfigId = ref<number | ''>('')
const selectedDbConfig = ref<Api.MetadataDatabaseConfig.DatabaseConfigItem | null>(null)

function onDbConfigSelect(val: number | '') {
  if (val === '' || val === undefined) {
    selectedDbConfig.value = null
    return
  }
  selectedDbConfig.value = savedDbConfigs.value.find(c => c.id === val) || null
}

async function loadSavedDbConfigs() {
  try {
    const res: any = await fetchGetAllDatabaseConfigs()
    if (Array.isArray(res)) {
      savedDbConfigs.value = res
    }
  } catch { /* keep empty */ }
}

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
      if (props.type === 'add') loadSavedDbConfigs()
    }
  }
)

const handleSubmit = async () => {
  if (!formRef.value) return
  formRef.value.validate().then(async () => {
    try {
      loading.value = true
      if (dialogType.value === 'add') {
        const payload = { ...formData }
        if (selectedDbConfig.value) {
          payload.storageConfig = {
            host: selectedDbConfig.value.host,
            port: selectedDbConfig.value.port,
            username: selectedDbConfig.value.username,
            password: selectedDbConfig.value.password,
            database: selectedDbConfig.value.database,
            schema: selectedDbConfig.value.schema || 'public',
          }
        }
        await fetchCreateCollection(payload)
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
  selectedDbConfigId.value = ''
  selectedDbConfig.value = null
}
</script>
