<!-- AI 助手聊天窗口 -->
<template>
  <div>
    <ElDrawer v-model="isDrawerVisible" :size="isMobile ? '100%' : '480px'" :with-header="false">
      <!-- 头部 -->
      <div class="mb-5 flex-cb">
        <div>
          <span class="text-base font-medium">Art Bot</span>
          <div class="mt-1.5 flex-c gap-1">
            <div class="h-2 w-2 rounded-full" :class="isOnline ? 'bg-success/100' : 'bg-danger/100'"></div>
            <span class="text-xs text-g-600">{{ isOnline ? '在线' : '离线' }}</span>
          </div>
        </div>
        <div class="flex-c gap-2">
          <ElIcon class="c-p" :size="18" @click="newConversation">
            <component :is="Plus" />
          </ElIcon>
          <ElIcon class="c-p" :size="20" @click="closeChat">
            <Close />
          </ElIcon>
        </div>
      </div>

      <div class="flex h-[calc(100%-70px)] flex-col">
        <!-- 消息区域 -->
        <div
          class="flex-1 overflow-y-auto border-t-d px-4 py-4 [&::-webkit-scrollbar]:!w-1"
          ref="messageContainer"
        >
          <!-- 欢迎消息 -->
          <div v-if="messages.length === 0" class="flex flex-col items-center justify-center h-full text-g-500">
            <ElIcon :size="48" class="mb-4 text-g-300">
              <component :is="ChatDotRound" />
            </ElIcon>
            <p class="text-sm">你好！我是 Art Bot</p>
            <p class="text-xs mt-1">可以帮你查询数据、解答问题</p>
          </div>

          <!-- 消息列表 -->
          <template v-for="(message, index) in messages" :key="index">
            <div :class="['mb-5 flex w-full items-start gap-2', message.isMe ? 'flex-row-reverse' : 'flex-row']">
              <ElAvatar :size="32" :src="message.avatar" class="shrink-0" />
              <div :class="['flex max-w-[75%] flex-col', message.isMe ? 'items-end' : 'items-start']">
                <div :class="['mb-1 flex gap-2 text-xs', message.isMe ? 'flex-row-reverse' : 'flex-row']">
                  <span class="font-medium">{{ message.sender }}</span>
                  <span class="text-g-600">{{ message.time }}</span>
                </div>

                <!-- AI 消息内容 -->
                <div
                  v-if="!message.isMe"
                  :class="['group rounded-md px-3.5 py-2.5 text-sm leading-[1.6] message-left bg-g-300/50']"
                >
                  <!-- 推理/思考过程（可折叠） -->
                  <div v-if="message.reasoning" class="mb-2 rounded border border-g-200 bg-white/70">
                    <div
                      class="flex-c gap-1.5 px-2.5 py-1.5 c-p select-none text-xs text-g-600 hover:bg-g-100/60 rounded-t"
                      @click="message.reasoningCollapsed = !message.reasoningCollapsed"
                    >
                      <ElIcon :size="14" v-if="isThinking && !message.content" class="animate-spin text-theme">
                        <component :is="Loading" />
                      </ElIcon>
                      <ElIcon :size="14" v-else class="text-g-500">
                        <component :is="Setting" />
                      </ElIcon>
                      <span class="font-medium">思考过程</span>
                      <span v-if="isThinking && !message.content" class="text-g-400">中...</span>
                      <ElIcon :size="12" class="ml-auto transition-transform" :class="message.reasoningCollapsed ? '' : 'rotate-180'">
                        <component :is="ArrowDown" />
                      </ElIcon>
                    </div>
                    <div v-if="!message.reasoningCollapsed" class="px-2.5 pb-2 text-xs text-g-600 whitespace-pre-wrap leading-[1.5] max-h-48 overflow-y-auto">
                      {{ message.reasoning }}
                    </div>
                  </div>

                  <!-- 文本回答内容 -->
                  <div v-if="message.content" class="text-g-900" v-html="renderContent(message.content)"></div>

                  <!-- 思考中指示器（无内容、无推理、无工具调用时） -->
                  <div v-if="!message.content && !message.reasoning && !message.toolCalls?.length && isThinking" class="text-g-500">
                    <span class="thinking-dots">思考中</span>
                  </div>

                  <!-- 工具调用卡片 -->
                  <div v-if="message.toolCalls?.length" class="mt-2 space-y-1.5">
                    <div
                      v-for="tc in message.toolCalls"
                      :key="tc.id"
                      class="rounded border px-2.5 py-1.5"
                      :class="tc.status === 'error' ? 'border-danger/30 bg-danger/5' : tc.status === 'done' ? 'border-success/30 bg-success/5' : 'border-g-200 bg-white/60'"
                    >
                      <div class="flex-c gap-1 text-xs">
                        <ElIcon :size="12"><component :is="Setting" /></ElIcon>
                        <span class="font-medium text-g-700">{{ getToolLabel(tc.name) }}</span>
                        <span v-if="tc.status === 'running'" class="text-warning">执行中...</span>
                        <span v-else-if="tc.status === 'done'" class="text-success">完成</span>
                        <span v-else-if="tc.status === 'error'" class="text-danger">失败</span>
                      </div>
                      <div v-if="tc.result && tc.status === 'done'" class="mt-1">
                        <div v-if="getToolSummary(tc.name, tc.result)" class="text-xs text-g-600 mb-1">
                          {{ getToolSummary(tc.name, tc.result) }}
                        </div>
                        <pre
                          class="whitespace-pre-wrap font-mono text-xs text-g-500 max-h-32 overflow-y-auto bg-g-100/50 rounded px-2 py-1"
                          @click="(e) => (e.target as HTMLElement).classList.toggle('max-h-32')"
                        >{{ formatResult(tc.result) }}</pre>
                      </div>
                      <div v-if="tc.result && tc.status === 'error'" class="mt-1 text-xs text-danger">
                        {{ extractError(tc.result) }}
                      </div>
                    </div>
                  </div>

                  <!-- 操作按钮（流式结束后显示） -->
                  <div v-if="!isThinking" class="flex-c justify-end gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ElButton :icon="CopyDocument" text size="small" class="!h-6 !w-6" @click.stop="copyMessage(message)" title="复制" />
                    <ElButton :icon="Delete" text size="small" class="!h-6 !w-6" @click.stop="deleteMessage(index)" title="删除" />
                  </div>
                </div>

                <!-- 用户消息内容 -->
                <div v-else class="group rounded-md px-3.5 py-2.5 text-sm leading-[1.4] text-g-900 message-right bg-theme/15">
                  {{ message.content }}
                  <div class="flex-c justify-end gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ElButton :icon="CopyDocument" text size="small" class="!h-6 !w-6" @click.stop="copyMessage(message)" title="复制" />
                    <ElButton :icon="Delete" text size="small" class="!h-6 !w-6" @click.stop="deleteMessage(index)" title="删除" />
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- 输入区域 -->
        <div class="border-t-d px-4 pt-4">
          <ElInput
            v-model="messageText"
            type="textarea"
            :rows="3"
            placeholder="输入消息，例如：帮我创建一个客户信息表，包含姓名、手机号、邮箱字段"
            resize="none"
            :disabled="isThinking"
            @keyup.enter.exact.prevent="sendMessage"
          >
          </ElInput>
          <div class="mt-3 flex-cb">
            <span class="text-xs text-g-500">{{ isThinking ? 'Art Bot 正在思考...' : 'Enter 发送，Shift+Enter 换行' }}</span>
            <ElButton type="primary" :loading="isThinking" @click="sendMessage" v-ripple class="min-w-20">
              {{ isThinking ? '思考中' : '发送' }}
            </ElButton>
          </div>
        </div>
      </div>
    </ElDrawer>
  </div>
