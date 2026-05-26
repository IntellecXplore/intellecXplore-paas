import request from '@/utils/http'

export function fetchTaskList(params: any) {
  return request.get<{ list: any[]; total: number }>({
    url: '/api/integration/task/list',
    params,
  })
}

export function fetchTaskDetail(id: number) {
  return request.get<any>({
    url: `/api/integration/task/${id}`,
  })
}

export function createTask(data: any) {
  return request.post({
    url: '/api/integration/task',
    data,
    showSuccessMessage: true,
  })
}

export function updateTask(data: any) {
  return request.put({
    url: '/api/integration/task',
    data,
    showSuccessMessage: true,
  })
}

export function deleteTask(ids: string) {
  return request.del({
    url: `/api/integration/task/${ids}`,
    showSuccessMessage: true,
  })
}

export function triggerSync(id: number) {
  return request.post<any>({
    url: `/api/integration/task/${id}/trigger`,
    showSuccessMessage: true,
  })
}

export function toggleTask(id: number) {
  return request.post<any>({
    url: `/api/integration/task/${id}/toggle`,
    showSuccessMessage: true,
  })
}

export function previewTaskData(id: number, limit: number = 10) {
  return request.get<{ list: any[]; total: number }>({
    url: `/api/integration/task/${id}/preview`,
    params: { limit },
  })
}
