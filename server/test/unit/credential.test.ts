import { describe, expect, it } from 'bun:test';
import { encrypt, decrypt, encryptConnectionConfig, decryptConnectionConfig } from '@/modules/data-integration/credential';

describe('credential encrypt/decrypt', () => {
    it('should roundtrip a plaintext string', () => {
        const original = 'my-secret-api-key-12345';
        const encrypted = encrypt(original);
        expect(encrypted).not.toBe(original);
        expect(encrypted.length).toBeGreaterThan(0);

        const decrypted = decrypt(encrypted);
        expect(decrypted).toBe(original);
    });

    it('should produce different ciphertext for same plaintext', () => {
        const original = 'same-password';
        const a = encrypt(original);
        const b = encrypt(original);
        expect(a).not.toBe(b); // 不同 IV 产生不同密文
    });

    it('should encrypt and decrypt empty string', () => {
        const encrypted = encrypt('');
        expect(encrypted.length).toBeGreaterThan(0);
        expect(decrypt(encrypted)).toBe('');
    });

    it('should encrypt and decrypt unicode strings', () => {
        const original = '中文密码_テスト_한국어';
        const encrypted = encrypt(original);
        expect(decrypt(encrypted)).toBe(original);
    });

    it('should encrypt and decrypt long strings', () => {
        const original = 'x'.repeat(1000);
        const encrypted = encrypt(original);
        expect(decrypt(encrypted)).toBe(original);
    });
});

describe('encryptConnectionConfig', () => {
    it('should encrypt sensitive fields (appSecret, password)', () => {
        const config = {
            host: '192.168.1.1',
            port: 8080,
            appSecret: 'my-secret',
            password: 'db-password',
            appId: 'my-app',
        };
        const encrypted = encryptConnectionConfig(config);

        // 敏感字段被加密
        expect(encrypted.appSecret).not.toBe('my-secret');
        expect(encrypted.password).not.toBe('db-password');

        // 非敏感字段不变
        expect(encrypted.host).toBe('192.168.1.1');
        expect(encrypted.port).toBe(8080);
        expect(encrypted.appId).toBe('my-app');
    });

    it('should not encrypt missing sensitive fields', () => {
        const config = { host: 'localhost', appId: 'app1' };
        const encrypted = encryptConnectionConfig(config);
        expect(encrypted.host).toBe('localhost');
        expect(encrypted.appId).toBe('app1');
        expect(encrypted.appSecret).toBeUndefined();
    });
});

describe('decryptConnectionConfig', () => {
    it('should roundtrip full config', () => {
        const original = {
            baseUrl: 'https://api.example.com',
            appId: 'my-app',
            appSecret: 'super-secret-key',
            password: 'p@ssw0rd!',
            accountId: 'acc-123',
        };
        const encrypted = encryptConnectionConfig(original);
        const decrypted = decryptConnectionConfig(encrypted);

        expect(decrypted.baseUrl).toBe(original.baseUrl);
        expect(decrypted.appId).toBe(original.appId);
        expect(decrypted.appSecret).toBe(original.appSecret);
        expect(decrypted.password).toBe(original.password);
        expect(decrypted.accountId).toBe(original.accountId);
    });

    it('should keep plaintext values unchanged (backward compat)', () => {
        const config = {
            appSecret: 'plaintext-not-encrypted',
            appId: 'my-app',
        };
        const decrypted = decryptConnectionConfig(config);
        // 不会崩溃，保持原值
        expect(decrypted.appSecret).toBe('plaintext-not-encrypted');
        expect(decrypted.appId).toBe('my-app');
    });
});
