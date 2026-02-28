/**
 * Base tenant — each Brain service extends with its own quota fields
 */
export interface BaseTenant {
  id: string;
  name: string;
  apiKeyHash: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Base workspace — each Brain service extends with its own quota fields
 */
export interface BaseWorkspace {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  metadata: Record<string, unknown> | null;
}

/**
 * Tenant context attached to authenticated requests
 */
export interface BaseTenantContext<T = BaseTenant> {
  tenant: T;
}

/**
 * Base Hono variables (tenant + requestId)
 */
export interface BaseVariables<T = BaseTenant> extends BaseTenantContext<T> {
  requestId: string;
}

/**
 * Base environment bindings common to all Brain services
 */
export interface BaseEnv {
  DB: D1Database;
  ENVIRONMENT: 'development' | 'staging' | 'production';
  ADMIN_API_KEY?: string;
}

/**
 * Base Hono AppEnv type — generic over Bindings and Variables
 */
export type BaseAppEnv<
  B extends BaseEnv = BaseEnv,
  V extends BaseVariables = BaseVariables,
> = {
  Bindings: B;
  Variables: V;
};

/**
 * Standard API error response shape
 */
export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
