import { Link, useLocation } from 'react-router-dom';

interface NavItem {
  label: string;
  path: string;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  {
    label: 'Home',
    path: '/',
  },
  {
    label: 'Core Library',
    path: '/core',
    children: [
      { label: 'Basics', path: '/core/basics' },
      { label: 'Advanced', path: '/core/advanced' },
      { label: 'Performance', path: '/core/performance' },
      { label: 'Integration', path: '/core/integration' },
    ],
  },
  {
    label: 'React Integration',
    path: '/react',
    children: [
      { label: 'Basics', path: '/react/basics' },
      { label: 'Hooks', path: '/react/hooks' },
      { label: 'Action Guard', path: '/react/action-guard' },
      { label: 'Guard Config', path: '/react/action-guard-config' },
      { label: 'Context', path: '/react/context' },
      { label: 'Forms', path: '/react/forms' },
      { 
        label: 'Store System', 
        path: '/react/store',
        children: [
          { label: 'Store Basics', path: '/react/store/basics' },
          { label: 'Registry', path: '/react/store/registry' },
          { label: 'Context', path: '/react/store/context' },
          { label: 'Sync', path: '/react/store/sync' },
          { label: 'Full Demo', path: '/react/store/demo' },
        ]
      },
    ],
  },
  {
    label: 'Jotai Integration',
    path: '/jotai',
    children: [
      { label: 'Basics', path: '/jotai/basics' },
      { label: 'Async', path: '/jotai/async' },
      { label: 'Persistence', path: '/jotai/persistence' },
    ],
  },
];

export function Navigation() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const isChildActive = (parentPath: string) => {
    return (
      location.pathname.startsWith(parentPath) &&
      location.pathname !== parentPath
    );
  };

  const renderNavItem = (item: NavItem, level: number = 0): JSX.Element => {
    const hasChildren = item.children && item.children.length > 0;
    const isItemActive = isActive(item.path);
    const shouldShowChildren = hasChildren && (isItemActive || isChildActive(item.path));

    return (
      <li key={item.path} style={{ marginBottom: level === 0 ? '8px' : '4px' }}>
        <Link
          to={item.path}
          style={{
            display: 'block',
            padding: level === 0 ? '8px 12px' : level === 1 ? '6px 12px' : '4px 8px',
            textDecoration: 'none',
            color: location.pathname === item.path ? '#0066cc' : level === 0 ? '#333' : '#666',
            backgroundColor: location.pathname === item.path ? '#e3f2fd' : 'transparent',
            borderRadius: '4px',
            fontSize: level === 0 ? '16px' : level === 1 ? '14px' : '13px',
            fontWeight: location.pathname === item.path ? 'bold' : 'normal',
            transition: 'all 0.2s',
            marginLeft: level > 1 ? `${(level - 1) * 8}px` : '0',
          }}
        >
          {item.label}
        </Link>

        {shouldShowChildren && (
          <ul
            style={{
              listStyle: 'none',
              padding: '8px 0 0 16px',
              margin: 0,
              borderLeft: level < 2 ? '2px solid #e9ecef' : '1px solid #f0f0f0',
              marginLeft: '12px',
            }}
          >
            {item.children!.map((child) => renderNavItem(child, level + 1))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <nav
      style={{
        width: '280px',
        backgroundColor: '#f8f9fa',
        borderRight: '1px solid #e9ecef',
        padding: '20px',
        overflow: 'auto',
      }}
    >
      <h2
        style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 'bold' }}
      >
        Context Action Library
      </h2>

      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {navItems.map((item) => renderNavItem(item))}
      </ul>
    </nav>
  );
}
