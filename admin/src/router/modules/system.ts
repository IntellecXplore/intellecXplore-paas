import { AppRouteRecord } from '@/types/router'

export const systemRoutes: AppRouteRecord = {
  path: '/system',
  name: 'System',
  component: '/index/index',
  meta: {
    title: 'menus.system.title',
    icon: 'ri:user-3-line',
    roles: ['R_SUPER', 'R_ADMIN']
  },
  children: [
    {
      path: 'user',
      name: 'User',
      component: '/system/user',
      meta: {
        title: 'menus.system.user',
        keepAlive: true,
        roles: ['R_SUPER', 'R_ADMIN']
      }
    },
    {
      path: 'role',
      name: 'Role',
      component: '/system/role',
      meta: {
        title: 'menus.system.role',
        keepAlive: true,
        roles: ['R_SUPER']
      }
    },
    {
      path: 'user-center',
      name: 'UserCenter',
      component: '/system/user-center',
      meta: {
        title: 'menus.system.userCenter',
        isHide: true,
        keepAlive: true,
        isHideTab: true
      }
    },
    {
      path: 'menu',
      name: 'Menus',
      component: '/system/menu',
      meta: {
        title: 'menus.system.menu',
        keepAlive: true,
        roles: ['R_SUPER'],
        authList: [
          { title: '新增', authMark: 'add' },
          { title: '编辑', authMark: 'edit' },
          { title: '删除', authMark: 'delete' }
        ]
      }
    },
    {
      path: 'integration',
      name: 'Integration',
      redirect: '/system/integration/source',
      meta: {
        title: '数据集成',
        icon: 'ri:link',
        keepAlive: true,
        roles: ['R_SUPER', 'R_ADMIN']
      },
      children: [
        {
          path: 'source',
          name: 'IntegrationSource',
          component: '/system/integration/source',
          meta: {
            title: '数据源管理',
            keepAlive: true,
            roles: ['R_SUPER', 'R_ADMIN']
          }
        },
        {
          path: 'task',
          name: 'IntegrationTask',
          component: '/system/integration/task',
          meta: {
            title: '同步任务',
            keepAlive: true,
            roles: ['R_SUPER', 'R_ADMIN']
          }
        },
        {
          path: 'log',
          name: 'IntegrationLog',
          component: '/system/integration/log',
          meta: {
            title: '同步日志',
            keepAlive: true,
            roles: ['R_SUPER', 'R_ADMIN']
          }
        },
        {
          path: 'object',
          name: 'IntegrationObject',
          component: '/system/integration/object',
          meta: {
            title: '数据对象',
            keepAlive: true,
            roles: ['R_SUPER', 'R_ADMIN']
          }
        },
        {
          path: 'mapping',
          name: 'IntegrationMapping',
          component: '/system/integration/mapping',
          meta: {
            title: '字段映射',
            keepAlive: true,
            roles: ['R_SUPER', 'R_ADMIN']
          }
        }
      ]
    },
    {
      path: 'metadata',
      name: 'Metadata',
      redirect: '/system/metadata/collection',
      meta: {
        title: '元数据管理',
        icon: 'ri:database-2-line',
        keepAlive: true,
        roles: ['R_SUPER', 'R_ADMIN']
      },
      children: [
        {
          path: 'collection',
          name: 'MetadataCollection',
          component: '/system/metadata/collection',
          meta: {
            title: '数据表管理',
            keepAlive: true,
            roles: ['R_SUPER', 'R_ADMIN']
          }
        },
        {
          path: 'database-config',
          name: 'MetadataDatabaseConfig',
          component: '/system/metadata/database-config',
          meta: {
            title: '数据库配置',
            keepAlive: true,
            roles: ['R_SUPER', 'R_ADMIN']
          }
        },
        {
          path: 'field/:collectionId',
          name: 'MetadataField',
          component: '/system/metadata/field',
          meta: {
            title: '字段管理',
            isHide: true,
            keepAlive: true,
            isHideTab: true,
            roles: ['R_SUPER', 'R_ADMIN']
          }
        },
        {
          path: 'dynamic-crud',
          name: 'DynamicCrud',
          component: '/system/dynamic-crud',
          meta: {
            title: '动态数据',
            isHide: true,
            keepAlive: true,
            isHideTab: true,
            roles: ['R_SUPER', 'R_ADMIN']
          }
        },
        {
          path: 'workflow-definitions',
          name: 'WorkflowDefinitions',
          component: '/system/workflow/definition',
          meta: {
            title: '工作流定义',
            keepAlive: true,
            roles: ['R_SUPER', 'R_ADMIN']
          }
        },
        {
          path: 'workflow-instances',
          name: 'WorkflowInstances',
          component: '/system/workflow/instance',
          meta: {
            title: '工作流执行历史',
            keepAlive: true,
            roles: ['R_SUPER', 'R_ADMIN']
          }
        },
        {
          path: 'workflow/instances/:id',
          name: 'WorkflowInstanceDetail',
          component: '/system/workflow/detail',
          meta: {
            title: '执行详情',
            isHide: true,
            keepAlive: false,
            isHideTab: true,
            roles: ['R_SUPER', 'R_ADMIN']
          }
        }
      ]
    }
  ]
}
