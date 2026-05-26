import { afterAll, describe, expect, it, mock } from 'bun:test'
import { buildFakeCtx } from '../helper/ctx'
import { createRepositoryMock, createResultMock, createMockSchema } from '../helper/mocks'

afterAll(() => {
  mock.restore()
})

// 默认菜单列表
const defaultMenuList = [
  {
    menuId: 1, parentId: 0, name: 'Dashboard', path: '/dashboard',
    component: 'dashboard/index', title: '仪表盘', icon: 'dashboard',
    sort: 1, keepAlive: true, fixedTab: false, isHide: false,
    isHideTab: false, isFullPage: false, showBadge: false, showTextBadge: false,
    link: null, isIframe: false, activePath: null, metadataCollectionId: null,
    delFlag: false,
  },
  {
    menuId: 2, parentId: 1, name: 'UserManagement', path: '/system/user',
    component: 'system/user/index', title: '用户管理', icon: 'user',
    sort: 1, keepAlive: true, fixedTab: false, isHide: false,
    isHideTab: false, isFullPage: false, showBadge: false, showTextBadge: false,
    link: null, isIframe: false, activePath: null, metadataCollectionId: null,
    delFlag: false,
  },
]

// 默认按钮列表
const defaultBtnList = [
  { btnId: 1, menuId: 2, title: '新增', permission: 'system:user:create', delFlag: false },
  { btnId: 2, menuId: 2, title: '删除', permission: 'system:user:delete', delFlag: false },
]

const repoMock = createRepositoryMock()
repoMock.FindAll.mockResolvedValue(defaultMenuList)
repoMock.FindAllWithJoin.mockResolvedValue(defaultMenuList)

mock.module('@/core/database/repository', () => repoMock)

mock.module('@/core/cache', () => ({
  WithCache: mock(async (_key: string, fn: () => any) => fn()),
}))

mock.module('@/core/function', () => ({
  ListToTree: mock((data: any[], options: any) => {
    const map = new Map<number, any>()
    const roots: any[] = []
    for (const item of data) {
      const node = { ...item, [options?.childrenKey || 'children']: [] }
      map.set(item[options?.idKey || 'menuId'], node)
    }
    for (const item of data) {
      const node = map.get(item[options?.idKey || 'menuId'])
      const parentId = item[options?.parentKey || 'parentId']
      if (!parentId || parentId === (options?.rootValue ?? 0)) {
        roots.push(node)
      } else {
        const parent = map.get(parentId)
        if (parent) {
          parent[options?.childrenKey || 'children'].push(node)
        } else {
          roots.push(node)
        }
      }
    }
    return roots
  }),
}))

mock.module('@/core/result', () => createResultMock())

mock.module('@/core/database/redis', () => ({
  Set: mock().mockResolvedValue(undefined),
}))

mock.module('@/constants/enum', () => ({
  CacheEnum: { ADMIN_MENU: 'admin:menu:' },
}))

mock.module('@/shared/logger', () => ({
  logger: { error: mock(() => {}) },
}))

mock.module('@database/schema/system_menu', () => ({
  systemMenuSchema: createMockSchema('systemMenu'),
  systemMenuBtnSchema: createMockSchema('systemMenuBtn'),
}))

mock.module('@database/schema/system_role', () => ({
  systemRoleMenuSchema: createMockSchema('systemRoleMenu'),
}))

mock.module('@database/schema/system_user', () => ({
  systemUserRoleSchema: createMockSchema('systemUserRole'),
}))

const {
  createMenu,
  createMenuBtn,
  findSimple,
  findTree,
  updateMenu,
  updateMenuBtn,
  removeMenu,
  removeMenuBtn,
  handleMenuListToTree,
} = await import('@/modules/system-menu/handle')

