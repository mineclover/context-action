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

interface NavItem {
  path: string;
  label: string;
  category: 'main' | 'core' | 'store' | 'react' | 'demos' | 'examples' | 'actionguard' | 'refs' | 'utilities';
  isIndex?: boolean;
  disabled?: boolean;
  description?: string;
}

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

  const navItems: NavItem[] = [
    // === Core Concepts (기초 개념) ===
    { path: '/', label: 'Home', category: 'main' },
    { path: '/core/basics', label: '1. Core Basics', category: 'core' },
    { path: '/core/advanced', label: '2. Core Advanced', category: 'core' },
    { path: '/core/features', label: '3. 🚀 Core Features', category: 'core' },
    
    // === Store System (상태 관리) ===
    { path: '/store/basics', label: '4. Store Basics', category: 'store' },
    { path: '/store/immutability-test', label: '5. 🔒 Immutability Test', category: 'store' },
    
    // === React Integration (리액트 통합) ===
    { path: '/react/provider', label: '6. 🔧 Unified Provider', category: 'react' },
    { path: '/react/context', label: '7. 🏗️ React Context', category: 'react' },
    { path: '/react/hooks', label: '8. React Hooks', category: 'react' },
    { path: '/react/useActionWithResult', label: '9. ✨ useActionWithResult', category: 'react' },
    { path: '/unified-pattern/demo', label: '10. 🚀 Unified Pattern', category: 'react' },
    
    // === Practical Examples (실용 예제) ===
    { path: '/demos', label: '🎭 Context-Action Demos', category: 'demos', isIndex: true },
    { path: '/demos/store-scenarios', label: '🏪 Complete Store Collection (4 Core Demos)', category: 'demos', description: 'Essential store patterns for real-world applications' },
    { path: '/examples/element-management', label: '🎯 Element Management Demo', category: 'examples' },
    
    // === Advanced Demos (고급 데모) ===
    { path: '/actionguard/search', label: '🔍 Advanced Search Demo', category: 'actionguard' },
    { path: '/actionguard/scroll', label: '📜 Advanced Scroll Demo', category: 'actionguard' },
    { path: '/actionguard/mouse-events', label: '🖱️ Mouse Events Demo', category: 'actionguard' },
    { path: '/actionguard/api-blocking', label: '🚫 API Blocking Demo', category: 'actionguard', description: 'Working demo with unified structure' },
    { path: '/actionguard/priority-performance', label: '⚡ Priority Performance Demo', category: 'actionguard' },
    { path: '/actionguard/priority-performance-advanced', label: '🚀 Priority Performance Advanced', category: 'actionguard', description: 'Multi-instance advanced priority testing system' },
    { path: '/actionguard/throttle-comparison', label: '⚖️ Throttle Comparison Demo', category: 'actionguard' },
    
    // === Specialized Features (전문 기능) ===
    { path: '/refs', label: '🎯 Refs Management', category: 'refs', isIndex: true },
    { path: '/refs/canvas', label: '🎨 Canvas Ref Demo', category: 'refs' },
    { path: '/refs/form-builder', label: '📝 Form Builder Ref Demo', category: 'refs' },
    
    // === Utilities & Tools (유틸리티) ===
    { path: '/logger/demo', label: 'Logger System', category: 'utilities' },
    { path: '/examples/toast-config', label: '🍞 Toast Config Example', category: 'utilities' },
    { path: '/examples/concurrent-actions', label: '🔄 Concurrent Actions Test', category: 'utilities' },
    { path: '/examples/enhanced-search', label: '🔍 Enhanced Abortable Search', category: 'utilities' },
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
              Learning Path
            </h3>
          )}
          <nav className="space-y-1">
            {/* Core Concepts Section */}
            {!collapsed && (
              <div className="px-3 py-2">
                <h4 className="text-xs font-medium text-blue-600 mb-2">📚 Core Concepts</h4>
              </div>
            )}
            {navItems.filter(item => ['main', 'core', 'store', 'react'].includes(item.category)).map((item) => {
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    navItemVariants({
                      variant: isActive(item.path) ? 'active' : 'default',
                      category: item.category,
                    }),
                    item.isIndex &&
                      'font-semibold border-l-2 border-indigo-500 bg-indigo-50 text-indigo-700'
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  {collapsed ? (
                    <span className="text-xs font-bold">
                      {item.label.charAt(0)}
                    </span>
                  ) : (
                    <span
                      className={cn(
                        item.isIndex && 'flex items-center gap-1'
                      )}
                    >
                      {item.label}
                      {item.isIndex && (
                        <span className="text-xs bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full font-medium">
                          Index
                        </span>
                      )}
                    </span>
                  )}
                </Link>
              );
            })}

            {/* Practical Examples Section */}
            {!collapsed && (
              <div className="px-3 py-2 mt-4 border-t border-gray-200">
                <h4 className="text-xs font-medium text-green-600 mb-2">🎯 Practical Examples</h4>
              </div>
            )}
            {navItems.filter(item => ['demos', 'examples'].includes(item.category)).map((item) => {
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    navItemVariants({
                      variant: isActive(item.path) ? 'active' : 'default',
                      category: item.category,
                    }),
                    item.isIndex &&
                      'font-semibold border-l-2 border-indigo-500 bg-indigo-50 text-indigo-700'
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  {collapsed ? (
                    <span className="text-xs font-bold">
                      {item.label.charAt(0)}
                    </span>
                  ) : (
                    <span
                      className={cn(
                        item.isIndex && 'flex items-center gap-1'
                      )}
                    >
                      {item.label}
                      {item.isIndex && (
                        <span className="text-xs bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full font-medium">
                          Index
                        </span>
                      )}
                    </span>
                  )}
                </Link>
              );
            })}

            {/* Advanced Demos Section */}
            {!collapsed && (
              <div className="px-3 py-2 mt-4 border-t border-gray-200">
                <h4 className="text-xs font-medium text-purple-600 mb-2">🚀 Advanced Demos</h4>
              </div>
            )}
            {navItems.filter(item => ['actionguard'].includes(item.category)).map((item) => {
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    navItemVariants({
                      variant: isActive(item.path) ? 'active' : 'default',
                      category: item.category,
                    }),
                    item.isIndex &&
                      'font-semibold border-l-2 border-indigo-500 bg-indigo-50 text-indigo-700'
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  {collapsed ? (
                    <span className="text-xs font-bold">
                      {item.label.charAt(0)}
                    </span>
                  ) : (
                    <span
                      className={cn(
                        item.isIndex && 'flex items-center gap-1'
                      )}
                    >
                      {item.label}
                      {item.isIndex && (
                        <span className="text-xs bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full font-medium">
                          Index
                        </span>
                      )}
                    </span>
                  )}
                </Link>
              );
            })}

            {/* Specialized Features Section */}
            {!collapsed && (
              <div className="px-3 py-2 mt-4 border-t border-gray-200">
                <h4 className="text-xs font-medium text-orange-600 mb-2">🔧 Specialized Features</h4>
              </div>
            )}
            {navItems.filter(item => ['refs'].includes(item.category)).map((item) => {
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    navItemVariants({
                      variant: isActive(item.path) ? 'active' : 'default',
                      category: item.category,
                    }),
                    item.isIndex &&
                      'font-semibold border-l-2 border-indigo-500 bg-indigo-50 text-indigo-700'
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  {collapsed ? (
                    <span className="text-xs font-bold">
                      {item.label.charAt(0)}
                    </span>
                  ) : (
                    <span
                      className={cn(
                        item.isIndex && 'flex items-center gap-1'
                      )}
                    >
                      {item.label}
                      {item.isIndex && (
                        <span className="text-xs bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full font-medium">
                          Index
                        </span>
                      )}
                    </span>
                  )}
                </Link>
              );
            })}

            {/* Utilities & Tools Section */}
            {!collapsed && (
              <div className="px-3 py-2 mt-4 border-t border-gray-200">
                <h4 className="text-xs font-medium text-gray-500 mb-2">🛠️ Utilities & Tools</h4>
              </div>
            )}
            {navItems.filter(item => ['utilities'].includes(item.category)).map((item) => {
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    navItemVariants({
                      variant: isActive(item.path) ? 'active' : 'default',
                      category: item.category,
                    }),
                    item.isIndex &&
                      'font-semibold border-l-2 border-indigo-500 bg-indigo-50 text-indigo-700'
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  {collapsed ? (
                    <span className="text-xs font-bold">
                      {item.label.charAt(0)}
                    </span>
                  ) : (
                    <span
                      className={cn(
                        item.isIndex && 'flex items-center gap-1'
                      )}
                    >
                      {item.label}
                      {item.isIndex && (
                        <span className="text-xs bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full font-medium">
                          Index
                        </span>
                      )}
                    </span>
                  )}
                </Link>
              );
            })}
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
