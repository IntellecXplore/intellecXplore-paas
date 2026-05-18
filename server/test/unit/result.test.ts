import { describe, expect, it } from 'bun:test'
import { BaseResultData } from '@/core/result'

describe('BaseResultData', () => {
  describe('ok', () => {
    it('should return code 200 with data', () => {
      const result = BaseResultData.ok({ id: 1, name: 'test' })
      expect(result.code).toBe(200)
      expect(result.data).toEqual({ id: 1, name: 'test' })
      expect(result.msg).toBe('操作成功')
    })

    it('should return null data by default', () => {
      const result = BaseResultData.ok()
      expect(result.code).toBe(200)
      expect(result.data).toBeNull()
    })

    it('should accept custom message', () => {
      const result = BaseResultData.ok({ id: 1 }, '创建成功')
      expect(result.msg).toBe('创建成功')
    })
  })

  describe('fail', () => {
    it('should return specified code with null data', () => {
      const result = BaseResultData.fail(404)
      expect(result.code).toBe(404)
      expect(result.data).toBeNull()
    })

    it('should accept custom error message', () => {
      const result = BaseResultData.fail(400, '参数错误')
      expect(result.code).toBe(400)
      expect(result.msg).toBe('参数错误')
    })

    it('should default to code 500', () => {
      const result = BaseResultData.fail()
      expect(result.code).toBe(500)
    })
  })
})
