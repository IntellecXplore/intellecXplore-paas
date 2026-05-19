<template>
  <ArtSearchBar ref="searchBarRef" v-model="formData" :items="formItems" :rules="rules" @reset="handleReset"
    @search="handleSearch">
  </ArtSearchBar>
</template>

<script setup lang="ts">
interface Props {
  modelValue: Record<string, any>
}
interface Emits {
  (e: 'update:modelValue', value: Record<string, any>): void
  (e: 'search', params: Record<string, any>): void
  (e: 'reset'): void
}
const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const searchBarRef = ref()
const formData = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const rules = {}

const formItems = computed(() => [
  {
    label: '物理表名',
    key: 'tableName',
    type: 'input',
    placeholder: '请输入物理表名',
    clearable: true
  },
  {
    label: '显示名称',
    key: 'label',
    type: 'input',
    placeholder: '请输入显示名称',
    clearable: true
  },
  {
    label: '存储类型',
    key: 'databaseType',
    type: 'select',
    props: {
      placeholder: '请选择存储类型',
      options: [
        { label: 'PostgreSQL', value: 'postgresql' },
        { label: 'MongoDB', value: 'mongodb', disabled: true },
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
  {
    label: '状态',
    key: 'status',
    type: 'select',
    props: {
      placeholder: '请选择状态',
      options: [
        { label: '草稿', value: 'draft' },
        { label: '准备中', value: 'preparing' },
        { label: '待上线', value: 'staging' },
        { label: '已上线', value: 'active' },
        { label: '已停用', value: 'inactive' },
        { label: '发布失败', value: 'sync_failed' },
      ]
    }
  },
])

function handleReset() {
  emit('reset')
}

async function handleSearch() {
  await searchBarRef.value.validate()
  emit('search', formData.value)
}
</script>
