import { Context } from 'elysia';
import { logger } from '@/shared/logger';
import config from '@/config';
import type { IClientType, IClientPlatform } from '@/types/common';

/**
 * 检查 IP 是否为私有、回环或本地链路地址（支持 IPv4 和 IPv6）
 * @param ip IP 地址字符串
 * @returns 是否为非公网地址
 */
export function IsPrivateIp(ip: string): boolean {
    if (typeof ip !== 'string') return false;
    // --- IPv4 ---
    if (ip.includes('.')) {
        if (ip.startsWith('127.')) return true;
        if (ip.startsWith('10.')) return true;
        if (ip.startsWith('192.168.')) return true;
        if (ip.startsWith('172.')) {
            const parts = ip.split('.');
            if (parts.length === 4) {
                const second = parseInt(parts[1], 10);
                if (!isNaN(second) && second >= 16 && second <= 31) return true;
            };
        };
        return false;
    };
    // --- IPv6 ---
    const lower = ip.toLowerCase();
    if (lower === '::1' || lower.startsWith('::1:')) return true;
    if (lower.startsWith('fe80:')) return true;
    if (lower.startsWith('fc') || lower.startsWith('fd')) {
        return true;
    };
    if (lower.startsWith('::ffff:')) {
        const ipv4 = lower.substring(7);
        return IsPrivateIp(ipv4);
    };
    return false;
};

/**
 * 标准化 IP 地址
 * @param ip IP 地址
 * @returns 
 */
export function NormalizeIp(ip: string) {
    if (typeof ip !== 'string' || ip.length === 0) return '127.0.0.1';
    if (ip?.startsWith('::ffff:')) return ip.replace('::ffff:', '');
    if (ip === '::1') return '127.0.0.1'
    return ip;
};

/**
 * 将 IP 地址转换为整数
 * @param ip IP 地址
 * @returns 整数
 */
function ipv4ToInt(ip: string): number | null {
    const parts = ip.split('.');
    if (parts.length !== 4) return null;
    let n = 0;
    for (const p of parts) {
        const v = Number(p);
        if (!Number.isInteger(v) || v < 0 || v > 255) return null;
        n = (n << 8) | v;
    };
    return n >>> 0;
};

/**
 * 检查 IP 地址是否在 CIDR 范围内
 * @param ip IP 地址
 * @param cidr CIDR 地址
 * @returns 是否在 CIDR 范围内
 */
function ipv4InCidr(ip: string, cidr: string): boolean {
    const [base, bitsStr] = cidr.split('/');
    const bits = Number(bitsStr);
    if (!Number.isFinite(bits) || bits < 0 || bits > 32) return false;
    const ipInt = ipv4ToInt(ip.trim());
    const baseInt = ipv4ToInt(base.trim());
    if (ipInt === null || baseInt === null) return false;
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
    return (ipInt & mask) === (baseInt & mask);
};

/**
 * 检查直接 IP 地址是否在 CIDR 范围内
 * @param directIp 直接 IP 地址
 * @param cidrs CIDR 地址列表
 * @returns 是否在 CIDR 范围内
 */
function directIpMatchesTrustedList(directIp: string, cidrs: string[]): boolean {
    const norm = NormalizeIp(directIp);
    for (const raw of cidrs) {
        const c = raw.trim();
        if (!c) continue;
        if (c.includes('/')) {
            if (norm.includes('.') && ipv4InCidr(norm, c)) return true;
        } else if (norm === NormalizeIp(c)) return true;
    };
    return false;
};

/**
 * 读取转发客户端 IP 地址
 * @param request 请求对象
 * @returns 转发客户端 IP 地址
 */
function readForwardedClientIp(request: Request): string | null {
    const xff = request.headers.get('x-forwarded-for');
    if (xff) {
        const first = xff.split(',')[0].trim();
        if (first) return NormalizeIp(first);
    };
    const xReal = request.headers.get('x-real-ip');
    if (xReal?.trim()) return NormalizeIp(xReal.trim());
    return null;
};

/**
 * 获取是否信任代理
 * @returns 是否信任代理
 */
function getTrustProxy(): boolean {
    const e = process.env.TRUST_PROXY;
    if (e === 'true') return true;
    if (e === 'false') return false;
    return !!config.app.trustProxy;
};

