<template>
  <div class="dynamic-crud-page art-full-height">
    <ArtSearchBar v-if="searchItems.length > 0" ref="searchBarRef" v-model="searchForm" :items="searchItems"
      @search="handleSearch" @reset="handleSearchReset" />

    <ElCard class="art-table-card" shadow="never">
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData">
        <template #left>
          <ElSpace wrap>
            <ElButton type="primary" @click="showDialog('add')" v-ripple>新增</ElButton>
          </ElSpace>
        </template>
      </ArtTableHeader>

      <ArtTable :loading="loading" :data="data" :columns="columns" :pagination="pagination" :empty-text="loading ? '加载中...' : '暂无数据'"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange" />

      <DataDialog v-model:visible="dialogVisible" :type="dialogType" :data="currentData" :fields="fields"
        :table-name="tableName" @submit="handleDialogSubmit" />
    </ElCard>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { useRoute } from 'vue-router'
import { ElTag, ElMessageBox } from 'element-plus'
import { useTable } from '@/hooks/core/useTable'
import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
import type { SearchFormItem } from '@/components/core/forms/art-search-bar/index.vue'
import type { DialogType } from '@/types'
import { fetchGetCollectionDetail } from '@/api/metadata/collection'
import { fetchGetFieldList } from '@/api/metadata/field'
import { fetchCollectionDataList, fetchDeleteCollectionData } from '@/api/metadata/data-service'
import DataDialog from './modules/data-dialog.vue'

defineOptions({ name: 'DynamicCrud' })

const route = useRoute()
const collectionId = computed(() => route.meta.metadataCollectionId as number | undefined)

const tableName = ref('')
const fields = ref<Api.MetadataField.FieldListItem[]>([])
const ready = ref(false)

// Search form (dynamic keys)
const searchForm = ref<Record<string, any>>({})
const searchBarRef = ref()

// Dialog state
const dialogType = ref<DialogType>('add')
const dialogVisible = ref(false)
const currentData = ref<Record<string, any>>({})

// Field type → table component mapping
const typeLabel: Record<string, string> = {
  string: '文本', text: '文本', integer: '整数', decimal: '小数',
  boolean: '布尔', date: '日期', datetime: '日期时间', json: 'JSON',
  email: '邮箱', phone: '手机号', url: '链接', enum: '枚举', richtext: '富文本',
}

// Auto-generate table columns
const columnsFactory = () => {
  const cols: any[] = [
    { type: 'selection' as const },
    { type: 'index' as const, width: 60, label: '序号' },
  ]

  for (const field of fields.value) {
    const col: any = {
      prop: field.columnName,
      label: field.label || field.columnName,
      minWidth: 120,
    }
    if (field.type === 'boolean') {
      col.formatter = (row: any) =>
        h(ElTag, { type: row[field.columnName] ? 'success' : 'info' },
          () => row[field.columnName] ? '是' : '否')
      col.width = 80
    } else if (field.type === 'date') {
      col.formatter = (row: any) => row[field.columnName]
        ? dayjs(row[field.columnName]).format('YYYY-MM-DD') : '-'
      col.width = 120
    } else if (field.type === 'datetime') {
      col.formatter = (row: any) => row[field.columnName]
        ? dayjs(row[field.columnName]).format('YYYY-MM-DD HH:mm:ss') : '-'
      col.width = 170
    } else if (field.type === 'enum') {
      const opts = parseEnumOptions(field)
      const labelMap = new Map(opts.map((o: any) => [o.value, o.label]))
      col.formatter = (row: any) => {
        const v = row[field.columnName]
        return h(ElTag, { type: 'primary' }, () => labelMap.get(v) || v || '-')
      }
      col.width = 100
    } else if (field.type === 'decimal') {
      col.align = 'right'
    } else if (field.type === 'integer') {
      col.align = 'right'
      col.width = 100
    }
    cols.push(col)
  }

  cols.push({
    prop: 'createTime', label: '创建时间', width: 170,
    formatter: (row: any) => row.createTime
      ? dayjs(row.createTime).format('YYYY-MM-DD HH:mm:ss') : '-',
  })

  cols.push({
    prop: 'operation', label: '操作', width: 150, fixed: 'right',
    formatter: (row: any) =>
      h('div', { class: 'flex gap-2' }, [
        h(ArtButtonTable, { type: 'edit', onClick: () => showDialog('edit', row) }),
        h(ArtButtonTable, { type: 'delete', onClick: () => handleDelete(row) }),
      ]),
  })

  return cols
}

