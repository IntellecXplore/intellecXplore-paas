import { describe, expect, it } from 'bun:test'
import {
  ListToTree,
  TreeToList,
  SanitizeObject,
  IsStringifiedObjectOrArray,
} from '@/core/function'

describe('ListToTree', () => {
  it('should return empty array for empty list', () => {
    const result = ListToTree([])
    expect(result).toEqual([])
  })

  it('should convert flat list to tree with default options', () => {
    const list = [
      { id: 1, parentId: 0, name: 'Root' },
      { id: 2, parentId: 1, name: 'Child' },
    ]
    const result = ListToTree(list)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Root')
    expect(result[0].children).toHaveLength(1)
    expect(result[0].children[0].name).toBe('Child')
  })

  it('should support custom idKey/parentKey/childrenKey', () => {
    const list = [
      { uid: 'a', pid: null, label: 'Root' },
      { uid: 'b', pid: 'a', label: 'Child' },
    ]
    const result = ListToTree(list, {
      idKey: 'uid',
      parentKey: 'pid',
      childrenKey: 'kids',
      rootValue: null,
    })
    expect(result).toHaveLength(1)
    expect(result[0].label).toBe('Root')
    expect(result[0].kids).toHaveLength(1)
    expect(result[0].kids[0].label).toBe('Child')
  })

  it('should support custom rootValue', () => {
    const list = [
      { id: 10, parentId: -1, name: 'Root' },
    ]
    const result = ListToTree(list, { rootValue: -1 })
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Root')
  })

  it('should handle orphan nodes by placing them at root', () => {
    const list = [
      { id: 1, parentId: 0, name: 'Root' },
      { id: 2, parentId: 99, name: 'Orphan' },
    ]
    const result = ListToTree(list)
    // Root + orphan both at top since parent 99 doesn't exist
    expect(result).toHaveLength(2)
    const names = result.map((n: any) => n.name)
    expect(names).toContain('Orphan')
  })

  it('should sort by sortKey when provided', () => {
    const list = [
      { id: 1, parentId: 0, name: 'B', sort: 2 },
      { id: 2, parentId: 0, name: 'A', sort: 1 },
    ]
    const result = ListToTree(list, { sortKey: 'sort' })
    expect(result[0].name).toBe('A')
    expect(result[1].name).toBe('B')
  })

  it('should sort nested children by sortKey', () => {
    const list = [
      { id: 1, parentId: 0, name: 'Root', sort: 1 },
      { id: 2, parentId: 1, name: 'B-Child', sort: 2 },
      { id: 3, parentId: 1, name: 'A-Child', sort: 1 },
    ]
    const result = ListToTree(list, { sortKey: 'sort' })
    expect(result[0].children[0].name).toBe('A-Child')
    expect(result[0].children[1].name).toBe('B-Child')
  })

  it('should omit specified keys from result', () => {
    const list = [
      { id: 1, parentId: 0, name: 'A', deleted: true, _internal: 'x' },
    ]
    const result = ListToTree(list, { omitKeys: ['deleted', '_internal'] })
    expect(result[0]).not.toHaveProperty('deleted')
    expect(result[0]).not.toHaveProperty('_internal')
    expect(result[0].name).toBe('A')
  })

  it('should handle multi-level nesting', () => {
    const list = [
      { id: 1, parentId: 0, name: 'L1' },
      { id: 2, parentId: 1, name: 'L2' },
      { id: 3, parentId: 2, name: 'L3' },
    ]
    const result = ListToTree(list)
    expect(result[0].children[0].children[0].name).toBe('L3')
  })
})

describe('TreeToList', () => {
  it('should return empty array for empty tree', () => {
    const result = TreeToList([])
    expect(result).toEqual([])
  })

  it('should flatten tree to list', () => {
    const tree = [
      {
        id: 1, name: 'Root',
        children: [
          { id: 2, name: 'Child', children: [] },
        ],
      },
    ]
    const result = TreeToList(tree)
    expect(result).toHaveLength(2)
    expect(result.map((n: any) => n.id).sort()).toEqual([1, 2])
  })

  it('should remove children key from flattened nodes', () => {
    const tree = [
      { id: 1, name: 'Root', children: [{ id: 2, name: 'Child' }] },
    ]
    const result = TreeToList(tree)
    result.forEach((node: any) => {
      expect(node).not.toHaveProperty('children')
    })
  })

  it('should support custom childrenKey', () => {
    const tree = [
      { id: 1, sub: [{ id: 2 }] },
    ]
    const result = TreeToList(tree, { childrenKey: 'sub' })
    expect(result).toHaveLength(2)
  })

  it('should handle deeply nested tree', () => {
    const tree = [
      {
        id: 1,
        children: [
          { id: 2, children: [{ id: 3, children: [] }] },
          { id: 4 },
        ],
      },
      { id: 5 },
    ]
    const result = TreeToList(tree)
    expect(result).toHaveLength(5)
  })
})

