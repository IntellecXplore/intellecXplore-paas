<template>
  <ElDialog v-model="dialogVisible" :title="dialogType === 'add' ? '新增数据库配置' : '编辑数据库配置'" width="650px" align-center
    @closed="handleClosed" :close-on-click-modal="false">
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="100px">
      <ElRow :gutter="20">
        <ElCol :span="24">
          <ElFormItem label="配置名称" prop="name">
            <ElInput v-model="formData.name" placeholder="如：生产环境PG" />
          </ElFormItem>
        </ElCol>
      </ElRow>
      <ElRow :gutter="20">
        <ElCol :span="16">
          <ElFormItem label="主机地址" prop="host">
            <ElInput v-model="formData.host" placeholder="如 localhost 或 IP 地址" />
          </ElFormItem>
        </ElCol>
        <ElCol :span="8">
          <ElFormItem label="端口" prop="port">
            <ElInputNumber v-model="formData.port" :min="1" :max="65535" style="width: 100%" />
          </ElFormItem>
        </ElCol>
      </ElRow>
      <ElRow :gutter="20">
        <ElCol :span="12">
          <ElFormItem label="用户名" prop="username">
            <ElInput v-model="formData.username" placeholder="如 postgres" />
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="密码" prop="password">
            <ElInput v-model="formData.password" type="password" show-password placeholder="数据库密码" />
          </ElFormItem>
        </ElCol>
      </ElRow>
      <ElRow :gutter="20">
        <ElCol :span="12">
          <ElFormItem label="数据库名" prop="database">
            <ElInput v-model="formData.database" placeholder="如 my_database" />
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="Schema">
            <ElInput v-model="formData.schema" placeholder="默认 public" />
          </ElFormItem>
        </ElCol>
      </ElRow>
      <ElRow :gutter="20">
        <ElCol :span="24">
          <ElFormItem label="描述">
            <ElInput v-model="formData.description" type="textarea" :rows="2" placeholder="可选描述" />
          </ElFormItem>
        </ElCol>
      </ElRow>
      <ElRow :gutter="20">
        <ElCol :span="24">
          <ElFormItem>
            <ElButton size="small" @click="handleTestConnection" :loading="testing">
              测试连接
            </ElButton>
          </ElFormItem>
        </ElCol>
      </ElRow>
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
import { fetchCreateDatabaseConfig, fetchUpdateDatabaseConfig, fetchGetDatabaseConfigDetail, fetchTestDatabaseConfigConnection } from '@/api/metadata/database-config'

interface Props {
  visible: boolean
  type: string
  data?: Partial<Api.MetadataDatabaseConfig.DatabaseConfigItem>
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
const testing = ref(false)
const dialogType = computed(() => props.type)
const formRef = ref()

const defaultFormData = () => ({
  id: undefined,
  name: '',
  host: '',
  port: 5432,
  username: '',
  password: '',
  database: '',
  schema: 'public',
  description: '',
})

const formData = reactive(defaultFormData())

const rules: FormRules = {
  name: [{ required: true, message: '请输入配置名称', trigger: 'blur' }],
  host: [{ required: true, message: '请输入主机地址', trigger: 'blur' }],
  port: [{ required: true, message: '请输入端口', trigger: 'blur' }],
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  database: [{ required: true, message: '请输入数据库名', trigger: 'blur' }],
}

const initFormData = () => {
  loading.value = false
  Object.assign(formData, defaultFormData())
  const isEdit = props.type === 'edit' && props.data
  if (isEdit && props.data?.id) {
    fetchGetDatabaseConfigDetail(props.data.id).then(res => {
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

async function handleTestConnection() {
  if (!formData.host || !formData.username || !formData.database) {
    ElMessage.warning('请先填写主机地址、用户名和数据库名')
    return
  }
  testing.value = true
  try {
    const res: any = await fetchTestDatabaseConfigConnection({
      host: formData.host,
      port: formData.port,
      username: formData.username,
      password: formData.password,
      database: formData.database,
    })
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

const handleSubmit = async () => {
  if (!formRef.value) return
  formRef.value.validate().then(async () => {
    try {
      loading.value = true
      if (dialogType.value === 'add') {
        await fetchCreateDatabaseConfig(formData)
      } else {
        await fetchUpdateDatabaseConfig(formData)
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
  formRef.value?.resetFields()
}
</script>
