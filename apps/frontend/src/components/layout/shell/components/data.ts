import { type MenuItemType } from '@/types'

export const menuItems: MenuItemType[] = [
  {
    icon: 'layout-dashboard',
    slug: 'overview',
    label: 'Overview',
    isTitle: true,
    children: [
      {
        url: '/dashboard',
        slug: 'pages:dashboard',
        label: 'Dashboard',
        icon: 'layout-dashboard',
      },
    ],
  },
  {
    icon: 'stethoscope',
    slug: 'clinical',
    label: 'Clinical',
    isTitle: true,
    children: [
      {
        url: '/schedule',
        slug: 'pages:schedule',
        label: 'Schedule',
        icon: 'calendar-days',
      },
      {
        slug: 'patients',
        label: 'Patients',
        icon: 'users-round',
        children: [
          {
            url: '/patients',
            slug: 'pages:patients',
            label: 'All Patients',
          },
          {
            url: '/patients/new',
            slug: 'pages:patients-new',
            label: 'Add Patient',
          },
        ],
      },
      {
        slug: 'visits',
        label: 'Visits',
        icon: 'stethoscope',
        children: [
          {
            url: '/visits',
            slug: 'pages:visits',
            label: 'All Visits',
          },
          {
            url: '/visits/new',
            slug: 'pages:visits-new',
            label: 'New Visit',
          },
        ],
      },
      {
        url: '/waiting-room',
        slug: 'pages:waiting-room',
        label: 'Waiting Room',
        icon: 'clipboard-list',
      },
      {
        slug: 'staff',
        label: 'Staff',
        icon: 'user-cog',
        children: [
          {
            url: '/staff',
            slug: 'pages:staff',
            label: 'Staff Members',
          },
          {
            url: '/staff/new',
            slug: 'pages:staff-new',
            label: 'Add Staff Member',
          },
        ],
      },
    ],
  },
  {
    icon: 'message-square',
    slug: 'communication',
    label: 'Communication',
    isTitle: true,
    children: [
      {
        url: '/messages',
        slug: 'pages:messages',
        label: 'Messages',
        icon: 'message-square',
      },
    ],
  },
]
