import request from '@/utils/http'

// ============== 工作流定义 ==============

export function fetchCreateWorkflow(data: {
    name: string
    description?: string
    definition: any
    isTemplate?: boolean
}) {
    return request.post({ url: '/api/workflow/definitions', data })
}

export function fetchGetWorkflowList(params?: {
    pageNum?: number
    pageSize?: number
    status?: string
    keyword?: string
}) {
    return request.get({ url: '/api/workflow/definitions', params })
}

export function fetchGetWorkflowDetail(id: number) {
    return request.get({ url: `/api/workflow/definitions/${id}` })
}

export function fetchUpdateWorkflow(id: number, data: any) {
    return request.put({ url: `/api/workflow/definitions/${id}`, data })
}

export function fetchDeleteWorkflow(ids: string) {
    return request.del({ url: `/api/workflow/definitions/${ids}` })
}

export function fetchPublishWorkflow(id: number) {
    return request.post({ url: `/api/workflow/definitions/${id}/publish` })
}

// ============== 工作流实例/执行 ==============

export function fetchRunWorkflow(data: {
    definitionId: number
    input?: Record<string, unknown>
    scheduledAt?: string
    triggerType?: string
    agentId?: string
}) {
    return request.post({ url: '/api/workflow/instances/run', data })
}

export function fetchGetInstanceList(params?: {
    pageNum?: number
    pageSize?: number
    status?: string
    userId?: number
    definitionId?: number
}) {
    return request.get({ url: '/api/workflow/instances', params })
}

export function fetchGetInstanceDetail(id: number) {
    return request.get({ url: `/api/workflow/instances/${id}` })
}

export function fetchGetInstanceTraces(id: number, stepId?: string) {
    return request.get({ url: `/api/workflow/instances/${id}/traces`, params: { stepId } })
}

export function fetchPauseInstance(id: number) {
    return request.post({ url: `/api/workflow/instances/${id}/pause` })
}

export function fetchResumeInstance(id: number, event?: Record<string, unknown>) {
    return request.post({ url: `/api/workflow/instances/${id}/resume`, data: { event } })
}

export function fetchCancelInstance(id: number) {
    return request.post({ url: `/api/workflow/instances/${id}/cancel` })
}

// ============== 节点类型 ==============

export function fetchGetNodeTypes() {
    return request.get({ url: '/api/workflow/node-types' })
}
