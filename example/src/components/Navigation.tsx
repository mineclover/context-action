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
    ],
  },
  {
    label: 'React Integration',
    path: '/react',
    children: [
      { label: 'Basics', path: '/react/basics' },
      { label: 'Hooks', path: '/react/hooks' },
      { label: 'Context', path: '/react/context' },
      { label: 'Forms', path: '/react/forms' },
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
        {navItems.map((item) => (
          <li key={item.path} style={{ marginBottom: '8px' }}>
            <Link
              to={item.path}
              style={{
                display: 'block',
                padding: '8px 12px',
                textDecoration: 'none',
                color: isActive(item.path) ? '#0066cc' : '#333',
                backgroundColor: isActive(item.path)
                  ? '#e3f2fd'
                  : 'transparent',
                borderRadius: '4px',
                fontWeight: isActive(item.path) ? 'bold' : 'normal',
                transition: 'all 0.2s',
              }}
            >
              {item.label}
            </Link>

            {item.children && isChildActive(item.path) && (
              <ul
                style={{
                  listStyle: 'none',
                  padding: '8px 0 0 16px',
                  margin: 0,
                  borderLeft: '2px solid #e9ecef',
                  marginLeft: '12px',
                }}
              >
                {item.children.map((child) => (
                  <li key={child.path} style={{ marginBottom: '4px' }}>
                    <Link
                      to={child.path}
                      style={{
                        display: 'block',
                        padding: '6px 12px',
                        textDecoration: 'none',
                        color:
                          location.pathname === child.path ? '#0066cc' : '#666',
                        backgroundColor:
                          location.pathname === child.path
                            ? '#e3f2fd'
                            : 'transparent',
                        borderRadius: '4px',
                        fontSize: '14px',
                        fontWeight:
                          location.pathname === child.path ? 'bold' : 'normal',
                        transition: 'all 0.2s',
                      }}
                    >
                      {child.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
