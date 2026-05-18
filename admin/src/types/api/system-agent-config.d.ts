declare namespace Api {
    namespace SystemAgentConfig {
        interface ConfigData {
            configId?: number
            userId?: number
            provider: string
            apiKey: string
            apiBase: string
            model: string
            maxTokens: number
            maxToolRounds: number
            conversationTTL: number
            status: boolean
        }

        type SaveConfigParams = Partial<Omit<ConfigData, 'configId' | 'userId'>>
    }
}
