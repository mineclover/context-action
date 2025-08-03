import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import { 
  layoutVariants, 
  sidebarVariants, 
  mainContentVariants, 
  navItemVariants,
  type LayoutVariants,
  type SidebarVariants,
  type MainContentVariants
} from './ui/variants';

interface LayoutProps {
  children: React.ReactNode;
  variant?: LayoutVariants['variant'];
  sidebarWidth?: SidebarVariants['width'];
  collapsed?: boolean;
}

function Layout({ 
  children, 
  variant = 'default',
  sidebarWidth = 'md',
  collapsed = false 
}: LayoutProps) {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home', category: 'main' as const },
    { path: '/core/basics', label: 'Core Basics', category: 'core' as const },
    { path: '/core/advanced', label: 'Core Advanced', category: 'core' as const },
    { path: '/store/basics', label: 'Store Basics', category: 'store' as const },
    { path: '/store/full-demo', label: 'Store Full Demo', category: 'store' as const },
    { path: '/react/provider', label: 'React Provider', category: 'react' as const },
    { path: '/react/context', label: 'React Context', category: 'react' as const },
    { path: '/react/hooks', label: 'React Hooks', category: 'react' as const },
    { path: '/logger/demo', label: 'Logger System', category: 'logger' as const },
    { path: '/actionguard/demo', label: 'Action Guard', category: 'actionguard' as const },
    { path: '/examples/toast-config', label: '🍞 Toast Config Example', category: 'examples' as const },
    { path: '/infinite-loop/test', label: '🧪 Infinite Loop Test', category: 'debug' as const },
    { path: '/comparison/demo', label: '⚡ Store Comparison Demo', category: 'debug' as const },
    { path: '/comparison/throttled', label: '⏱️ Throttled Loop Control', category: 'debug' as const },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className={cn(layoutVariants({ variant }))}>
      <nav className={cn(sidebarVariants({ width: sidebarWidth, collapsed }))}>
        {/* Logo Section */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CA</span>
            </div>
            {!collapsed && (
              <div>
                <h2 className="text-lg font-bold text-gray-900">Context-Action</h2>
                <p className="text-xs text-gray-500">Framework Examples</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Navigation Section */}
        <div className="p-4">
          {!collapsed && (
            <h3 className="px-3 mb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Navigation
            </h3>
          )}
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  navItemVariants({
                    variant: isActive(item.path) ? 'active' : 'default',
                    category: item.category,
                  })
                )}
                title={collapsed ? item.label : undefined}
              >
                {collapsed ? (
                  <span className="text-xs font-bold">
                    {item.label.charAt(0)}
                  </span>
                ) : (
                  item.label
                )}
              </Link>
            ))}
          </nav>
        </div>
      </nav>
      
      <main className={cn(
        mainContentVariants({ 
          sidebarWidth, 
          sidebarCollapsed: collapsed 
        })
      )}>
        {children}
      </main>
    </div>
  );
}

export default Layout;