function parseEnumOptions(field: any): { label: string; value: string }[] {
  if (field.uiConfig?.options) return field.uiConfig.options
  if (typeof field.uiConfig === 'string') {
    try { const parsed = JSON.parse(field.uiConfig); return parsed.options || []; } catch { return []; }
  }
  return []
}

// Auto-generate search bar items
const searchItems = computed<SearchFormItem[]>(() => {
  return fields.value
    .filter(f => ['string', 'text', 'email', 'phone', 'url', 'enum', 'integer', 'decimal', 'boolean'].includes(f.type))
    .slice(0, 8)
    .map(f => {
      const item: SearchFormItem = {
        key: f.columnName,
        label: f.label || f.columnName,
        type: f.type === 'integer' || f.type === 'decimal' ? 'input'
          : f.type === 'boolean' ? 'select'
            : f.type === 'enum' ? 'select'
              : 'input',
        props: {
          placeholder: `请输入${f.label || f.columnName}`,
          clearable: true,
        },
        span: 6,
      }
      if (f.type === 'boolean') {
        item.props!.options = [{ label: '是', value: 'true' }, { label: '否', value: 'false' }]
      }
      if (f.type === 'enum') {
        const opts = parseEnumOptions(f)
        if (opts.length > 0) item.props!.options = opts.map((o: any) => ({ label: o.label, value: o.value }))
      }
      return item
    })
})

// useTable setup - wrapped in a function so tableName is available
const tableApiFn = (params: any) => {
  return fetchCollectionDataList({
    ...params,
    tableName: tableName.value,
  })
}

const {
  columns, columnChecks, data, loading, pagination,
  getData, searchParams, resetSearchParams,
  handleSizeChange, handleCurrentChange, refreshData
} = useTable({
  core: {
    apiFn: tableApiFn,
    apiParams: searchForm.value,
    paginationKey: { current: 'pageNum', size: 'pageSize' },
    columnsFactory,
    immediate: false,
  },
})

// Dialog actions
function showDialog(type: DialogType, row?: Record<string, any>) {
  dialogType.value = type
  currentData.value = row ? { ...row } : {}
  dialogVisible.value = true
}

async function handleDelete(row: Record<string, any>) {
  try {
    await ElMessageBox.confirm('确认删除该数据？', '提示', { type: 'warning' })
    await fetchDeleteCollectionData(tableName.value, row.id as number)
    getData()
  } catch { /* cancelled */ }
}

async function handleDialogSubmit() {
  getData()
}

// Search handlers
function handleSearch(params: Record<string, any>) {
  // Merge search params into the query, mapping filters to field column names
  Object.assign(searchParams, params)
  getData()
}

function handleSearchReset() {
  resetSearchParams()
  searchForm.value = {}
  getData()
}

// Init: fetch collection & fields from metadataCollectionId in route meta
async function init() {
  const cid = collectionId.value
  if (!cid) {
    console.warn('[DynamicCrud] No metadataCollectionId in route meta')
    return
  }
  try {
    const collection = await fetchGetCollectionDetail(cid)
    tableName.value = collection.tableName

    const fieldRes = await fetchGetFieldList({ collectionId: cid, pageSize: 999 }) as any
    fields.value = fieldRes?.list || fieldRes?.records || fieldRes || []
    ready.value = true

    // Initialize search form
    const form: Record<string, any> = {}
    for (const f of fields.value) {
      form[f.columnName] = undefined
    }
    searchForm.value = form

    // Load data
    await nextTick()
    getData()
  } catch (e: any) {
    console.error('[DynamicCrud] Init failed:', e)
  }
}

onMounted(() => {
  init()
})
</script>
