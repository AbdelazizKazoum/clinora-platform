export const menuItems = [
  {
    'icon': 'layout-dashboard',
    'slug': 'main',
    'label': 'Main',
    'isTitle': true,
    'children': [
      {
        'url': '/dashboard',
        'slug': 'pages:dashboard',
        'label': 'Dashboard',
        'icon': 'layout-dashboard',
      },
    ],
  },
  {
    'icon': 'book-open-text',
    'slug': 'custom-pages',
    'label': 'Custom Pages',
    'isTitle': true,
    'children': [
      {
        'url': '/pages/empty',
        'slug': 'pages:pages-empty',
        'label': 'Empty Page',
        'icon': 'book-open-text',
      },
      {
        'icon': 'user-lock',
        'slug': 'authentication',
        'label': 'Authentication',
        'children': [
          {
            'slug': 'auth-basic',
            'label': 'Basic',
            'children': [
              {
                'url': '/auth/sign-in',
                'slug': 'pages:auth-sign-in',
                'label': 'Sign In',
              },
              {
                'url': '/auth/sign-up',
                'slug': 'pages:auth-sign-up',
                'label': 'Sign Up',
              },
              {
                'url': '/auth/reset-pass',
                'slug': 'pages:auth-reset-pass',
                'label': 'Reset Password',
              },
              {
                'url': '/auth/new-pass',
                'slug': 'pages:auth-new-pass',
                'label': 'New Password',
              },
              {
                'url': '/auth/two-factor',
                'slug': 'pages:auth-two-factor',
                'label': 'Two Factor',
              },
              {
                'url': '/auth/lock-screen',
                'slug': 'pages:auth-lock-screen',
                'label': 'Lock Screen',
              },
              {
                'url': '/auth/success-mail',
                'slug': 'pages:auth-success-mail',
                'label': 'Success Mail',
              },
              {
                'url': '/auth/login-pin',
                'slug': 'pages:auth-login-pin',
                'label': 'Login with PIN',
              },
              {
                'url': '/auth/delete-account',
                'slug': 'pages:auth-delete-account',
                'label': 'Delete Account',
              },
            ],
          },
          {
            'slug': 'auth-split',
            'label': 'Split',
            'children': [
              {
                'url': '/auth/split/sign-in',
                'slug': 'pages:auth-split-sign-in',
                'label': 'Sign In',
              },
              {
                'url': '/auth/split/sign-up',
                'slug': 'pages:auth-split-sign-up',
                'label': 'Sign Up',
              },
              {
                'url': '/auth/split/reset-pass',
                'slug': 'pages:auth-split-reset-pass',
                'label': 'Reset Password',
              },
              {
                'url': '/auth/split/new-pass',
                'slug': 'pages:auth-split-new-pass',
                'label': 'New Password',
              },
              {
                'url': '/auth/split/two-factor',
                'slug': 'pages:auth-split-two-factor',
                'label': 'Two Factor',
              },
              {
                'url': '/auth/split/lock-screen',
                'slug': 'pages:auth-split-lock-screen',
                'label': 'Lock Screen',
              },
              {
                'url': '/auth/split/success-mail',
                'slug': 'pages:auth-split-success-mail',
                'label': 'Success Mail',
              },
              {
                'url': '/auth/split/login-pin',
                'slug': 'pages:auth-split-login-pin',
                'label': 'Login with PIN',
              },
              {
                'url': '/auth/split/delete-account',
                'slug': 'pages:auth-split-delete-account',
                'label': 'Delete Account',
              },
            ],
          },
        ],
      },
      {
        'icon': 'alert-triangle',
        'slug': 'error-pages',
        'label': 'Error Pages',
        'children': [
          {
            'url': '/error/400',
            'slug': 'pages:error-400',
            'label': '400 Bad Request',
          },
          {
            'url': '/error/401',
            'slug': 'pages:error-401',
            'label': '401 Unauthorized',
          },
          {
            'url': '/error/403',
            'slug': 'pages:error-403',
            'label': '403 Forbidden',
          },
          {
            'url': '/error/404',
            'slug': 'pages:error-404',
            'label': '404 Not Found',
          },
          {
            'url': '/error/408',
            'slug': 'pages:error-408',
            'label': '408 Request Timeout',
          },
          {
            'url': '/error/500',
            'slug': 'pages:error-500',
            'label': '500 Internal Server',
          },
          {
            'url': '/error/maintenance',
            'slug': 'pages:error-maintenance',
            'label': 'Maintenance',
          },
        ],
      },
    ],
  },
  {
    'icon': 'table-2',
    'slug': 'layouts',
    'label': 'Layouts',
    'isTitle': true,
    'children': [
      {
        'icon': 'layout-panel-left',
        'slug': 'layout-options',
        'label': 'Layout Options',
        'children': [
          {
            'url': '/layouts/scrollable',
            'slug': 'pages:layouts-scrollable',
            'label': 'Scrollable',
            'target': '_blank',
          },
          {
            'url': '/layouts/compact',
            'slug': 'pages:layouts-compact',
            'label': 'Compact',
            'target': '_blank',
          },
          {
            'url': '/layouts/boxed',
            'slug': 'pages:layouts-boxed',
            'label': 'Boxed',
            'target': '_blank',
          },
          {
            'url': '/layouts/horizontal',
            'slug': 'pages:layouts-horizontal',
            'label': 'Horizontal',
            'target': '_blank',
          },
          {
            'url': '/layouts/preloader',
            'slug': 'pages:layouts-preloader',
            'label': 'Preloader',
            'target': '_blank',
          },
        ],
      },
      {
        'icon': 'panel-left-dashed',
        'slug': 'sidebars',
        'label': 'Sidebars',
        'children': [
          {
            'url': '/layouts/sidebar-dark',
            'slug': 'pages:layouts-sidebar-dark',
            'label': 'Dark Menu',
            'target': '_blank',
          },
          {
            'url': '/layouts/sidebar-gradient',
            'slug': 'pages:layouts-sidebar-gradient',
            'label': 'Gradient Menu',
            'target': '_blank',
          },
          {
            'url': '/layouts/sidebar-gray',
            'slug': 'pages:layouts-sidebar-gray',
            'label': 'Gray Menu',
            'target': '_blank',
          },
          {
            'url': '/layouts/sidebar-image',
            'slug': 'pages:layouts-sidebar-image',
            'label': 'Image Menu',
            'target': '_blank',
          },
          {
            'url': '/layouts/sidebar-compact',
            'slug': 'pages:layouts-sidebar-compact',
            'label': 'Compact Menu',
            'target': '_blank',
          },
          {
            'url': '/layouts/sidebar-on-hover',
            'slug': 'pages:layouts-sidebar-on-hover',
            'label': 'On Hover Menu',
            'target': '_blank',
          },
          {
            'url': '/layouts/sidebar-on-hover-active',
            'slug': 'pages:layouts-sidebar-on-hover-active',
            'label': 'On Hover Active',
            'target': '_blank',
          },
          {
            'url': '/layouts/sidebar-offcanvas',
            'slug': 'pages:layouts-sidebar-offcanvas',
            'label': 'Offcanvas Menu',
            'target': '_blank',
          },
          {
            'url': '/layouts/sidebar-no-icons',
            'slug': 'pages:layouts-sidebar-no-icons',
            'label': 'No Icons with Lines',
            'target': '_blank',
          },
          {
            'url': '/layouts/sidebar-with-lines',
            'slug': 'pages:layouts-sidebar-with-lines',
            'label': 'Sidebar with Lines',
            'target': '_blank',
          },
        ],
      },
      {
        'icon': 'panel-top-dashed',
        'slug': 'topbar',
        'label': 'Topbar',
        'children': [
          {
            'url': '/layouts/topbar-light',
            'slug': 'pages:layouts-topbar-light',
            'label': 'Light Topbar',
            'target': '_blank',
          },
          {
            'url': '/layouts/topbar-gray',
            'slug': 'pages:layouts-topbar-gray',
            'label': 'Gray Topbar',
            'target': '_blank',
          },
          {
            'url': '/layouts/topbar-gradient',
            'slug': 'pages:layouts-topbar-gradient',
            'label': 'Gradient Topbar',
            'target': '_blank',
          },
        ],
      },
    ],
  },
  {
    'icon': 'component',
    'slug': 'components',
    'label': 'Components',
    'isTitle': true,
    'children': [
      {
        'url': '/icons/lucide',
        'slug': 'pages:icons-lucide',
        'label': 'Lucide',
        'icon': 'cannabis',
      },
    ],
  },
  {
    'icon': 'list-tree',
    'slug': 'menu-items',
    'label': 'Menu Items',
    'isTitle': true,
    'children': [
      {
        'icon': 'list-tree',
        'slug': 'menu-levels',
        'label': 'Menu Levels',
        'children': [
          {
            'slug': 'second-level',
            'label': 'Second Level',
            'children': [
              {
                'slug': 'menu-item-1',
                'label': 'Item 2.1',
              },
              {
                'slug': 'menu-item-2',
                'label': 'Item 2.2',
              },
            ],
          },
          {
            'slug': 'second-level-2',
            'label': 'Second Level',
            'children': [
              {
                'slug': 'menu-item-3',
                'label': 'Item 2.1',
              },
              {
                'slug': 'menu-item-4',
                'label': 'Item 2.2',
                'children': [
                  {
                    'slug': 'menu-item-5',
                    'label': 'Item 3.1',
                  },
                  {
                    'slug': 'menu-item-6',
                    'label': 'Item 3.2',
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        'icon': 'ban',
        'slug': 'disabled-menu',
        'label': 'Disabled Menu',
        'isDisabled': true,
      },
    ],
  },
]
