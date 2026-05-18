<template>
    <div class="workflow-detail-page">
        <el-page-header @back="$router.back()" title="返回">
            <template #content>
                <span>工作流实例 #{{ instanceId }}</span>
            </template>
        </el-page-header>

        <!-- 概览 -->
        <el-card class="overview-card" v-if="instance" v-loading="loading">
            <el-descriptions :column="3" border>
                <el-descriptions-item label="工作流">{{ instance.workflowName }}</el-descriptions-item>
                <el-descriptions-item label="状态">
                    <el-tag :type="statusTagType(instance.status)">{{ statusLabel(instance.status) }}</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="触发方式">
                    {{ instance.triggerType === 'cron' ? '定时' : instance.triggerType === 'api' ? 'API' : '手动' }}
                </el-descriptions-item>
                <el-descriptions-item label="开始时间">{{ instance.startedAt || '-' }}</el-descriptions-item>
                <el-descriptions-item label="完成时间">{{ instance.completedAt || '-' }}</el-descriptions-item>
                <el-descriptions-item label="重试次数">{{ instance.retryCount || 0 }}</el-descriptions-item>
                <el-descriptions-item label="入参" :span="3">
                    <pre class="json-preview">{{ formatJson(instance.input) }}</pre>
                </el-descriptions-item>
                <el-descriptions-item v-if="instance.output" label="输出" :span="3">
                    <pre class="json-preview">{{ formatJson(instance.output) }}</pre>
                </el-descriptions-item>
                <el-descriptions-item v-if="instance.errorMessage" label="错误信息" :span="3">
                    <el-alert type="error" :title="instance.errorMessage" :closable="false" />
                </el-descriptions-item>
            </el-descriptions>
        </el-card>

        <!-- 步骤执行追踪 -->
        <el-card class="traces-card" v-if="traces.length">
            <template #header>步骤执行追踪 ({{ traces.length }})</template>

            <el-timeline>
                <el-timeline-item
                    v-for="trace in traces"
                    :key="trace.id"
                    :timestamp="trace.completedAt || trace.startedAt"
                    :type="traceTimelineType(trace.status)"
                    :hollow="trace.status === 'retrying'"
                >
                    <div class="trace-item">
                        <div class="trace-header">
                            <el-tag size="small" :type="traceStatusTag(trace.status)">
                                {{ trace.status }}
                            </el-tag>
                            <span class="trace-name">{{ trace.stepName || trace.stepId }}</span>
                            <el-tag size="small" type="info">{{ trace.stepType }}</el-tag>
                            <span v-if="trace.durationMs" class="trace-duration">
                                {{ trace.durationMs }}ms
                            </span>
                            <span v-if="trace.attempt > 1" class="trace-attempt">
                                第 {{ trace.attempt }} 次尝试
                            </span>
                        </div>
                        <div v-if="trace.input" class="trace-section">
                            <strong>输入:</strong>
                            <pre class="json-preview small">{{ formatJson(trace.input) }}</pre>
                        </div>
                        <div v-if="trace.output" class="trace-section">
                            <strong>输出:</strong>
                            <pre class="json-preview small">{{ formatJson(trace.output) }}</pre>
                        </div>
                        <div v-if="trace.errorMessage" class="trace-section">
                            <el-alert type="error" :title="trace.errorMessage" :closable="false" />
                        </div>
                        <div v-if="trace.tokenUsage" class="trace-section">
                            <strong>Token 用量:</strong>
                            输入 {{ trace.tokenUsage?.promptTokens }} / 输出 {{ trace.tokenUsage?.completionTokens }}
                        </div>
                    </div>
                </el-timeline-item>
            </el-timeline>
        </el-card>

        <!-- 空状态 -->
        <el-empty v-if="!loading && instance && traces.length === 0" description="暂无步骤执行记录" />
    </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { fetchGetInstanceDetail, fetchGetInstanceTraces } from '@/api/workflow'

const route = useRoute()
const instanceId = Number(route.params.id)

const loading = ref(false)
const instance = ref<any>(null)
const traces = ref<any[]>([])

const statusMap: Record<string, string> = {
    pending: '待执行', running: '运行中', completed: '已完成',
    failed: '失败', cancelled: '已取消', paused: '已暂停',
    waiting_approval: '等待审批', waiting_event: '等待事件',
    retrying: '重试中', skipped: '已跳过',
}

const statusTagMap: Record<string, string> = {
    pending: 'info', running: 'primary', completed: 'success',
    failed: 'danger', cancelled: 'info', paused: 'warning',
    waiting_approval: 'warning', waiting_event: 'warning',
    retrying: 'warning', skipped: 'info',
}

function statusLabel(s: string) { return statusMap[s] || s }
function statusTagType(s: string) { return statusTagMap[s] || 'info' }
function traceStatusTag(s: string) { return statusTagMap[s] || 'info' }
function traceTimelineType(s: string) {
    if (s === 'completed') return 'success'
    if (s === 'failed') return 'danger'
    if (s === 'retrying') return 'warning'
    return 'primary'
}
function formatJson(data: unknown): string {
    try { return JSON.stringify(data, null, 2) } catch { return String(data) }
}

async function loadData() {
    loading.value = true
    try {
        const [instRes, tracesRes]: any[] = await Promise.all([
            fetchGetInstanceDetail(instanceId),
            fetchGetInstanceTraces(instanceId),
        ])
        if (instRes.code === 200) instance.value = instRes.data
        if (tracesRes.code === 200) traces.value = tracesRes.data || []
    } finally {
        loading.value = false
    }
}

onMounted(() => loadData())
</script>

<style scoped lang="scss">
.workflow-detail-page {
    .overview-card, .traces-card { margin-top: 16px; }
    .json-preview {
        margin: 4px 0;
        padding: 8px;
        background: #f5f7fa;
        border-radius: 4px;
        font-size: 12px;
        max-height: 300px;
        overflow: auto;
        &.small { max-height: 200px; }
    }
    .trace-item {
        .trace-header {
            display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
            .trace-name { font-weight: 600; }
            .trace-duration { color: #909399; font-size: 12px; }
            .trace-attempt { color: #e6a23c; font-size: 12px; }
        }
        .trace-section { margin-top: 8px; }
    }
}
</style>