/**
 * 获取可信任的 CIDR 地址列表
 * @returns 可信任的 CIDR 地址列表
 */
function getTrustedCidrs(): string[] {
    const raw = process.env.TRUSTED_PROXY_CIDRS;
    if (raw?.trim()) return raw.split(',').map(s => s.trim()).filter(Boolean);
    return config.app.trustedProxyCidrs ?? [];
};

/**
 * 获取客户端 IP 地址
 * @param request 请求对象
 * @param server 服务器对象
 * @returns 客户端 IP 地址
 */
export function GetClientIp(ctx: Context) {
    const request = ctx?.request;
    const user = (ctx as any).user;
    if (user?.ipaddr) return user.ipaddr;
    const ctxIp = (ctx as any)?.ip;
    if (ctxIp) return ctxIp;
    const server = ctx?.server;
    const direct = server?.requestIP(request)?.address;
    const directNorm = direct ? NormalizeIp(direct) : '未知';
    const trust = getTrustProxy();
    const cidrs = getTrustedCidrs();
    if (!trust || !cidrs.length || !direct || !directIpMatchesTrustedList(directNorm, cidrs)) {
        return directNorm;
    };
    const fromHeaders = readForwardedClientIp(request);
    return fromHeaders || directNorm;
};

/**
 * 查询 IP 地址的地区信息
 * @param ip IP 地址
 * @returns IP 地址的地区信息
 */
export async function GetIpLocation(ip: string): Promise<string> {
    try {
        if (!ip || ip === '未知') return '未知';
        if (IsPrivateIp(ip)) return '内网地址';
        const ms = config.app.geoIpTimeoutMs > 0 ? config.app.geoIpTimeoutMs : 1500;
        const response = await fetch(`https://ipinfo.io/${encodeURIComponent(ip)}/json`, {
            signal: AbortSignal.timeout(ms),
        });
        if (!response.ok) return '未知';
        const data = await response.json();
        const loc = `${data?.region || ''} ${data?.city || ''}`.trim();
        return loc || '未知';
    } catch (error) {
        logger.error('查询 IP 地址地区信息失败:' + error);
        return '未知';
    }
};

/**
 * 获取客户端类型
 * @param userAgent 用户代理
 * @returns 客户端类型
 */
export function GetClientType(userAgent: string): IClientType {
    if (!userAgent) return 'unknown';
    const ua = userAgent.toLowerCase();
    // 小程序检测（优先级最高）
    if (ua.includes('miniprogram') ||
        (ua.includes('micromessenger') && ua.includes('miniprogram')) ||
        ua.includes('swan') || // 百度小程序
        ua.includes('toutiaomicroapp') || // 字节小程序
        (ua.includes('alipay') && ua.includes('miniprogram'))) {
        return 'miniapp';
    };
    // 桌面应用检测
    if (ua.includes('electron') || ua.includes('nwjs') || ua.includes('tauri')) {
        return 'desktop';
    };
    // 移动应用检测（需要排除浏览器）
    if ((ua.includes('android') || ua.includes('iphone') || ua.includes('ipad')) &&
        !ua.includes('safari') &&
        !ua.includes('chrome') &&
        !ua.includes('firefox') &&
        !ua.includes('edge') &&
        !ua.includes('micromessenger')) {
        return 'app';
    };
    // Web 浏览器检测
    if (ua.includes('mozilla') || ua.includes('chrome') || ua.includes('safari') ||
        ua.includes('firefox') || ua.includes('edge') || ua.includes('opera')) {
        return 'web';
    };
    return 'unknown';
};

/**
 * 获取应用生态平台（优先级排序的规则数组，避免平铺 if 链）
 * @param userAgent 用户代理
 * @returns 应用生态平台
 */

interface PlatformRule {
    patterns: string[];
    platform: IClientPlatform;
    /** 可选的额外匹配条件（如 safari 需排除 android） */
    extra?: (ua: string) => boolean;
}