describe('system-menu handlers', () => {
  describe('createMenu', () => {
    it('should return ok on success', async () => {
      const ctx = buildFakeCtx({
        body: { name: 'TestMenu', path: '/test', title: '测试菜单', parentId: 0, sort: 1 },
      })
      const result = await createMenu(ctx)
      expect(result.code).toBe(200)
    })

    it('should return fail on DB error', async () => {
      repoMock.InsertOne.mockRejectedValueOnce(new Error('DB error'))
      const ctx = buildFakeCtx({ body: { name: 'x' } })
      const result = await createMenu(ctx)
      expect(result.code).toBe(500)
    })
  })

  describe('createMenuBtn', () => {
    it('should return ok on success', async () => {
      const ctx = buildFakeCtx({
        body: { menuId: 1, title: '新增', permission: 'system:test:create' },
      })
      const result = await createMenuBtn(ctx)
      expect(result.code).toBe(200)
    })

    it('should return fail on DB error', async () => {
      repoMock.InsertOne.mockRejectedValueOnce(new Error('DB error'))
      const ctx = buildFakeCtx({ body: { title: 'x' } })
      const result = await createMenuBtn(ctx)
      expect(result.code).toBe(500)
    })
  })

  describe('findSimple', () => {
    it('should return menu tree for current user', async () => {
      // findSimple 内部多次调用 FindAll：userRole → roleMenu → menuData → menuBtnData
      repoMock.FindAll.mockResolvedValueOnce([{ roleId: 1 }, { roleId: 2 }])
      repoMock.FindAll.mockResolvedValueOnce([
        { menuId: 1, menuBtnId: null },
        { menuId: 2, menuBtnId: 1 },
        { menuId: 2, menuBtnId: 2 },
      ])
      repoMock.FindAll.mockResolvedValueOnce(defaultMenuList)
      repoMock.FindAll.mockResolvedValueOnce(defaultBtnList)

      const ctx = buildFakeCtx()
      const result = await findSimple(ctx)
      expect(result.code).toBe(200)
    })

    it('should return empty tree when user has no roles', async () => {
      // GetRoleMenuIdsAndBtnIds: userRoleData 返回空 → menuIds/menuBtnIds 均为空
      repoMock.FindAll.mockResolvedValueOnce([])

      // WithCache 回调内部不再调用 FindAll（因为 role menu 也没数据）
      // 但 GetRoleMenuIdsAndBtnIds 还会再调一次 FindAll 查 roleMenu
      repoMock.FindAll.mockResolvedValueOnce([])

      // 然后 findSimple 的 WithCache 回调继续：
      // menuWhere with in('menuId', []) → menuData = []
      repoMock.FindAll.mockResolvedValueOnce([])
      // menuBtnWhere with in('btnId', []) → menuBtnData = []
      repoMock.FindAll.mockResolvedValueOnce([])

      const ctx = buildFakeCtx()
      const result = await findSimple(ctx)
      expect(result.code).toBe(200)
      expect(result.data).toEqual([])
    })

    it('should return fail when FindAll throws outside inner try/catch', async () => {
      // GetRoleMenuIdsAndBtnIds 内部有 try/catch，不抛错
      // 但 findSimple 的 WithCache 回调中 FindPage 不会在这里被调用
      // 用 InsertOne.mockRejectedValue 制造 error 来测试外层 try/catch
      // 实际场景：WithCache 本身抛错 → findSimple 的 try/catch 捕获
      const { WithCache } = await import('@/core/cache')
      WithCache.mockRejectedValueOnce(new Error('Cache error'))

      const ctx = buildFakeCtx()
      const result = await findSimple(ctx)
      expect(result.code).toBe(500)
    })
  })

  describe('findTree', () => {
    it('should return full menu tree', async () => {
      const ctx = buildFakeCtx({ query: {} })
      const result = await findTree(ctx)
      expect(result.code).toBe(200)
    })

    it('should filter by title', async () => {
      const ctx = buildFakeCtx({ query: { title: '仪表' } })
      const result = await findTree(ctx)
      expect(result.code).toBe(200)
    })

    it('should return fail on DB error', async () => {
      repoMock.FindAllWithJoin.mockRejectedValueOnce(new Error('DB error'))
      const ctx = buildFakeCtx({ query: {} })
      const result = await findTree(ctx)
      expect(result.code).toBe(500)
    })
  })

  describe('updateMenu', () => {
    it('should return ok on success', async () => {
      const ctx = buildFakeCtx({ body: { menuId: 1, title: '更新后的菜单' } })
      const result = await updateMenu(ctx)
      expect(result.code).toBe(200)
    })

    it('should return fail on DB error', async () => {
      repoMock.UpdateByKey.mockRejectedValueOnce(new Error('DB error'))
      const ctx = buildFakeCtx({ body: { menuId: 1 } })
      const result = await updateMenu(ctx)
      expect(result.code).toBe(500)
    })
  })

  describe('updateMenuBtn', () => {
    it('should return ok on success', async () => {
      const ctx = buildFakeCtx({ body: { btnId: 1, title: '更新按钮' } })
      const result = await updateMenuBtn(ctx)
      expect(result.code).toBe(200)
    })

    it('should return fail on DB error', async () => {
      repoMock.UpdateByKey.mockRejectedValueOnce(new Error('DB error'))
      const ctx = buildFakeCtx({ body: { btnId: 1 } })
      const result = await updateMenuBtn(ctx)
      expect(result.code).toBe(500)
    })
  })

  describe('removeMenu', () => {
    it('should soft-delete by ids', async () => {
      const ctx = buildFakeCtx({ params: { ids: '1,2' } })
      const result = await removeMenu(ctx)
      expect(result.code).toBe(200)
    })

    it('should return fail on DB error', async () => {
      repoMock.SoftDeleteByKeys.mockRejectedValueOnce(new Error('DB error'))
      const ctx = buildFakeCtx({ params: { ids: '1' } })
      const result = await removeMenu(ctx)
      expect(result.code).toBe(500)
    })
  })

  describe('removeMenuBtn', () => {
    it('should soft-delete by ids', async () => {
      const ctx = buildFakeCtx({ params: { ids: '1,2,3' } })
      const result = await removeMenuBtn(ctx)
      expect(result.code).toBe(200)
    })

    it('should return fail on DB error', async () => {
      repoMock.SoftDeleteByKeys.mockRejectedValueOnce(new Error('DB error'))
      const ctx = buildFakeCtx({ params: { ids: '1' } })
      const result = await removeMenuBtn(ctx)
      expect(result.code).toBe(500)
    })
  })
})

