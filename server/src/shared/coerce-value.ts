/**
 * 将值转换为目标字段类型的正确格式。
 * @param value 原始值
 * @param fieldType 字段类型（integer / decimal / boolean / json / date / datetime）
 * @param opts.strict 严格模式（默认 true）：非法值抛出错误；false 时返回 null
 */
export function coerceValue(
    value: any,
    fieldType: string,
    opts?: { strict?: boolean },
): any {
    const strict = opts?.strict ?? true;
    const fail = (msg: string) => {
        if (strict) throw new Error(msg);
        return null;
    };

    if (value === null || value === undefined) return null;

    if (fieldType === 'integer') {
        const n = Number(value);
        if (isNaN(n)) return fail(`Invalid integer: ${value}`);
        return n;
    }
    if (fieldType === 'decimal') {
        const n = Number(value);
        if (isNaN(n)) return fail(`Invalid decimal: ${value}`);
        return n;
    }
    if (fieldType === 'boolean') {
        if (value === true || value === 'true' || value === 1 || value === '1') return true;
        if (value === false || value === 'false' || value === 0 || value === '0') return false;
        return fail(`Invalid boolean: ${value}`);
    }
    if (fieldType === 'json') {
        return typeof value === 'string' ? value : JSON.stringify(value);
    }
    if (fieldType === 'date' || fieldType === 'datetime') {
        if (value instanceof Date) return value.toISOString();
        const d = new Date(value);
        if (isNaN(d.getTime())) return fail(`Invalid date: ${value}`);
        return d.toISOString();
    }
    return String(value);
}