const PLATFORM_RULES: PlatformRule[] = [
    // 社交/内容平台
    { patterns: ['micromessenger'], platform: 'wechat' },
    { patterns: ['aweme', 'douyin', 'toutiao'], platform: 'douyin' },
    { patterns: ['weibo', '__weibo__'], platform: 'weibo' },
    { patterns: ['xiaohongshu', 'xhsdiscover'], platform: 'xiaohongshu' },
    // 电商平台
    { patterns: ['alipay', 'aliapp'], platform: 'alipay' },
    { patterns: ['taobao', 'aliapp(tb'], platform: 'taobao' },
    { patterns: ['jdapp', 'jdpingou'], platform: 'jd' },
    { patterns: ['pinduoduo', 'pddapp'], platform: 'pinduoduo' },
    // 搜索/信息平台
    { patterns: ['baiduboxapp', 'baidubrowser'], platform: 'baidu' },
    // 国产浏览器
    { patterns: ['ucbrowser', 'ucweb'], platform: 'uc' },
    { patterns: ['mqqbrowser', 'tencenttraveler'], platform: 'qq-browser' },
    { patterns: ['quark'], platform: 'quark' },
    { patterns: ['metasr', 'sogou'], platform: 'sogou' },
    { patterns: ['360', 'qihu', 'qhbrowser'], platform: '360-browser' },
    { patterns: ['qq/', 'qzone'], platform: 'qq' },
    // 国际浏览器（优先级顺序处理了 Edge > Chrome 的包含关系）
    { patterns: ['edg/', 'edge/'], platform: 'edge' },
    { patterns: ['chrome/'], platform: 'chrome' },
    { patterns: ['safari/'], platform: 'safari', extra: (ua) => !ua.includes('android') },
    { patterns: ['firefox/'], platform: 'firefox' },
    { patterns: ['opr/', 'opera/'], platform: 'opera' },
    // 原生应用（无浏览器特征的移动端）
    { patterns: [], platform: 'native', extra: (ua) =>
        (ua.includes('android') || ua.includes('iphone') || ua.includes('ipad')) &&
        !ua.includes('safari') &&
        !ua.includes('chrome') &&
        !ua.includes('firefox') &&
        !ua.includes('edge')
    },
];

export function GetClientPlatform(userAgent: string): IClientPlatform {
    if (!userAgent) return 'unknown';
    const ua = userAgent.toLowerCase();
    for (const rule of PLATFORM_RULES) {
        const matched = rule.patterns.length === 0
            ? rule.extra?.(ua)
            : rule.patterns.some(p => ua.includes(p)) && (!rule.extra || rule.extra(ua));
        if (matched) return rule.platform;
    }
    return 'unknown';
};

/**
 * 获取操作系统（规则数组 + 版本提取函数，避免平铺 25+ if 链）
 * @param userAgent 用户代理
 * @returns 操作系统
 */

const WINDOWS_VERSION_RULES: Array<{ pattern: string; label: string }> = [
    { pattern: 'windows nt 10.0', label: 'Windows 10/11' },
    { pattern: 'windows nt 6.3', label: 'Windows 8.1' },
    { pattern: 'windows nt 6.2', label: 'Windows 8' },
    { pattern: 'windows nt 6.1', label: 'Windows 7' },
    { pattern: 'windows nt 6.0', label: 'Windows Vista' },
    { pattern: 'windows nt 5.2', label: 'Windows Server 2003' },
    { pattern: 'windows nt 5.1', label: 'Windows XP' },
    { pattern: 'windows nt 5.0', label: 'Windows 2000' },
];

const LINUX_DISTRO_RULES: Array<{ pattern: string; label: string }> = [
    { pattern: 'uos', label: '统信 UOS' },
    { pattern: 'uniontech', label: '统信 UOS' },
    { pattern: 'kylin', label: '银河麒麟' },
    { pattern: 'deepin', label: '深度 Deepin' },
    { pattern: 'newstart', label: '中兴新支点' },
    { pattern: 'redflag', label: '红旗 Linux' },
    { pattern: 'ubuntu', label: 'Ubuntu' },
    { pattern: 'debian', label: 'Debian' },
    { pattern: 'fedora', label: 'Fedora' },
    { pattern: 'centos', label: 'CentOS' },
    { pattern: 'arch', label: 'Arch Linux' },
    { pattern: 'manjaro', label: 'Manjaro' },
    { pattern: 'mint', label: 'Linux Mint' },
];