</template>

<script setup lang="ts">
import { Close, Plus, ChatDotRound, Setting, CopyDocument, Delete, ArrowDown, Loading } from '@element-plus/icons-vue'
import { mittBus } from '@/utils/sys'
import meAvatar from '@/assets/images/avatar/avatar5.webp'
import aiAvatar from '@/assets/images/avatar/avatar10.webp'
import { connectChatStream } from '@/api/agent/chat'

defineOptions({ name: 'ArtChatWindow' })

// ============== Types ==============

interface DisplayToolCall {
  id: string
  name: string
  status: 'running' | 'done' | 'error'
  result?: string
}

interface DisplayMessage {
  id: number
  sender: string
  content: string
  reasoning: string
  reasoningCollapsed: boolean
  time: string
  isMe: boolean
  avatar: string
  toolCalls?: DisplayToolCall[]
}

// ============== Constants ==============

const MOBILE_BREAKPOINT = 640
const SCROLL_DELAY = 100
const BOT_NAME = 'Art Bot'
const USER_NAME = 'Ricky'

// ============== State ==============

const { width } = useWindowSize()
const isMobile = computed(() => width.value < MOBILE_BREAKPOINT)

const isDrawerVisible = ref(false)
const isOnline = ref(true)
const isThinking = ref(false)
const messageText = ref('')
const messageId = ref(0)
const messageContainer = ref<HTMLElement | null>(null)
const conversationId = ref<string | null>(null)
const messages = ref<DisplayMessage[]>([])
let currentAbort: (() => void) | null = null

// ============== Helpers ==============

