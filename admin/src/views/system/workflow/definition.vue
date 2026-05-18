<template>
    <div class="workflow-definition-page">
        <!-- 搜索栏 -->
        <el-card class="search-card">
            <el-form :inline="true" :model="searchForm">
                <el-form-item label="状态">
                    <el-select v-model="searchForm.status" placeholder="全部" clearable @change="handleSearch">
                        <el-option label="草稿" value="draft" />
                        <el-option label="已发布" value="published" />
                    </el-select>
                </el-form-item>
                <el-form-item label="关键词">
                    <el-input v-model="searchForm.keyword" placeholder="名称/描述" clearable @keyup.enter="handleSearch" />
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="handleSearch">搜索</el-button>
                    <el-button type="success" @click="handleCreate">新建工作流</el-button>
                </el-form-item>
            </el-form>
        </el-card>

        <!-- 表格 -->
        <el-card>
            <el-table :data="tableData" v-loading="loading" stripe>
                <el-table-column prop="id" label="ID" width="80" />
                <el-table-column prop="name" label="名称" min-width="160" />
                <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
                <el-table-column label="状态" width="100">
                    <template #default="{ row }">
                        <el-tag :type="row.status === 'published' ? 'success' : 'info'">
                            {{ row.status === 'published' ? '已发布' : '草稿' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="版本" width="80" prop="version" />
                <el-table-column label="步骤数" width="80">
                    <template #default="{ row }">
                        {{ row.definition?.steps?.length || 0 }}
                    </template>
                </el-table-column>
                <el-table-column label="创建时间" width="180" prop="createTime" />
                <el-table-column label="操作" width="260" fixed="right">
                    <template #default="{ row }">
                        <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
                        <el-button v-if="row.status === 'draft'" link type="success" @click="handlePublish(row)">
                            发布
                        </el-button>
                        <el-button link type="warning" @click="handleRun(row)">执行</el-button>
                        <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
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

        <!-- 编辑/新建弹窗 -->
        <el-dialog
            v-model="dialogVisible"
            :title="editingId ? '编辑工作流' : '新建工作流'"
            width="800px"
            @closed="resetForm"
        >
            <el-form :model="formData" label-width="100px">
                <el-form-item label="名称" required>
                    <el-input v-model="formData.name" placeholder="工作流名称" />
                </el-form-item>
                <el-form-item label="描述">
                    <el-input v-model="formData.description" type="textarea" :rows="2" placeholder="可选描述" />
                </el-form-item>
                <el-form-item label="步骤定义 (JSON)">
                    <el-input
                        v-model="formData.definitionJson"
                        type="textarea"
                        :rows="16"
                        placeholder='[{ "id": "step-1", "type": "tool", "name": "...", "tool": "get_current_time", "input": {} }]'
                    />
                    <div style="color: #909399; font-size: 12px; margin-top: 4px">
                        支持步骤类型: tool, llm, conditional, parallel, wait。输入合法的 JSON 数组。
                    </div>
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" @click="handleSave" :loading="saving">保存</el-button>
            </template>
        </el-dialog>

        <!-- 执行弹窗 -->
        <el-dialog v-model="runDialogVisible" title="执行工作流" width="500px">
            <el-form label-width="80px">
                <el-form-item label="工作流">
                    {{ runTarget?.name }}
                </el-form-item>
                <el-form-item label="入参 (JSON)">
                    <el-input v-model="runInput" type="textarea" :rows="6" placeholder='{ "key": "value" }' />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="runDialogVisible = false">取消</el-button>
                <el-button type="primary" @click="handleConfirmRun" :loading="running">执行</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import {
    fetchGetWorkflowList,
    fetchCreateWorkflow,
    fetchUpdateWorkflow,
    fetchDeleteWorkflow,
    fetchPublishWorkflow,
    fetchRunWorkflow,
} from '@/api/workflow'

const loading = ref(false)
const saving = ref(false)
const running = ref(false)
const tableData = ref<any[]>([])
const pagination = reactive({ pageNum: 1, pageSize: 20, total: 0 })
const searchForm = reactive({ status: '', keyword: '' })

const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const formData = reactive({ name: '', description: '', definitionJson: '' })

const runDialogVisible = ref(false)
const runTarget = ref<any>(null)
const runInput = ref('{}')

function resetForm() {
    editingId.value = null
    formData.name = ''
    formData.description = ''
    formData.definitionJson = ''
}

async function loadData() {
    loading.value = true
    try {
        const res: any = await fetchGetWorkflowList({
            pageNum: pagination.pageNum,
            pageSize: pagination.pageSize,
            status: searchForm.status || undefined,
            keyword: searchForm.keyword || undefined,
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

function handleCreate() {
    resetForm()
    dialogVisible.value = true
}

function handleEdit(row: any) {
    editingId.value = row.id
    formData.name = row.name
    formData.description = row.description || ''
    formData.definitionJson = JSON.stringify(
        { steps: row.definition?.steps || [], retryPolicy: row.definition?.retryPolicy, timeoutMs: row.definition?.timeoutMs },
        null,
        2,
    )
    dialogVisible.value = true
}

async function handleSave() {
    if (!formData.name.trim()) {
        ElMessage.warning('请输入名称')
        return
    }
    let definition: any
    try {
        definition = JSON.parse(formData.definitionJson || '{}')
    } catch {
        ElMessage.error('定义 JSON 格式无效')
        return
    }

    saving.value = true
    try {
        if (editingId.value) {
            await fetchUpdateWorkflow(editingId.value, {
                name: formData.name,
                description: formData.description,
                definition,
            })
            ElMessage.success('更新成功')
        } else {
            await fetchCreateWorkflow({
                name: formData.name,
                description: formData.description,
                definition,
            })
            ElMessage.success('创建成功')
        }
        dialogVisible.value = false
        loadData()
    } finally {
        saving.value = false
    }
}

async function handlePublish(row: any) {
    try {
        await ElMessageBox.confirm(`确定发布 "${row.name}" 吗？发布后工作流可被触发执行。`, '发布确认')
        const res: any = await fetchPublishWorkflow(row.id)
        if (res.code === 200) {
            ElMessage.success('发布成功')
            loadData()
        } else {
            ElMessage.error(res.msg)
        }
    } catch { /* cancelled */ }
}

function handleRun(row: any) {
    runTarget.value = row
    runInput.value = '{}'
    runDialogVisible.value = true
}

async function handleConfirmRun() {
    let input: any
    try {
        input = JSON.parse(runInput.value)
    } catch {
        ElMessage.error('入参 JSON 格式无效')
        return
    }
    running.value = true
    try {
        const res: any = await fetchRunWorkflow({ definitionId: runTarget.value.id, input })
        if (res.code === 200) {
            ElMessage.success(`工作流已触发，实例 ID: ${res.data.instanceId}`)
            runDialogVisible.value = false
        } else {
            ElMessage.error(res.msg)
        }
    } finally {
        running.value = false
    }
}

async function handleDelete(row: any) {
    try {
        await ElMessageBox.confirm(`确定删除 "${row.name}" 吗？`, '删除确认')
        await fetchDeleteWorkflow(String(row.id))
        ElMessage.success('删除成功')
        loadData()
    } catch { /* cancelled */ }
}

onMounted(() => loadData())
</script>

<style scoped lang="scss">
.workflow-definition-page {
    .search-card { margin-bottom: 16px; }
}
</style>
