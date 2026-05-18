/**
 * API 认证类型定义
 *
 * 提供登录、用户信息等认证相关类型
 *
 * @module types/api/auth
 */

declare namespace Api {
    /** 认证类型 */
    namespace Auth {
        /** 登录参数 */
        interface LoginParams {
            username: string
            password: string
        }

        /** 租户信息 */
        interface TenantInfo {
            tenantId: number
            tenantName: string
            tenantCode: string
            status: boolean
            isDefault: boolean
        }

        /** 登录响应 */
        interface LoginResponse {
            accessToken: string
            refreshToken: string
            accessExpiresIn: number
            refreshExpiresIn: number
            currentTenantId?: number
            tenants?: TenantInfo[]
        }

        /** 用户信息 */
        interface UserInfo {
            permissions: string[]
            roles: string[]
            userId: number
            username: string
            email: string
            avatar?: string
            tenantId?: number
            tenants?: TenantInfo[]
        }

        /** 注册参数 */
        interface RegisterParams {
            username: string
            password: string
        }

        /** 忘记密码参数 */
        interface ForgetPasswordParams {
            email: string
        }

        /** 重置密码参数 */
        interface ResetPasswordParams {
            token: string
            uid: number
            password: string
        }
    }
}
