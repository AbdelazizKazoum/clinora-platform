import {
  can,
  canAccessPath,
  filterMenuItemsForRole,
} from '../src/features/auth/model/access-policy';
import type { MenuItemType } from '../src/types';

const menuItems: MenuItemType[] = [
  {
    slug: 'clinical',
    label: 'Clinical',
    isTitle: true,
    children: [
      {
        url: '/patients',
        slug: 'pages:patients',
        label: 'All Patients',
      },
      {
        slug: 'staff',
        label: 'Staff',
        children: [
          {
            url: '/staff',
            slug: 'pages:staff',
            label: 'Directory',
          },
          {
            url: '/staff/new',
            slug: 'pages:staff-new',
            label: 'Add Member',
          },
        ],
      },
    ],
  },
];

describe('frontend access policy', () => {
  it('grants admin wildcard access to staff capabilities', () => {
    expect(can('admin', 'staff:read')).toBe(true);
    expect(can('admin', 'staff:create')).toBe(true);
    expect(can('admin', 'staff:update')).toBe(true);
  });

  it('starts non-admin roles without staff-management capabilities', () => {
    expect(can('doctor', 'staff:read')).toBe(false);
    expect(can('secretary', 'staff:create')).toBe(false);
    expect(can('dental_assistant', 'staff:update')).toBe(false);
    expect(can('patient', 'staff:read')).toBe(false);
  });

  it('requires staff capabilities for staff routes only', () => {
    expect(canAccessPath('admin', '/staff')).toBe(true);
    expect(canAccessPath('doctor', '/staff')).toBe(false);
    expect(canAccessPath('secretary', '/staff/new')).toBe(false);
    expect(canAccessPath('doctor', '/patients')).toBe(true);
  });

  it('filters inaccessible staff navigation from the shared menu model', () => {
    expect(filterMenuItemsForRole(menuItems, 'admin')).toEqual(menuItems);

    const [clinical] = filterMenuItemsForRole(menuItems, 'doctor');

    expect(clinical?.children).toEqual([
      {
        url: '/patients',
        slug: 'pages:patients',
        label: 'All Patients',
      },
    ]);
  });
});
