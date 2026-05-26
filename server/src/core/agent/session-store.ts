import type { ModelMessage } from 'ai';
import { Set, Get, Del, Keys } from '@/core/database/redis';
import { GenerateUUID } from '@/shared/uuid';
import { CacheEnum } from '@/constants/enum';
import config from '@/config';

// ============== Types ==============

export interface Conversation {
    id: string;
    title: string;
    messages: ModelMessage[];
    userId: number;
    createdAt: string;
    updatedAt: string;
}

// ============== Helpers ==============

function conversationKey(id: string) {
    return `${CacheEnum.AGENT_CONVERSATION}${id}`;
}

// ============== CRUD ==============

export async function saveConversation(
    conv: Conversation,
    ttl?: number,
): Promise<void> {
    const effectiveTTL = ttl || config.agent.conversationTTL || 86400;
    await Set(conversationKey(conv.id), conv, effectiveTTL);
}

export async function loadConversation(id: string): Promise<Conversation | null> {
    return Get(conversationKey(id));
}

export async function deleteConversationById(id: string): Promise<boolean> {
    return Del(conversationKey(id));
}

export async function listConversationIds(
    pageNum: number,
    pageSize: number,
): Promise<{ ids: string[]; total: number }> {
    const prefix = conversationKey('');
    const allKeys = await Keys(prefix);
    const sorted = allKeys.sort((a, b) => b.localeCompare(a));
    const total = sorted.length;
    const start = (pageNum - 1) * pageSize;
    const pageKeys = sorted.slice(start, start + pageSize);
    const ids = pageKeys.map((k) => k.replace(prefix, ''));
    return { ids, total };
}

export function createConversation(title: string, userId: number = 0): Conversation {
    return {
        id: GenerateUUID(),
        title: title.slice(0, 30),
        messages: [],
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
}