describe('SanitizeObject', () => {
  it('should mask sensitive fields', () => {
    const obj = { username: 'admin', password: 'secret', email: 'a@b.com' }
    const result = SanitizeObject(obj, ['password'])
    expect(result.username).toBe('admin')
    expect(result.password).toBe('***')
    expect(result.email).toBe('a@b.com')
  })

  it('should be case-insensitive for field names', () => {
    const obj = { Password: 'secret', PASSWORD: 'secret2' }
    const result = SanitizeObject(obj, ['password'])
    expect(result.Password).toBe('***')
    expect(result.PASSWORD).toBe('***')
  })

  it('should not modify the original object', () => {
    const obj = { password: 'secret', name: 'test' }
    SanitizeObject(obj, ['password'])
    expect(obj.password).toBe('secret')
  })

  it('should mask nested fields', () => {
    const obj = {
      user: { password: 'secret', name: 'test' },
      token: 'abc',
    }
    const result = SanitizeObject(obj, ['password', 'token'])
    expect(result.user.password).toBe('***')
    expect(result.user.name).toBe('test')
    expect(result.token).toBe('***')
  })

  it('should mask fields inside arrays', () => {
    const obj = {
      users: [
        { name: 'a', password: 'p1' },
        { name: 'b', password: 'p2' },
      ],
    }
    const result = SanitizeObject(obj, ['password'])
    expect(result.users[0].password).toBe('***')
    expect(result.users[1].password).toBe('***')
    expect(result.users[0].name).toBe('a')
  })

  it('should return primitives unchanged', () => {
    expect(SanitizeObject('hello' as any, ['x'])).toBe('hello')
    expect(SanitizeObject(123 as any, ['x'])).toBe(123)
    expect(SanitizeObject(null as any, ['x'])).toBe(null)
  })

  it('should handle multiple sensitive fields', () => {
    const obj = { password: 'p', token: 't', secret: 's', name: 'n' }
    const result = SanitizeObject(obj, ['password', 'token', 'secret'])
    expect(result.password).toBe('***')
    expect(result.token).toBe('***')
    expect(result.secret).toBe('***')
    expect(result.name).toBe('n')
  })
})

describe('IsStringifiedObjectOrArray', () => {
  it('should return true for JSON object string', () => {
    expect(IsStringifiedObjectOrArray('{"a":1}')).toBe(true)
  })

  it('should return true for JSON array string', () => {
    expect(IsStringifiedObjectOrArray('[1,2,3]')).toBe(true)
  })

  it('should return false for JSON primitive strings', () => {
    expect(IsStringifiedObjectOrArray('"hello"')).toBe(false)
    expect(IsStringifiedObjectOrArray('123')).toBe(false)
    expect(IsStringifiedObjectOrArray('true')).toBe(false)
    expect(IsStringifiedObjectOrArray('null')).toBe(false)
  })

  it('should return false for null/undefined', () => {
    expect(IsStringifiedObjectOrArray(null)).toBe(false)
    expect(IsStringifiedObjectOrArray(undefined)).toBe(false)
  })

  it('should return false for non-string types', () => {
    expect(IsStringifiedObjectOrArray(123 as any)).toBe(false)
    expect(IsStringifiedObjectOrArray({} as any)).toBe(false)
  })

  it('should return false for non-JSON strings', () => {
    expect(IsStringifiedObjectOrArray('hello world')).toBe(false)
    expect(IsStringifiedObjectOrArray('')).toBe(false)
  })

  it('should handle whitespace-padded JSON', () => {
    expect(IsStringifiedObjectOrArray('  {"a":1}  ')).toBe(true)
  })
})
