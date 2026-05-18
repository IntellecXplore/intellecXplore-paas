import type { PgTable } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

/**
 * 清理测试数据——清空指定表的所有行。
 * 在 TEST_MODE 下使用，每次测试后调用以确保隔离。
 */
export async function cleanTable(pg: any, table: PgTable): Promise<void> {
  await pg.delete(table)
}

/**
 * 清空测试数据库中所有业务表（保留 schema）。
 * 需要 pg 实例和 schema 对象。
 */
export async function cleanAllTables(pg: any, schemas: PgTable[]): Promise<void> {
  for (const schema of schemas) {
    await pg.delete(schema)
  }
}

/**
 * 在测试事务中执行回调，自动回滚。
 * 比 cleanTable 更轻量——不需要手动清理。
 *
 * 用法：
 *   await withTestTransaction(pg, async (tx) => {
 *     // 在事务中操作
 *   })
 *
 * 注意：drizzle + postgres-js 的事务 API 取决于项目封装。
 * 此处提供签名参考，具体实现需对接 @/core/database/transaction。
 */
export async function withTestTransaction(
  pg: any,
  fn: (tx: any) => Promise<void>
): Promise<void> {
  await pg.transaction(async (tx: any) => {
    await fn(tx)
  })
}

/**
 * 种子数据：插入测试所需的基础行。
 * 各测试模块自行调用。
 */
export async function seedData(
  pg: any,
  table: PgTable,
  rows: Record<string, any>[]
): Promise<void> {
  if (rows.length === 0) return
  await pg.insert(table).values(rows)
}
