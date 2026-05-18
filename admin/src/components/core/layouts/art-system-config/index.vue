<!-- 系统配置弹窗 -->
<template>
  <ElDialog v-model="visible" title="系统配置" width="560px" align-center :close-on-click-modal="false" @closed="handleClosed">
    <ElTabs v-model="activeTab">
      <!-- 智能体配置 -->
      <ElTabPane label="智能体配置" name="agent">
        <ElForm ref="formRef" :model="form" :rules="rules" label-width="120px" :disabled="saving">
          <ElFormItem label="LLM 提供商" prop="provider">
            <ElSelect v-model="form.provider" placeholder="选择提供商">
              <ElOption label="OpenAI 兼容" value="openai" />
              <ElOption label="Anthropic" value="anthropic" />
            </ElSelect>
          </ElFormItem>

          <ElFormItem label="API 密钥" prop="apiKey">
            <ElInput v-model="form.apiKey" type="password" show-password placeholder="留空则使用环境变量 AGENT_API_KEY" />
          </ElFormItem>

          <ElFormItem label="API 地址" prop="apiBase">
            <ElInput v-model="form.apiBase" placeholder="https://api.deepseek.com/v1" />
          </ElFormItem>

          <ElFormItem label="模型名称" prop="model">
            <ElInput v-model="form.model" placeholder="deepseek-chat" />
          </ElFormItem>

          <ElFormItem label="最大 Token 数" prop="maxTokens">
            <ElInputNumber v-model="form.maxTokens" :min="256" :max="128000" :step="256" class="!w-[200px]" />
          </ElFormItem>

          <ElFormItem label="最大工具轮次" prop="maxToolRounds">
            <ElInputNumber v-model="form.maxToolRounds" :min="1" :max="20" class="!w-[200px]" />
          </ElFormItem>

          <ElFormItem label="会话过期时间(秒)" prop="conversationTTL">
            <ElInputNumber v-model="form.conversationTTL" :min="3600" :max="604800" :step="3600" class="!w-[200px]" />
            <span class="text-xs text-g-500 ml-2">默认 86400 秒 (24小时)</span>
          </ElFormItem>

          <ElFormItem label="启用状态" prop="status">
            <ElSwitch v-model="form.status" active-text="启用" inactive-text="停用" />
          </ElFormItem>
        </ElForm>
      </ElTabPane>
    </ElTabs>

    <template #footer>
      <ElButton @click="visible = false">取消</ElButton>
      <ElButton type="primary" :loading="saving" @click="handleSave">保存配置</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
import { mittBus } from '@/utils/sys'
import { fetchGetAgentConfig, fetchSaveAgentConfig } from '@/api/system/agent-config'
import type { FormInstance, FormRules } from 'element-plus'

defineOptions({ name: 'ArtSystemConfig' })

// ============== State ==============

const visible = ref(false)
const activeTab = ref('agent')
const saving = ref(false)
const loading = ref(false)
const formRef = ref<FormInstance>()

const form = reactive<Api.SystemAgentConfig.ConfigData>({
  provider: 'openai',
  apiKey: '',
  apiBase: 'https://api.deepseek.com',
  model: 'deepseek-v4-pro',
  maxTokens: 4096,
  maxToolRounds: 5,
  conversationTTL: 86400,
  status: true,
})

const rules: FormRules = {
  provider: [{ required: true, message: '请选择提供商', trigger: 'change' }],
  apiBase: [{ required: true, message: '请输入 API 地址', trigger: 'blur' }],
  model: [{ required: true, message: '请输入模型名称', trigger: 'blur' }],
  maxTokens: [{ required: true, message: '请输入最大 Token 数', trigger: 'blur' }],
  maxToolRounds: [{ required: true, message: '请输入最大工具轮次', trigger: 'blur' }],
  conversationTTL: [{ required: true, message: '请输入会话过期时间', trigger: 'blur' }],
}

// ============== Actions ==============

const loadConfig = async () => {
  loading.value = true
  try {
    const data = await fetchGetAgentConfig()
    if (data) {
      Object.assign(form, data)
    }
  } catch {
    // 获取失败使用默认值
  } finally {
    loading.value = false
  }
}

const handleSave = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  saving.value = true
  try {
    await fetchSaveAgentConfig({
      provider: form.provider,
      apiKey: form.apiKey || '',
      apiBase: form.apiBase,
      model: form.model,
      maxTokens: form.maxTokens,
      maxToolRounds: form.maxToolRounds,
      conversationTTL: form.conversationTTL,
      status: form.status,
    })
    visible.value = false
  } catch {
    // error handled by API layer
  } finally {
    saving.value = false
  }
}

const handleClosed = () => {
  activeTab.value = 'agent'
}

// ============== Lifecycle ==============

const openDialog = () => {
  visible.value = true
  loadConfig()
}

onMounted(() => {
  mittBus.on('openSystemConfig', openDialog)
})

onUnmounted(() => {
  mittBus.off('openSystemConfig', openDialog)
})
</script>
