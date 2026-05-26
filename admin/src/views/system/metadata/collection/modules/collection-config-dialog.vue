<template>
  <ElDialog
    v-model="dialogVisible"
    title="元数据配置信息"
    width="1200px"
    align-center
    @closed="handleClosed"
  >
    <div v-loading="loading">
      <template v-if="detail">
        <ElDescriptions title="基本信息" :column="2" border class="mb-4">
          <ElDescriptionsItem label="物理表名">{{ detail.tableName }}</ElDescriptionsItem>
          <ElDescriptionsItem label="显示名称">{{ detail.label }}</ElDescriptionsItem>
          <ElDescriptionsItem label="存储类型">
            <ElTag :type="detail.databaseType === 'postgresql' ? 'success' : 'warning'">
              {{ detail.databaseType }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="命名空间">{{ detail.namespace }}</ElDescriptionsItem>
          <ElDescriptionsItem label="状态">
            <ElTag :type="(statusTagMap as any)[detail.status || ''] || 'info'">
              {{ (statusLabelMap as any)[detail.status || ''] || detail.status }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="版本">{{ detail.version }}</ElDescriptionsItem>
          <ElDescriptionsItem label="描述" :span="2">{{
            detail.description || '-'
          }}</ElDescriptionsItem>
          <ElDescriptionsItem label="创建时间">{{
            formatTime(detail.createTime)
          }}</ElDescriptionsItem>
          <ElDescriptionsItem label="更新时间">{{
            formatTime(detail.updateTime)
          }}</ElDescriptionsItem>
        </ElDescriptions>

        <template v-if="detail.storageConfig">
          <ElDivider content-position="left">数据库配置</ElDivider>
          <ElDescriptions :column="2" border class="mb-4">
            <ElDescriptionsItem label="主机">{{ detail.storageConfig.host }}</ElDescriptionsItem>
            <ElDescriptionsItem label="端口">{{ detail.storageConfig.port }}</ElDescriptionsItem>
            <ElDescriptionsItem label="数据库">{{
              detail.storageConfig.database
            }}</ElDescriptionsItem>
            <ElDescriptionsItem label="Schema">{{
              detail.storageConfig.schema || '-'
            }}</ElDescriptionsItem>
            <ElDescriptionsItem label="用户名">{{
              detail.storageConfig.username
            }}</ElDescriptionsItem>
            <ElDescriptionsItem label="连接池大小">{{
              detail.storageConfig.poolMax || '-'
            }}</ElDescriptionsItem>
          </ElDescriptions>
        </template>

        <ElDivider content-position="left">
          <span>字段列表 ({{ fields.length }})</span>
          <ElTag v-if="canEdit" type="warning" size="small" class="ml-2">可编辑</ElTag>
          <ElTag v-else type="info" size="small" class="ml-2">只读</ElTag>
        </ElDivider>

        <div class="field-table-wrapper">
          <ElTable :data="fields" size="small" max-height="400" border>
            <ElTableColumn type="index" label="#" width="50" />

            <ElTableColumn label="数据库列名" width="160">
              <template #default="{ row }">
                <ElInput v-if="canEdit" v-model="row.columnName" size="small" placeholder="列名" />
                <span v-else>{{ row.columnName }}</span>
              </template>
            </ElTableColumn>

            <ElTableColumn label="显示名称" width="130">
              <template #default="{ row }">
                <ElInput v-if="canEdit" v-model="row.label" size="small" placeholder="名称" />
                <span v-else>{{ row.label }}</span>
              </template>
            </ElTableColumn>

            <ElTableColumn label="字段类型" width="120">
              <template #default="{ row }">
                <ElSelect v-if="canEdit" v-model="row.type" size="small" class="w-full">
                  <ElOption
                    v-for="opt in typeOptions"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </ElSelect>
                <ElTag v-else :type="(typeTagMap as any)[row.type] || ''" size="small">{{
                  row.type
                }}</ElTag>
              </template>
            </ElTableColumn>

            <ElTableColumn label="长度" width="80">
              <template #default="{ row }">
                <ElInputNumber
                  v-if="canEdit"
                  v-model="row.length"
                  size="small"
                  :min="1"
                  :max="65535"
                  controls-position="right"
                  class="w-full"
                />
                <span v-else>{{ row.length }}</span>
              </template>
            </ElTableColumn>

            <ElTableColumn label="必填" width="60" align="center">
              <template #default="{ row }">
                <ElSwitch v-if="canEdit" v-model="row.required" size="small" />
                <span v-else>{{ row.required ? '√' : '×' }}</span>
              </template>
            </ElTableColumn>

            <ElTableColumn label="唯一" width="60" align="center">
              <template #default="{ row }">
                <ElSwitch v-if="canEdit" v-model="row.isUnique" size="small" />
                <span v-else>{{ row.isUnique ? '√' : '×' }}</span>
              </template>
            </ElTableColumn>

            <ElTableColumn label="索引" width="60" align="center">
              <template #default="{ row }">
                <ElSwitch v-if="canEdit" v-model="row.indexed" size="small" />
                <span v-else>{{ row.indexed ? '√' : '×' }}</span>
              </template>
            </ElTableColumn>

            <ElTableColumn label="可为空" width="65" align="center">
              <template #default="{ row }">
                <ElSwitch v-if="canEdit" v-model="row.nullable" size="small" />
                <span v-else>{{ row.nullable ? '√' : '×' }}</span>
              </template>
            </ElTableColumn>

            <ElTableColumn label="默认值" width="120">
              <template #default="{ row }">
                <ElInput
                  v-if="canEdit"
                  v-model="row.default_value"
                  size="small"
                  placeholder="默认值"
                />
                <span v-else>{{ row.default_value || '-' }}</span>
              </template>
            </ElTableColumn>

            <ElTableColumn label="排序" width="60">
              <template #default="{ row }">
                <ElInputNumber
                  v-if="canEdit"
                  v-model="row.sortOrder"
                  size="small"
                  :min="0"
                  controls-position="right"
                  class="w-full"
                />
                <span v-else>{{ row.sortOrder }}</span>
              </template>
            </ElTableColumn>
          </ElTable>
        </div>
      </template>
    </div>

    <template #footer>
      <ElButton @click="dialogVisible = false">关闭</ElButton>
      <ElButton v-if="canEdit" type="primary" :loading="saving" @click="handleSaveFields"
        >保存字段</ElButton
      >
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import dayjs from 'dayjs'
  import { fetchGetCollectionDetail } from '@/api/metadata/collection'
  import { fetchGetFieldList, fetchUpdateField } from '@/api/metadata/field'
  import { ElMessage, ElMessageBox } from 'element-plus'

  interface Props {
    visible: boolean
    collectionId: number
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  const loading = ref(false)
  const saving = ref(false)
  const detail = ref<Api.MetadataCollection.CollectionListItem | null>(null)
  const fields = ref<Api.MetadataField.FieldListItem[]>([])
  const originalFieldsJson = ref('')

  const canEdit = computed(() => {
    const s = detail.value?.status
    return s === 'draft' || s === 'sync_failed'
  })

  const statusTagMap: Record<string, string> = {
    draft: 'info',
    preparing: 'warning',
    staging: 'primary',
    active: 'success',
    inactive: 'danger',
    sync_failed: 'danger'
  }
  const statusLabelMap: Record<string, string> = {
    draft: '草稿',
    preparing: '准备中',
    staging: '待上线',
    active: '已上线',
    inactive: '已停用',
    sync_failed: '发布失败'
  }
  const typeTagMap: Record<string, string> = {
    string: '',
    integer: 'success',
    boolean: 'warning',
    decimal: 'success',
    date: '',
    datetime: '',
    text: 'info',
    json: 'danger',
    email: '',
    phone: '',
    url: '',
    enum: 'primary',
    richtext: 'info'
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
    { label: 'richtext', value: 'richtext' }
  ]

  const formatTime = (v: any) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm:ss') : '-')

  const loadData = async () => {
    loading.value = true
    try {
      const [detailRes, fieldRes] = await Promise.all([
        fetchGetCollectionDetail(props.collectionId),
        fetchGetFieldList({ collectionId: props.collectionId, pageSize: 999 } as any)
      ])
      console.log('detailRes', detailRes)
      console.log('fieldRes', fieldRes)
      detail.value = detailRes
      fields.value = (fieldRes?.list || fieldRes || []).map((f: any) => ({ ...f }))
      originalFieldsJson.value = JSON.stringify(fields.value)
    } finally {
      loading.value = false
    }
  }

  watch(
    () => [props.visible, props.collectionId],
    ([visible]) => {
      if (visible && props.collectionId) {
        nextTick(() => loadData())
      }
    }
  )

  const handleSaveFields = async () => {
    saving.value = true
    try {
      const originalFields = JSON.parse(
        originalFieldsJson.value
      ) as Api.MetadataField.FieldListItem[]
      const changedFields = fields.value.filter((field, i) => {
        const orig = originalFields[i]
        if (!orig) return false
        const editableKeys = [
          'columnName',
          'label',
          'type',
          'length',
          'required',
          'isUnique',
          'indexed',
          'nullable',
          'default_value',
          'sortOrder'
        ]
        return editableKeys.some((key) => (field as any)[key] !== (orig as any)[key])
      })

      if (changedFields.length === 0) {
        ElMessage.info('没有字段被修改')
        return
      }

      await ElMessageBox.confirm(
        `共 ${changedFields.length} 个字段发生变更，确定保存吗？`,
        '保存确认',
        { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
      )

      let saved = 0
      for (const field of changedFields) {
        try {
          await fetchUpdateField(field)
          saved++
        } catch {
          // individual field save failure — continue with others
        }
      }

      originalFieldsJson.value = JSON.stringify(fields.value.map((f: any) => ({ ...f })))
      if (saved === changedFields.length) {
        ElMessage.success(`成功保存 ${saved} 个字段`)
      } else {
        ElMessage.warning(`已保存 ${saved}/${changedFields.length} 个字段，部分失败`)
      }
    } catch {
      // user cancelled
    } finally {
      saving.value = false
    }
  }

  const handleClosed = () => {
    detail.value = null
    fields.value = []
    originalFieldsJson.value = ''
  }
</script>

<style scoped>
  .field-table-wrapper {
    overflow-x: auto;
  }
  .field-table-wrapper :deep(.el-input-number) {
    width: 100%;
  }
  .w-full {
    width: 100%;
  }
</style>
