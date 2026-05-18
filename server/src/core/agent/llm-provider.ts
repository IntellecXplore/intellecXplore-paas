import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import type { LanguageModel } from 'ai';

export interface ProviderConfig {
    provider: string;   // 'openai' | 'anthropic'
    apiKey: string;
    apiBase: string;
    model: string;
}

/**
 * 创建 LLM provider 实例。
 * - openai-compatible 路径覆盖 DeepSeek / OpenAI / 任何兼容 API
 * - anthropic 路径走 @ai-sdk/anthropic
 */
export function createProvider(cfg: ProviderConfig): LanguageModel {
    if (cfg.provider === 'anthropic') {
        // 动态导入，避免未安装时崩溃
        const { createAnthropic } = require('@ai-sdk/anthropic');
        const anthropic = createAnthropic({
            apiKey: cfg.apiKey,
            baseURL: cfg.apiBase,
        });
        return anthropic(cfg.model) as LanguageModel;
    }

    // 默认：OpenAI 兼容（DeepSeek 也走这条路）
    const provider = createOpenAICompatible({
        name: 'agent-provider',
        apiKey: cfg.apiKey,
        baseURL: cfg.apiBase,
    });
    return provider(cfg.model) as LanguageModel;
}
