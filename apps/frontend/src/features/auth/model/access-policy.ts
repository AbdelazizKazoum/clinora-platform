import type { MenuItemType } from '@/types';
import type { AuthUserRole } from './auth-user';

export const FRONTEND_CAPABILITIES = [
  'staff:read',
  'staff:create',
  'staff:update',
] as const;

export type FrontendCapability = (typeof FRONTEND_CAPABILITIES)[number];

type RoleCapability = FrontendCapability | '*';

const roleCapabilities: Record<AuthUserRole, readonly RoleCapability[]> = {
  admin: ['*'],
  doctor: [],
  secretary: [],
  dental_assistant: [],
  patient: [],
};

const normalizePath = (path: string): string => {
  const [pathname = '/'] = path.split(/[?#]/, 1);
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;

  return normalized.length > 1 ? normalized.replace(/\/+$/, '') : normalized;
};

const isPathOrChildPath = (path: string, basePath: string): boolean =>
  path === basePath || path.startsWith(`${basePath}/`);

const routeAccessRules: readonly {
  capability: FrontendCapability;
  matches: (path: string) => boolean;
}[] = [
  {
    capability: 'staff:create',
    matches: (path) => isPathOrChildPath(path, '/staff/new'),
  },
  {
    capability: 'staff:read',
    matches: (path) => isPathOrChildPath(path, '/staff'),
  },
];

export const can = (
  role: AuthUserRole | null | undefined,
  capability: FrontendCapability,
): boolean => {
  if (!role) {
    return false;
  }

  const capabilities = roleCapabilities[role];

  return capabilities.includes('*') || capabilities.includes(capability);
};

export const canAccessPath = (
  role: AuthUserRole | null | undefined,
  path: string,
): boolean => {
  const normalizedPath = normalizePath(path);
  const rule = routeAccessRules.find(({ matches }) => matches(normalizedPath));

  return rule ? can(role, rule.capability) : true;
};

const filterMenuItemForRole = (
  item: MenuItemType,
  role: AuthUserRole | null | undefined,
): MenuItemType | null => {
  const children = item.children
    ?.map((child) => filterMenuItemForRole(child, role))
    .filter((child): child is MenuItemType => Boolean(child));

  if (children) {
    if (children.length === 0 && !item.url) {
      return null;
    }

    return {
      ...item,
      children,
    };
  }

  if (item.url && !canAccessPath(role, item.url)) {
    return null;
  }

  return { ...item };
};

export const filterMenuItemsForRole = (
  menuItems: readonly MenuItemType[],
  role: AuthUserRole | null | undefined,
): MenuItemType[] =>
  menuItems
    .map((item) => filterMenuItemForRole(item, role))
    .filter((item): item is MenuItemType => Boolean(item));