const formatCurrentTime = (): string => {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const scrollToBottom = (): void => {
  nextTick(() => {
    setTimeout(() => {
      if (messageContainer.value) {
        messageContainer.value.scrollTop = messageContainer.value.scrollHeight
      }
    }, SCROLL_DELAY)
  })
}

/** 简单的文本渲染：换行转 <br> */
const renderContent = (text: string | null): string => {
  if (!text) return ''
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')
    .replace(/`([^`]+)`/g, '<code class="bg-g-200 px-1 rounded text-xs">$1</code>')
}

const formatResult = (result: string): string => {
  try {
    const obj = JSON.parse(result)
    const formatted = JSON.stringify(obj, null, 2)
    if (formatted.length > 800) {
      return formatted.slice(0, 800) + '\n... (截断，点击展开)'
    }
    return formatted
  } catch {
    return result.slice(0, 800)
  }
}

/** 工具名中文映射 */
const getToolLabel = (name: string): string => {
  const labels: Record<string, string> = {
    get_current_time: '获取时间',
    get_system_info: '获取系统信息',
    query_users: '查询用户',
    list_menus: '查询菜单',
    query_dict_data: '查询字典',
    list_collections: '查询元数据表',
    get_collection_detail: '获取表详情',
    create_collection: '创建元数据表',
    add_fields_to_collection: '添加字段',
    publish_collection: '发布建表 (CREATE TABLE)',
    deploy_collection: '部署上线',
    query_collection_data: '查询数据',
    insert_collection_data: '插入数据',
    update_collection_data: '更新数据',
    delete_collection_data: '删除数据',
    delete_collection: '删除表',
    get_user_permissions: '获取用户权限',
    create_menu: '创建菜单',
    get_dynamic_page_info: '获取动态页面信息',
    trace_relation_path: '链式查询表关系',
  }
  return labels[name] || name
}

/** 提取工具结果的一行摘要 */
const getToolSummary = (toolName: string, result: string): string => {
  try {
    const obj = JSON.parse(result)
    if (obj.message) return obj.message
    if (obj.error) return ''
    switch (toolName) {
      case 'create_collection': {
        const c = obj.created || {}
        return `表 ${c.tableName}（${c.label}）创建成功 · 状态: draft`
      }
      case 'add_fields_to_collection':
        return `添加了 ${obj.added?.length || 0} 个字段`
      case 'publish_collection':
        return obj.success ? '数据库建表完成 · 状态: staging' : '建表失败'
      case 'deploy_collection':
        return obj.success ? '部署上线完成 · 状态: active' : '部署失败'
      case 'query_collection_data':
        return `查到 ${obj.total ?? obj.records?.length ?? 0} 条记录`
      case 'insert_collection_data':
        return '数据已插入'
      case 'update_collection_data':
        return '数据已更新'
      case 'delete_collection_data':
        return obj.message || '数据已删除'
      case 'delete_collection':
        return obj.message || '表已删除'
      case 'list_collections':
        return `共 ${obj.total ?? obj.collections?.length ?? 0} 个元数据表`
      case 'get_collection_detail':
        return `${obj.collection?.label || ''} — ${obj.fieldCount || 0} 个字段`
      case 'query_users':
        return `查到 ${obj.total ?? obj.list?.length ?? 0} 个用户`
      case 'list_menus':
        return `共 ${obj.total ?? obj.menus?.length ?? 0} 个菜单`
      case 'query_dict_data':
        return `查到 ${obj.total ?? obj.data?.length ?? 0} 条字典数据`
      case 'get_user_permissions':
        return `用户有 ${obj.permissionCount ?? 0} 个权限，${obj.roleCount ?? 0} 个角色`
      case 'create_menu':
        return obj.success ? '菜单创建成功' : '菜单创建失败'
      case 'get_dynamic_page_info':
        return obj.matchedCollection
          ? `表 ${obj.matchedCollection.tableName} → 推荐路径 ${obj.matchedCollection.suggestedMenu?.path || ''}`
          : '已获取动态页面路由信息'
      case 'trace_relation_path':
        if (obj.paths?.length) return `找到 ${obj.paths.length} 条路径`
        if (obj.reachableFromSource) return `${obj.sourceTable} 可达 ${obj.reachableFromSource.length} 个表`
        return '未找到路径'
      default:
        return ''
    }
  } catch {
    return ''
  }
}

/** 提取错误信息 */
const extractError = (result: string): string => {
  try {
    const obj = JSON.parse(result)
    return obj.error || JSON.stringify(obj)
  } catch {
    return result.slice(0, 200)
  }
}

const copyMessage = async (message: DisplayMessage): Promise<void> => {
  const parts: string[] = []
  if (message.reasoning) {
    parts.push(`[思考过程]\n${message.reasoning}`)
  }
  if (message.content) {
    parts.push(message.content)
  }
  const text = parts.join('\n\n')
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制到剪贴板')
  } catch {
    ElMessage.error('复制失败')
  }
}

const deleteMessage = (index: number): void => {
  messages.value.splice(index, 1)
}

// ============== Actions ==============

const sendMessage = async (): Promise<void> => {
  const text = messageText.value.trim()
  if (!text || isThinking.value) return

  // Abort any existing stream
  if (currentAbort) {
    currentAbort()
    currentAbort = null
  }

  // Add user message
  const userMsg: DisplayMessage = {
    id: messageId.value++,
    sender: USER_NAME,
    content: text,
    reasoning: '',
    reasoningCollapsed: false,
    time: formatCurrentTime(),
    isMe: true,
    avatar: meAvatar,
  }
  messages.value.push(userMsg)
  messageText.value = ''
  scrollToBottom()

  // Start thinking
  isThinking.value = true
  isOnline.value = true

  // Create AI message placeholder (will be updated as stream comes in)
  const aiMsg: DisplayMessage = {
    id: messageId.value++,
    sender: BOT_NAME,
    content: '',
    reasoning: '',
    reasoningCollapsed: false,
    time: formatCurrentTime(),
    isMe: false,
    avatar: aiAvatar,
    toolCalls: [],
  }
  messages.value.push(aiMsg)
  scrollToBottom()

  try {
    const { abort, stream } = await connectChatStream(
      text,
      conversationId.value || undefined,
    )

    currentAbort = abort

    const reader = stream.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      let currentEvent = ''
      for (const line of lines) {
        if (line.startsWith('event: ')) {
          currentEvent = line.slice(7).trim()
        } else if (line.startsWith('data: ')) {
          const dataStr = line.slice(6)
          try {
            const data = JSON.parse(dataStr)
            handleSSEEvent(currentEvent, data, aiMsg)
          } catch {
            // ignore parse errors
          }
        }
      }
    }

    if (!aiMsg.content && !aiMsg.reasoning && !aiMsg.toolCalls?.length) {
      aiMsg.content = '收到响应，但内容为空。'
    }
  } catch (e: any) {
    if (e.name !== 'AbortError') {
      aiMsg.content = `抱歉，连接出现问题：${e.message || '未知错误'}`
      isOnline.value = false
    } else {
      aiMsg.content = aiMsg.content || '(已取消)'
    }
  } finally {
    isThinking.value = false
    currentAbort = null
    scrollToBottom()
  }
}

const handleSSEEvent = (event: string, data: any, aiMsg: DisplayMessage) => {
  switch (event) {
    case 'meta':
      if (data.conversationId) conversationId.value = data.conversationId
      break

    case 'text-delta':
      aiMsg.content += data.content || ''
      scrollToBottom()
      break

    case 'reasoning-delta':
      if (data.content) {
        aiMsg.reasoning += data.content
        scrollToBottom()
      }
      break

    case 'tool-call': {
      if (!aiMsg.toolCalls) aiMsg.toolCalls = []
      aiMsg.toolCalls.push({
        id: data.toolCallId || `${data.toolName}-${Date.now()}`,
        name: data.toolName,
        status: 'running',
      })
      scrollToBottom()
      break
    }

    case 'tool-result': {
      if (aiMsg.toolCalls) {
        const tool = aiMsg.toolCalls.find(
          (t) => t.name === data.toolName && t.status === 'running',
        )
        if (tool) {
          tool.status = 'done'
          tool.result = typeof data.result === 'string' ? data.result : JSON.stringify(data.result)
        }
      }
      scrollToBottom()
      break
    }

    case 'error':
      aiMsg.content += `\n\n❌ ${data.message || '处理错误'}`
      scrollToBottom()
      break

    case 'done':
    case 'step-finish':
      break
  }
}

const newConversation = (): void => {
  if (isThinking.value && currentAbort) {
    currentAbort()
    currentAbort = null
  }
  messages.value = []
  conversationId.value = null
  isThinking.value = false
}

// ============== Drawer Control ==============

const openChat = (): void => {
  isDrawerVisible.value = true
  scrollToBottom()
}

const closeChat = (): void => {
  isDrawerVisible.value = false
}

// ============== Lifecycle ==============

onMounted(() => {
  scrollToBottom()
  mittBus.on('openChat', openChat)
})

onUnmounted(() => {
  mittBus.off('openChat', openChat)
  if (currentAbort) {
    currentAbort()
    currentAbort = null
  }
})
</script>

<style scoped>
.thinking-dots::after {
  content: '';
  animation: dots 1.5s steps(3, end) infinite;
}

@keyframes dots {
  0% { content: ''; }
  33% { content: '.'; }
  66% { content: '..'; }
  100% { content: '...'; }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

.transition-transform {
  transition: transform 0.2s ease;
}

.rotate-180 {
  transform: rotate(180deg);
}
</style>
