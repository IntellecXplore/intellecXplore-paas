<template>
  <div class="p-5">
    <ArtTable :data="tableData" :loading="loading" :pagination="{ total, current, size }"
      @pagination:current-change="onCurrentChange" @pagination:size-change="onSizeChange">
      <template #search>
        <el-form :model="queryForm" inline>
          <el-form-item label="任务ID">
            <el-input v-model="queryForm.taskId" clearable placeholder="任务ID" />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="queryForm.status" clearable placeholder="全部">
              <el-option label="运行中" value="running" />
              <el-option label="成功" value="success" />
              <el-option label="部分成功" value="partial" />
              <el-option label="失败" value="failed" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="doSearch">搜索</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </el-form-item>
        </el-form>
      </template>

      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="taskId" label="任务ID" width="80" />
      <el-table-column prop="startTime" label="开始时间" width="160" />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="logStatusType(row.status)" size="small">
            {{ logStatusLabel(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="totalCount" label="总数" width="80" />
      <el-table-column prop="insertCount" label="写入" width="80" />
      <el-table-column prop="errorCount" label="失败" width="80">
        <template #default="{ row }">
          <span :style="{ color: row.errorCount > 0 ? 'red' : '' }">{{ row.errorCount }}</span>
        </template>
      </el-table-column>
      <el-table-column label="触发方式" width="80">
        <template #default="{ row }">
          {{ row.triggerType === 'manual' ? '手动' : row.triggerType === 'scheduled' ? '定时' : row.triggerType || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="耗时" width="90">
        <template #default="{ row }">{{ row.durationMs ? `${(row.durationMs / 1000).toFixed(1)}s` : '-' }}</template>
      </el-table-column>
      <el-table-column label="操作" width="80" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDetail(row)">详情</el-button>
        </template>
      </el-table-column>
    </ArtTable>

    <el-dialog v-model="detailVisible" title="同步日志详情" width="700px">
      <el-descriptions v-if="detail" :column="2" border>
        <el-descriptions-item label="日志ID">{{ detail.id }}</el-descriptions-item>
        <el-descriptions-item label="任务ID">{{ detail.taskId }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="logStatusType(detail.status)" size="small">{{ logStatusLabel(detail.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="触发方式">{{ detail.triggerType === 'manual' ? '手动' : '定时' }}</el-descriptions-item>
        <el-descriptions-item label="开始时间">{{ detail.startTime }}</el-descriptions-item>
        <el-descriptions-item label="结束时间">{{ detail.endTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="总条数">{{ detail.totalCount }}</el-descriptions-item>
        <el-descriptions-item label="写入条数">{{ detail.insertCount }}</el-descriptions-item>
        <el-descriptions-item label="失败条数">{{ detail.errorCount }}</el-descriptions-item>
        <el-descriptions-item label="耗时">{{ detail.durationMs ? `${(detail.durationMs / 1000).toFixed(1)}s` : '-' }}</el-descriptions-item>
      </el-descriptions>

      <div v-if="detail?.errorSamples?.length" class="mt-4">
        <h4 class="text-sm font-bold mb-2">错误样例</h4>
        <div v-for="(e, i) in detail.errorSamples" :key="i" class="mb-2 p-2 bg-red-50 rounded text-sm">
          <div>行数: {{ e.rowCount || 1 }}</div>
          <div class="text-red-600">{{ e.message }}</div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { fetchLogList, fetchLogDetail } from '@/api/integration/log'

const loading = ref(false)
const tableData = ref<any[]>([])
const total = ref(0)
const current = ref(1)
const size = ref(10)
const queryForm = reactive({ taskId: '', status: '' })
const detailVisible = ref(false)
const detail = ref<any>(null)

const loadData = async () => {
  loading.value = true
  try {
    const res = await fetchLogList({ ...queryForm, pageNum: current.value, pageSize: size.value })
    tableData.value = (res as any)?.data?.list || res?.list || []
    total.value = (res as any)?.data?.total || res?.total || 0
  } finally { loading.value = false }
}

const doSearch = () => { current.value = 1; loadData() }
const resetSearch = () => { queryForm.taskId = ''; queryForm.status = ''; doSearch() }
const onCurrentChange = (page: number) => { current.value = page; loadData() }
const onSizeChange = (val: number) => { size.value = val; loadData() }

const logStatusType = (s: string) =>
  s === 'success' ? 'success' : s === 'partial' ? 'warning' : s === 'failed' ? 'danger' : 'info'
const logStatusLabel = (s: string) =>
  s === 'success' ? '成功' : s === 'partial' ? '部分' : s === 'failed' ? '失败' : '运行中'

const openDetail = async (row: any) => {
  try {
    const res: any = await fetchLogDetail(row.id)
    detail.value = res?.data || res
  } catch { detail.value = row }
  detailVisible.value = true
}

onMounted(loadData)
</script>
