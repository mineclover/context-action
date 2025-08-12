import type React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import {
  type LayoutVariants,
  layoutVariants,
  mainContentVariants,
  navItemVariants,
  type SidebarVariants,
  sidebarVariants,
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
  collapsed = false,
}: LayoutProps) {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home', category: 'main' as const },
    { path: '/core/basics', label: 'Core Basics', category: 'core' as const },
    {
      path: '/core/advanced',
      label: 'Core Advanced',
      category: 'core' as const,
    },
    {
      path: '/core/features',
      label: '🚀 Core Features',
      category: 'core' as const,
    },
    {
      path: '/store/basics',
      label: 'Store Basics',
      category: 'store' as const,
    },
    {
      path: '/store/full-demo',
      label: 'Store Full Demo',
      category: 'store' as const,
    },
    {
      path: '/store/immutability-test',
      label: '🔒 Immutability Test',
      category: 'store' as const,
    },
    {
      path: '/react/provider',
      label: '🔧 Unified Provider',
      category: 'react' as const,
    },
    {
      path: '/react/context',
      label: '🏗️ React Context',
      category: 'react' as const,
    },
    { path: '/react/hooks', label: 'React Hooks', category: 'react' as const },
    {
      path: '/react/useActionWithResult',
      label: '✨ useActionWithResult',
      category: 'react' as const,
    },
    {
      path: '/unified-pattern/demo',
      label: '🚀 Unified Pattern',
      category: 'react' as const,
    },
    {
      path: '/logger/demo',
      label: 'Logger System',
      category: 'logger' as const,
    },
    {
      path: '/actionguard',
      label: '🛡️ Action Guard System',
      category: 'actionguard' as const,
      isIndex: true,
    },
    {
      path: '/actionguard/search',
      label: '🔍 Search Demo',
      category: 'actionguard' as const,
    },
    {
      path: '/actionguard/scroll',
      label: '📜 Scroll Demo',
      category: 'actionguard' as const,
    },
    {
      path: '/actionguard/api-blocking',
      label: '🚫 API Blocking Demo',
      category: 'actionguard' as const,
    },
    {
      path: '/actionguard/mouse-events',
      label: '🖱️ Mouse Events Demo',
      category: 'actionguard' as const,
    },
    {
      path: '/actionguard/mouse-events/context-store',
      label: '🚀 Enhanced Context Store',
      category: 'actionguard' as const,
    },
    {
      path: '/actionguard/test',
      label: '🧪 Dispatch Options Test',
      category: 'actionguard' as const,
    },
    {
      path: '/actionguard/priority-performance',
      label: '⚡ Priority Performance',
      category: 'actionguard' as const,
    },
    {
      path: '/actionguard/throttle-comparison',
      label: '⚖️ Throttle Comparison',
      category: 'actionguard' as const,
    },
    {
      path: '/examples/toast-config',
      label: '🍞 Toast Config Example',
      category: 'examples' as const,
    },
    {
      path: '/examples/concurrent-actions',
      label: '🔄 Concurrent Actions Test',
      category: 'examples' as const,
    },
    {
      path: '/examples/enhanced-search',
      label: '🔍 Enhanced Abortable Search',
      category: 'examples' as const,
    },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className={cn(layoutVariants({ variant }))}>
      <nav
        className={cn(
          sidebarVariants({ width: sidebarWidth, collapsed }),
          'hidden md:block'
        )}
      >
        {/* Logo Section */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CA</span>
            </div>
            {!collapsed && (
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Context-Action
                </h2>
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
                  }),
                  // @ts-ignore - isIndex is not in the original type but we added it
                  item.isIndex && 'font-semibold border-l-2 border-indigo-500 bg-indigo-50 text-indigo-700'
                )}
                title={collapsed ? item.label : undefined}
              >
                {collapsed ? (
                  <span className="text-xs font-bold">
                    {item.label.charAt(0)}
                  </span>
                ) : (
                  <span className={cn(
                    // @ts-ignore - isIndex is not in the original type but we added it
                    item.isIndex && 'flex items-center gap-1'
                  )}>
                    {item.label}
                    {/* @ts-ignore - isIndex is not in the original type but we added it */}
                    {item.isIndex && (
                      <span className="text-xs bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full font-medium">
                        Index
                      </span>
                    )}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </div>
      </nav>

      <main
        className={cn(
          mainContentVariants({
            sidebarWidth,
            sidebarCollapsed: collapsed,
          }),
          'ml-0', // 모바일에서는 margin 없음
          collapsed
            ? 'md:ml-16'
            : sidebarWidth === 'sm'
              ? 'md:ml-64'
              : sidebarWidth === 'md'
                ? 'md:ml-72'
                : sidebarWidth === 'lg'
                  ? 'md:ml-80'
                  : 'md:ml-72'
        )}
      >
        {children}
      </main>
    </div>
  );
}

export default Layout;
