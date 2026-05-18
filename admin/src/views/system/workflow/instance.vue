<template>
    <div class="workflow-instance-page">
        <!-- 搜索栏 -->
        <el-card class="search-card">
            <el-form :inline="true" :model="searchForm">
                <el-form-item label="状态">
                    <el-select v-model="searchForm.status" placeholder="全部" clearable @change="handleSearch">
                        <el-option label="待执行" value="pending" />
                        <el-option label="运行中" value="running" />
                        <el-option label="已完成" value="completed" />
                        <el-option label="失败" value="failed" />
                        <el-option label="已取消" value="cancelled" />
                        <el-option label="已暂停" value="paused" />
                    </el-select>
                </el-form-item>
                <el-form-item label="工作流">
                    <el-input v-model="searchForm.definitionId" placeholder="定义 ID" clearable @keyup.enter="handleSearch" />
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="handleSearch">搜索</el-button>
                </el-form-item>
            </el-form>
        </el-card>

        <!-- 表格 -->
        <el-card>
            <el-table :data="tableData" v-loading="loading" stripe @row-click="handleRowClick" style="cursor: pointer">
                <el-table-column prop="id" label="实例 ID" width="90" />
                <el-table-column prop="workflowName" label="工作流" min-width="150" />
                <el-table-column label="状态" width="100">
                    <template #default="{ row }">
                        <el-tag :type="statusTagType(row.status)">{{ statusLabel(row.status) }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="触发方式" width="100">
                    <template #default="{ row }">
                        <el-tag size="small" :type="row.triggerType === 'cron' ? 'warning' : 'info'">
                            {{ row.triggerType === 'cron' ? '定时' : row.triggerType === 'api' ? 'API' : '手动' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="重试" width="70">
                    <template #default="{ row }">{{ row.retryCount || 0 }}</template>
                </el-table-column>
                <el-table-column label="开始时间" width="180" prop="startedAt" />
                <el-table-column label="完成时间" width="180" prop="completedAt" />
                <el-table-column label="操作" width="180" fixed="right">
                    <template #default="{ row }">
                        <el-button link type="primary" @click.stop="$router.push(`/system/workflow/instances/${row.id}`)">
                            详情
                        </el-button>
                        <el-button
                            v-if="row.status === 'running'"
                            link
                            type="warning"
                            @click.stop="handlePause(row)"
                        >暂停</el-button>
                        <el-button
                            v-if="['paused', 'waiting_approval'].includes(row.status)"
                            link
                            type="success"
                            @click.stop="handleResume(row)"
                        >恢复</el-button>
                        <el-button
                            v-if="['pending', 'running', 'paused', 'waiting_approval'].includes(row.status)"
                            link
                            type="danger"
                            @click.stop="handleCancel(row)"
                        >取消</el-button>
                    </template>
                </el-table-column>
            </el-table>
            <el-pagination
                v-model:current-page="pagination.pageNum"
                v-model:page-size="pagination.pageSize"
                :total="pagination.total"
                layout="total, prev, pager, next, sizes"
                @change="loadData"
            />
        </el-card>
    </div>
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import {
    fetchGetInstanceList,
    fetchPauseInstance,
    fetchResumeInstance,
    fetchCancelInstance,
} from '@/api/workflow'

const loading = ref(false)
const tableData = ref<any[]>([])
const pagination = reactive({ pageNum: 1, pageSize: 20, total: 0 })
const searchForm = reactive({ status: '', definitionId: '' })

const statusMap: Record<string, string> = {
    pending: '待执行',
    running: '运行中',
    completed: '已完成',
    failed: '失败',
    cancelled: '已取消',
    paused: '已暂停',
    waiting_approval: '等待审批',
    waiting_event: '等待事件',
}

const statusTagMap: Record<string, string> = {
    pending: 'info',
    running: 'primary',
    completed: 'success',
    failed: 'danger',
    cancelled: 'info',
    paused: 'warning',
    waiting_approval: 'warning',
    waiting_event: 'warning',
}

function statusLabel(status: string) { return statusMap[status] || status }
function statusTagType(status: string) { return statusTagMap[status] || 'info' }

async function loadData() {
    loading.value = true
    try {
        const res: any = await fetchGetInstanceList({
            pageNum: pagination.pageNum,
            pageSize: pagination.pageSize,
            status: searchForm.status || undefined,
            definitionId: searchForm.definitionId ? Number(searchForm.definitionId) : undefined,
        })
        if (res.code === 200) {
            tableData.value = res.data.list || []
            pagination.total = res.data.total || 0
        }
    } finally {
        loading.value = false
    }
}

function handleSearch() {
    pagination.pageNum = 1
    loadData()
}

function handleRowClick(row: any) {
    ;(window as any).$router?.push(`/system/workflow/instances/${row.id}`)
}

async function handlePause(row: any) {
    try {
        await fetchPauseInstance(row.id)
        ElMessage.success('已暂停')
        loadData()
    } catch (e: any) { ElMessage.error(e.message) }
}

async function handleResume(row: any) {
    try {
        await fetchResumeInstance(row.id)
        ElMessage.success('已恢复执行')
        loadData()
    } catch (e: any) { ElMessage.error(e.message) }
}

async function handleCancel(row: any) {
    try {
        await ElMessageBox.confirm('确定取消此工作流执行吗？', '取消确认')
        await fetchCancelInstance(row.id)
        ElMessage.success('已取消')
        loadData()
    } catch { /* cancelled */ }
}

onMounted(() => loadData())
</script>

<style scoped lang="scss">
.workflow-instance-page {
    .search-card { margin-bottom: 16px; }
}
</style>