const MACOS_VERSION_NAMES: Record<string, string> = {
    '10.15': 'Catalina',
    '10.14': 'Mojave',
    '10.13': 'High Sierra',
    '10.12': 'Sierra',
    '11': 'Big Sur',
    '12': 'Monterey',
    '13': 'Ventura',
    '14': 'Sonoma',
    '15': 'Sequoia',
};

/** 每个规则返回 OS 字符串或 null 表示不匹配，继续下一个规则 */
type OsExtractor = (ua: string) => string | null;

function extractHarmonyOS(ua: string): string | null {
    if (!ua.includes('harmonyos') && !ua.includes('hongmeng')) return null;
    const match = ua.match(/harmonyos[\/\s]?(\d+(?:\.\d+)?)/);
    return match ? `HarmonyOS ${match[1]}` : 'HarmonyOS';
}

function extractWindows(ua: string): string | null {
    for (const rule of WINDOWS_VERSION_RULES) {
        if (ua.includes(rule.pattern)) return rule.label;
    }
    if (ua.includes('windows')) return 'Windows';
    return null;
}

function extractMacOS(ua: string): string | null {
    if (!ua.includes('mac os x') && !ua.includes('macintosh')) return null;
    const match = ua.match(/mac os x (\d+)[._](\d+)(?:[._](\d+))?/);
    if (match) {
        const major = match[1];
        const minor = match[2];
        const versionKey = major === '10' ? `${major}.${minor}` : major;
        const versionName = MACOS_VERSION_NAMES[versionKey];
        return versionName ? `macOS ${versionName}` : `macOS ${major}.${minor}`;
    }
    return 'macOS';
}

function extractIOS(ua: string): string | null {
    if (!ua.includes('iphone') && !ua.includes('ipad') && !ua.includes('ipod')) return null;
    const match = ua.match(/os (\d+)[._](\d+)(?:[._](\d+))?/);
    return match ? `iOS ${match[1]}.${match[2]}` : 'iOS';
}

function extractAndroid(ua: string): string | null {
    if (!ua.includes('android')) return null;
    const match = ua.match(/android (\d+(?:\.\d+)?(?:\.\d+)?)/);
    return match ? `Android ${match[1]}` : 'Android';
}

function extractChromeOS(ua: string): string | null {
    if (!ua.includes('cros') && !ua.includes('chromeos')) return null;
    const match = ua.match(/cros[\/\s][\w]+\s(\d+(?:\.\d+)?)/);
    return match ? `Chrome OS ${match[1]}` : 'Chrome OS';
}

function extractLinux(ua: string): string | null {
    for (const rule of LINUX_DISTRO_RULES) {
        if (ua.includes(rule.pattern)) return rule.label;
    }
    if (ua.includes('linux')) return 'Linux';
    return null;
}

function extractUnixBSD(ua: string): string | null {
    if (ua.includes('unix')) return 'Unix';
    if (ua.includes('bsd')) return 'BSD';
    return null;
}

const OS_RULES: OsExtractor[] = [
    extractHarmonyOS,
    extractWindows,
    extractMacOS,
    extractIOS,
    extractAndroid,
    extractChromeOS,
    extractLinux,
    extractUnixBSD,
];

export function GetClientOs(userAgent: string): string {
    if (!userAgent) return '未知';
    const ua = userAgent.toLowerCase();
    for (const extract of OS_RULES) {
        const result = extract(ua);
        if (result) return result;
    }
    return '未知';
};

/**
 * 获取客户端信息
 * @param ctx 请求上下文
 * @returns 客户端信息
 */
export async function GetClientInfo(ctx: Context): Promise<{
    ipaddr: string;
    userAgent: string;
    loginLocation: string;
    clientType: string;
    clientPlatform: string;
    os: string;
}> {
    const ipaddr = GetClientIp(ctx);
    const userAgent = ctx.headers['user-agent'] || '';
    let loginLocation = '未知';
    try {
        loginLocation = await GetIpLocation(ipaddr);
    } catch (error) {
        logger.error('获取登录地区失败:' + error);
    };
    const clientType = GetClientType(userAgent);
    const clientPlatform = GetClientPlatform(userAgent);
    const os = GetClientOs(userAgent);
    return { ipaddr, userAgent, loginLocation, clientType, clientPlatform, os };
};