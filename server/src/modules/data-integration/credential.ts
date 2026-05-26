import crypto from 'node:crypto';
import config from '@/config';
import { logger } from '@/shared/logger';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

/** 从 JWT AccessToken secret 派生 32 字节加密密钥（开发环境），生产应使用 ENCRYPTION_KEY 环境变量 */
function deriveKey(): Buffer {
    const envKey = process.env.INTEGRATION_ENCRYPTION_KEY;
    if (envKey) {
        const buf = Buffer.from(envKey, 'hex');
        if (buf.length === 32) return buf;
        logger.warn('[credential] INTEGRATION_ENCRYPTION_KEY length invalid, falling back to derived key');
    }
    return crypto.scryptSync(config.jwt.accessToken.secret, 'integration-salt', 32);
}

/** 加密敏感凭证字段 */
export function encrypt(plaintext: string): string {
    const key = deriveKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return Buffer.concat([iv, authTag, encrypted]).toString('base64');
}

/** 解密敏感凭证字段 */
export function decrypt(encoded: string): string {
    const key = deriveKey();
    const buf = Buffer.from(encoded, 'base64');
    const iv = buf.subarray(0, IV_LENGTH);
    const authTag = buf.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = buf.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

/** 加密连接配置中的敏感字段 */
export function encryptConnectionConfig(config: Record<string, any>): Record<string, any> {
    const sensitiveKeys = ['appSecret', 'password'];
    const encrypted = { ...config };
    for (const key of sensitiveKeys) {
        if (encrypted[key] && typeof encrypted[key] === 'string') {
            encrypted[key] = encrypt(encrypted[key]);
        }
    }
    return encrypted;
}

/** 解密连接配置中的敏感字段 */
export function decryptConnectionConfig(config: Record<string, any>): Record<string, any> {
    const sensitiveKeys = ['appSecret', 'password'];
    const decrypted = { ...config };
    for (const key of sensitiveKeys) {
        if (decrypted[key] && typeof decrypted[key] === 'string') {
            try {
                decrypted[key] = decrypt(decrypted[key]);
            } catch {
                // 可能是明文（升级前数据），保持原值
            }
        }
    }
    return decrypted;
}
