/**
 * 统一日志工具
 * 提供格式化的日志输出，支持不同级别
 */
import { Context } from 'elysia';
import { LogLevel } from "@/constants/enum";
import Colors from "@/shared/color";

class Logger {
    private formatMessage(level: LogLevel, message: string, meta?: Record<string, any>): string {
        const timestamp = new Date().toISOString();
        const metaStr = meta ? `\n${JSON.stringify(meta, null, 2)}` : '';
        return `${Colors.gray}[${timestamp}]${Colors.reset} [${level}] ${message}${metaStr}`;
    }

    info(message: string, meta?: Record<string, any>): void {
        console.log(`${Colors.blue}${this.formatMessage(LogLevel.INFO, message, meta)}${Colors.reset}`);
    }

    success(message: string): void {
        console.log(`${Colors.green}${message}${Colors.reset}`);
    }

    warn(message: string, meta?: Record<string, any>): void {
        console.warn(`${Colors.yellow}${this.formatMessage(LogLevel.WARN, message, meta)}${Colors.reset}`);
    }

    error(message: string, meta?: Record<string, any>): void {
        console.error(`${Colors.red}${this.formatMessage(LogLevel.ERROR, message, meta)}${Colors.reset}`);
    }

    debug(message: string, meta?: Record<string, any>): void {
        console.debug(`${Colors.gray}${this.formatMessage(LogLevel.DEBUG, message, meta)}${Colors.reset}`);
    }

    /**
     * 打印分组标题
     */
    group(title: string): void {
        console.log(`\n${Colors.cyan}${'─'.repeat(60)}`);
        console.log(`  ${title}`);
        console.log(`${'─'.repeat(60)}${Colors.reset}`);
    };

    /**
     * 打印应用启动信息
     */
    logStartup(config: {
        appId: string;
        port: number | string;
        prefix: string;
        env: string;
        pid: number;
        openApiEnabled?: boolean;
        bunVersion?: string;
    }): void {
        const { appId, port, prefix, env, pid, openApiEnabled, bunVersion } = config;
        const baseUrl = `http://localhost:${port}${prefix}`;
        console.log('\n' + '='.repeat(60));
        console.log(`🚀 ${appId} 启动成功`);
        console.log('='.repeat(60) + Colors.reset);
        console.log(`${Colors.bright}服务地址:${Colors.reset}     ${Colors.cyan}${baseUrl}${Colors.reset}`);
        console.log(`${Colors.bright}BullMQ UI:${Colors.reset}    ${Colors.cyan}${baseUrl}/bullmq${Colors.reset}`);
        if (openApiEnabled) {
            console.log(`${Colors.bright}API文档:${Colors.reset}      ${Colors.cyan}${baseUrl}/openapi${Colors.reset}`);
            console.log(`${Colors.bright}OpenAPI JSON:${Colors.reset} ${Colors.cyan}${baseUrl}/openapi/json${Colors.reset}`);
        };
        console.log(`${Colors.bright}启动时间:${Colors.reset}     ${new Date().toLocaleString('zh-CN')}`);
        console.log(`${Colors.bright}运行环境:${Colors.reset}     ${env === 'production' ? Colors.red : Colors.yellow}${env}${Colors.reset}`);
        console.log(`${Colors.bright}Bun版本:${Colors.reset}      ${bunVersion || 'N/A'}`);
        console.log(`${Colors.bright}进程ID:${Colors.reset}       ${pid}`);
        console.log('='.repeat(60) + Colors.reset + '\n');
    }

    /**
     * 请求日志信息
     */
    private static readonly METHOD_COLORS: Record<string, string> = {
        POST: Colors.green,
        PUT: Colors.yellow,
        DELETE: Colors.red,
        PATCH: Colors.magenta,
    };

    logRequest(ctx: Context) {
        const { path, request, startTime, response, set } = ctx as any;
        const duration = Date.now() - startTime;
        const method = request.method;
        const code = response?.code || set?.status || 500;

        const statusColor = code >= 500 ? Colors.red : code >= 400 ? Colors.yellow : code >= 300 ? Colors.cyan : Colors.green;
        const methodColor = Logger.METHOD_COLORS[method] || Colors.blue;
        const durationColor = duration > 1000 ? Colors.red : duration > 500 ? Colors.yellow : Colors.green;

        this.debug(
            `${methodColor}${method.padEnd(7)}${Colors.reset} ` +
            `${statusColor}${code}${Colors.reset} ` +
            `${Colors.bright}${path}${Colors.reset} ` +
            `${durationColor}${duration}ms${Colors.reset}`
        );
    }
}

export const logger = new Logger();