describe('handleMenuListToTree', () => {
  const makeMenuItem = (overrides: Record<string, any> = {}) => ({
    menuId: 1, parentId: 0, name: 'Menu', path: '/menu',
    component: 'm', title: '菜单', sort: 1, icon: null,
    keepAlive: null, fixedTab: null, isHide: null, isHideTab: null,
    isFullPage: null, showBadge: null, showTextBadge: null,
    link: null, isIframe: null, activePath: null, metadataCollectionId: null,
    ...overrides,
  })

  it('should return empty array for empty list', () => {
    const result = handleMenuListToTree([])
    expect(result).toEqual([])
  })

  it('should build tree from flat menu list', () => {
    const result = handleMenuListToTree([
      makeMenuItem({ menuId: 1, parentId: 0, name: 'Root', path: '/root', component: 'root/index', title: '根菜单' }),
      makeMenuItem({ menuId: 2, parentId: 1, name: 'Child', path: '/child', component: 'child/index', title: '子菜单', sort: 2 }),
    ])
    expect(result).toHaveLength(1)
    expect(result[0].meta.title).toBe('根菜单')
    expect(result[0].children).toHaveLength(1)
    expect(result[0].children[0].meta.title).toBe('子菜单')
  })

  it('should sort by sort field', () => {
    const result = handleMenuListToTree([
      makeMenuItem({ menuId: 1, name: 'B', path: '/b', component: 'b', title: 'B菜单', sort: 2 }),
      makeMenuItem({ menuId: 2, name: 'A', path: '/a', component: 'a', title: 'A菜单', sort: 1 }),
    ])
    expect(result[0].meta.title).toBe('A菜单')
    expect(result[1].meta.title).toBe('B菜单')
  })

  it('should attach button authList to menu meta', () => {
    const result = handleMenuListToTree(
      [makeMenuItem({ menuId: 1, name: 'Menu', path: '/menu', component: 'm', title: '菜单' })],
      [
        { btnId: 1, menuId: 1, title: '新增', permission: 'menu:create', delFlag: false },
        { btnId: 2, menuId: 1, title: '删除', permission: 'menu:delete', delFlag: false },
      ],
    )
    expect(result[0].meta.authList).toHaveLength(2)
    expect(result[0].meta.authList[0]).toEqual({ title: '新增', authMark: 'menu:create' })
    expect(result[0].meta.authList[1]).toEqual({ title: '删除', authMark: 'menu:delete' })
  })

  it('should not attach authList when no buttons provided', () => {
    const result = handleMenuListToTree([
      makeMenuItem(),
    ])
    expect(result[0].meta.authList).toBeUndefined()
  })

  it('should include optional menu meta fields when present', () => {
    const result = handleMenuListToTree([
      makeMenuItem({
        icon: 'star', keepAlive: true, fixedTab: true,
        isFullPage: true, showBadge: true, showTextBadge: 'New',
        link: 'https://example.com', isIframe: true, activePath: '/active',
        metadataCollectionId: 5,
      }),
    ])
    const meta = result[0].meta
    expect(meta.icon).toBe('star')
    expect(meta.keepAlive).toBe(true)
    expect(meta.fixedTab).toBe(true)
    expect(meta.isFullPage).toBe(true)
    expect(meta.showBadge).toBe(true)
    expect(meta.showTextBadge).toBe('New')
    expect(meta.link).toBe('https://example.com')
    expect(meta.isIframe).toBe(true)
    expect(meta.activePath).toBe('/active')
    expect(meta.metadataCollectionId).toBe(5)
  })

  it('should not include null/undefined optional fields', () => {
    const result = handleMenuListToTree([makeMenuItem()])
    const meta = result[0].meta
    expect(meta.icon).toBeUndefined()
    expect(meta.keepAlive).toBeUndefined()
    expect(meta.fixedTab).toBeUndefined()
  })

  it('should set parentId=0 menus at root level', () => {
    const result = handleMenuListToTree([
      makeMenuItem({ menuId: 1, name: 'Root1', path: '/r1', component: 'r1', title: '根1' }),
      makeMenuItem({ menuId: 2, name: 'Root2', path: '/r2', component: 'r2', title: '根2', sort: 2 }),
    ])
    expect(result).toHaveLength(2)
  })
})
