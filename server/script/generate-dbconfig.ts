import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import config from "@/config";
import { logger } from '@/shared/logger';

const type = Bun.argv[2] as 'push' | 'pull';
const { pg } = config;

const sslValue = !pg.ssl || pg.host === 'localhost' || pg.host === '127.0.0.1'
    ? 'false'
    : 'true';

const drizzleConfig = `// 该文件自动生成，请勿手动修改
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    out: './database/drizzle',
    schema: './database/schema/*.ts',
    dialect: 'postgresql',
    dbCredentials: {
        host: "${pg.host}",
        port: ${pg.port},
        user: "${pg.user}",
        password: "${pg.password}",
        database: "${pg.database}",
        ssl: ${sslValue},
    }
});`;
const serverRoot = join(__dirname, '..');
writeFileSync(join(serverRoot, 'drizzle.config.ts'), drizzleConfig, 'utf-8');

logger.info(`数据库连接: ${pg.user}@${pg.host}:${pg.port}/${pg.database}, ssl=${sslValue}`);

const result = Bun.spawnSync(['bun', 'drizzle-kit', type], {
    cwd: serverRoot,
    stdio: ['inherit', 'pipe', 'pipe'],
});

if (result.exitCode !== 0) {
    const stderr = new TextDecoder().decode(result.stderr);
    const stdout = new TextDecoder().decode(result.stdout);
    if (stdout) logger.error(`drizzle-kit stdout:\n${stdout}`);
    if (stderr) logger.error(`drizzle-kit stderr:\n${stderr}`);
    if (!stdout && !stderr) {
        logger.error('数据库迁移失败：请确认 PostgreSQL 服务已启动，且数据库名和密码正确');
        logger.error(`当前连接: ${pg.user}@${pg.host}:${pg.port}/${pg.database}`);
    }
    process.exit(1);
}
logger.info('✓ 数据库迁移完成');