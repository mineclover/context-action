import type React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';


interface NavItem {
  path: string;
  label: string;
  category:
    | 'main'
    | 'core'
    | 'store'
    | 'action'
    | 'async'
    | 'architecture'
    | 'interaction'
    | 'pipeline'
    | 'react'
    | 'logger'
    | 'actionguard'
    | 'conditional'
    | 'examples'
    | 'refs'
    | 'demos'
    | 'performance'
    | 'utilities'
    | 'debug'
    | 'dev'
    | 'coming-soon';
  isIndex?: boolean;
  disabled?: boolean;
  description?: string;
  section?: 'basic' | 'intermediate' | 'advanced' | 'expert';
}

interface LayoutProps {
  children: React.ReactNode;
  variant?: 'default' | 'fullscreen';
  sidebarWidth?: 'sm' | 'md' | 'lg';
  collapsed?: boolean;
}

// Direct Tailwind classes for maximum style reusability
function navItemVariants({
  variant = 'default',
  category = 'main'
}: {
  variant?: 'default' | 'active' | 'disabled';
  category?: string;
}) {
  const baseClasses = 'block w-full px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200';

  const variantClasses = {
    default: 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
    active: 'bg-primary-100 text-primary-900 border-l-4 border-primary-600',
    disabled: 'text-gray-400 cursor-not-allowed opacity-60',
  };

  const categoryHoverClasses: Record<string, string> = {
    main: '',
    core: 'hover:bg-red-50 hover:text-red-900',
    store: 'hover:bg-green-50 hover:text-green-900',
    action: 'hover:bg-blue-50 hover:text-blue-900',
    async: 'hover:bg-purple-50 hover:text-purple-900',
    architecture: 'hover:bg-gray-50 hover:text-gray-900',
    interaction: 'hover:bg-indigo-50 hover:text-indigo-900',
    pipeline: 'hover:bg-orange-50 hover:text-orange-900',
    react: 'hover:bg-purple-50 hover:text-purple-900',
    logger: 'hover:bg-yellow-50 hover:text-yellow-900',
    actionguard: 'hover:bg-pink-50 hover:text-pink-900',
    conditional: 'hover:bg-cyan-50 hover:text-cyan-900',
    examples: 'hover:bg-orange-50 hover:text-orange-900',
    refs: 'hover:bg-blue-50 hover:text-blue-900',
    demos: 'hover:bg-emerald-50 hover:text-emerald-900',
    performance: 'hover:bg-red-50 hover:text-red-900',
    utilities: 'hover:bg-teal-50 hover:text-teal-900',
    debug: 'hover:bg-indigo-50 hover:text-indigo-900',
    dev: 'hover:bg-red-50 hover:text-red-900',
    'coming-soon': 'bg-gray-50 text-gray-500',
  };

  return `${baseClasses} ${variantClasses[variant]} ${categoryHoverClasses[category] || ''}`.trim();
}

function Layout({
  children,
  variant = 'default',
  sidebarWidth = 'md',
  collapsed = false,
}: LayoutProps) {
  const location = useLocation();

  const navItems: NavItem[] = [
    // === Main Navigation ===
    { path: '/', label: 'Home', category: 'main' },

    // === 5-Layer Architecture (최우선 표시) ===
    {
      path: '/patterns/layered-architecture',
      label: '🏗️ Layered Architecture',
      category: 'architecture',
      isIndex: true,
      description:
        'Revolutionary 6-layer pattern with Handler Injection and pure business logic',
    },
    {
      path: '/patterns/implementation-playbook',
      label: '🧪 Implementation Playbook',
      category: 'architecture',
      description:
        'Implementation-first canonical example with Action, Store, Ref, and testable boundaries',
    },

    // === Overview Pages (루트 개요) ===
    {
      path: '/overview/core',
      label: '🎯 Core Concepts Overview',
      category: 'main',
      isIndex: true,
      description: 'Complete guide to framework fundamentals',
    },
    {
      path: '/overview/actionguard',
      label: '🛡️ ActionGuard Overview',
      category: 'main',
      isIndex: true,
      description: 'Advanced demonstrations and patterns',
    },
    {
      path: '/overview/examples',
      label: '🛠️ Examples & Utilities Overview',
      category: 'main',
      isIndex: true,
      description: 'Practical tools and specialized features',
    },

    // === Core Concepts (기초 개념) ===
    { path: '/core/basics', label: '1. Core Basics', category: 'core' },
    { path: '/core/advanced', label: '2. Core Advanced', category: 'core' },

    // === Store System (상태 관리) ===
    { path: '/store/basics', label: '3. Store Basics', category: 'store' },
    {
      path: '/store/immutability-test',
      label: '4. 🔒 Immutability Test',
      category: 'store',
    },
    {
      path: '/foundations/store/time-travel',
      label: '5. 🕰️ Time Travel Store',
      category: 'store',
      description: 'Undo/Redo capabilities with state history',
    },
    {
      path: '/foundations/store/time-travel-context',
      label: '6. ⏪ Time Travel Context',
      category: 'store',
      description: 'Context pattern with patch-based optimization',
    },

    // === React Integration (리액트 통합) ===
    {
      path: '/react/provider',
      label: '5. 🔧 Unified Provider',
      category: 'react',
    },
    { path: '/react/context', label: '6. 🏗️ React Context', category: 'react' },
    { path: '/react/hooks', label: '7. React Hooks', category: 'react' },
    {
      path: '/react/useActionWithResult',
      label: '8. ✨ useActionWithResult',
      category: 'react',
    },
    {
      path: '/react/imperativeRef',
      label: '9. 🎯 useImperativeHandle + Ref Context',
      category: 'react',
    },

    // === Practical Examples (실용 예제) ===
    {
      path: '/demos',
      label: '🎭 Context-Action Demos',
      category: 'demos',
      isIndex: true,
    },

    // Individual Store Demos
    {
      path: '/demos/chat',
      label: '💬 Chat Demo',
      category: 'demos',
      description: 'Real-time messaging and auto-scroll features',
    },
    {
      path: '/integrations/tool-context-ai',
      label: '🤖 ToolContext + AI SDK',
      category: 'demos',
      description: 'AI controls UI through ToolContext with OpenRouter',
    },

    // === Advanced Demos (고급 데모) ===
    {
      path: '/action-guard',
      label: '🛡️ ActionGuard (Standardized)',
      category: 'actionguard',
      isIndex: true,
      description:
        'New standardized ActionGuard demonstrations with unified structure',
    },
    {
      path: '/actionguard/search',
      label: '🔍 Advanced Search Demo',
      category: 'actionguard',
    },
    {
      path: '/actionguard/scroll',
      label: '📜 Advanced Scroll Demo',
      category: 'actionguard',
    },
    {
      path: '/actionguard/api-blocking',
      label: '🚫 API Blocking Demo',
      category: 'actionguard',
      description: 'Working demo with unified structure',
    },
    // === Conditional Execution Patterns (조건부 실행 패턴) ===
    {
      path: '/actionguard/conditional',
      label: '🎯 Conditional Patterns',
      category: 'conditional',
      isIndex: true,
      section: 'basic',
      description: 'Complete conditional execution pattern collection',
    },
    {
      path: '/actionguard/conditional/permissions',
      label: '🔒 Permission-Based',
      category: 'conditional',
      section: 'intermediate',
      description: 'Role-based access control with audit logging',
    },
    {
      path: '/actionguard/conditional/form-validation',
      label: '📝 Form Validation',
      category: 'conditional',
      section: 'basic',
      description: 'Real-time validation with conditional submission',
    },
    {
      path: '/actionguard/conditional/workflow-steps',
      label: '⚡ Sequential Workflow',
      category: 'conditional',
      section: 'intermediate',
      description: 'Multi-step conditional execution with progress tracking',
    },
    {
      path: '/actionguard/conditional/feature-toggle',
      label: '🎛️ Feature Toggle',
      category: 'conditional',
      section: 'basic',
      description: 'Environment and user-based conditional features',
    },
    {
      path: '/actionguard/advanced-filtering',
      label: '🎛️ Advanced Filtering Demo',
      category: 'actionguard',
      description:
        'Sophisticated handler filtering strategies with result collection',
    },
    {
      path: '/actionguard/priority-performance-advanced',
      label: '🚀 Priority Performance Advanced',
      category: 'actionguard',
      description: 'Multi-instance advanced priority testing system',
    },
    {
      path: '/actionguard/throttle-comparison',
      label: '⚖️ Throttle Comparison Demo',
      category: 'actionguard',
    },

    // === Pipeline Features (파이프라인 기능) ===
    {
      path: '/pipeline/flow-control',
      label: '🔀 Flow Control Playground',
      category: 'pipeline',
      description:
        'Interactive priority jumping, early returns, and complex branching patterns',
    },

    // === Specialized Features (전문 기능) ===
    {
      path: '/refs',
      label: '🎯 Refs Management',
      category: 'refs',
      isIndex: true,
    },
    { path: '/refs/canvas', label: '🎨 Canvas Ref Demo', category: 'refs' },
    {
      path: '/actionguard/mouse-events',
      label: '🖱️ Mouse Events Demo',
      category: 'refs',
    },
    {
      path: '/refs/waitforrefs-performance',
      label: '⚡ useWaitForRefs Performance',
      category: 'refs',
      description:
        'Performance verification demo for useWaitForRefs optimization',
    },
    {
      path: '/refs/use-ref-mount-state-test',
      label: '🎯 useRefMountState Test',
      category: 'refs',
      description: 'Isolated test page for useRefMountState hook functionality',
    },

    // === Performance (성능) ===
    {
      path: '/performance',
      label: '⚡ Performance',
      category: 'performance',
      isIndex: true,
      description: 'Performance testing and optimization',
    },
    {
      path: '/performance/memoization',
      label: '🧠 Memoization Overview',
      category: 'performance',
      description: 'Memoization performance comparison',
    },
    {
      path: '/performance/memoization/demo',
      label: '🎯 Memoization Demo',
      category: 'performance',
      description: 'Real-time memoization comparison demo',
    },

    // === Utilities & Tools (유틸리티) ===
    {
      path: '/utilities/source-directory',
      label: '📝 Source Link Directory',
      category: 'utilities',
      description: 'View all registered source code links',
    },
    {
      path: '/utilities/dev-tools/warning-demo',
      label: '⚠️ Warning Messages Demo',
      category: 'utilities',
      description: 'Test Context-Action warning message features',
    },
    { path: '/logger/demo', label: 'Logger System', category: 'utilities' },
    {
      path: '/examples/toast-config',
      label: '🍞 Toast Config Example',
      category: 'utilities',
    },
    {
      path: '/examples/concurrent-actions',
      label: '🔄 Concurrent Actions Test',
      category: 'utilities',
    },
    {
      path: '/examples/enhanced-search',
      label: '🔍 Enhanced Abortable Search',
      category: 'utilities',
    },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex min-h-screen bg-gray-50 w-full max-w-full overflow-hidden">
      <nav
        className={cn(
          'fixed h-full overflow-y-auto bg-white border-r border-gray-200 transition-all duration-200 left-0 top-0 z-40',
          'hidden md:block',
          collapsed
            ? 'w-16'
            : sidebarWidth === 'sm'
              ? 'w-56 md:w-64'
              : sidebarWidth === 'md'
                ? 'w-64 md:w-72'
                : sidebarWidth === 'lg'
                  ? 'w-72 md:w-80'
                  : 'w-64 md:w-72'
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
                <h4 className="text-xs font-medium text-blue-600 mb-2">
                  📚 Core Concepts
                </h4>
              </div>
            )}
            {navItems
              .filter((item) =>
                ['main', 'architecture', 'core', 'store', 'react'].includes(
                  item.category
                )
              )
              .map((item) => {
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
                <h4 className="text-xs font-medium text-green-600 mb-2">
                  🎯 Practical Examples
                </h4>
              </div>
            )}
            {navItems
              .filter((item) => ['demos', 'examples'].includes(item.category))
              .map((item) => {
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
                <h4 className="text-xs font-medium text-purple-600 mb-2">
                  🚀 Advanced Demos
                </h4>
              </div>
            )}
            {navItems
              .filter((item) =>
                ['actionguard', 'pipeline'].includes(item.category)
              )
              .map((item) => {
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

            {/* Conditional Execution Patterns Section */}
            {!collapsed && (
              <div className="px-3 py-2 mt-4 border-t border-gray-200">
                <h4 className="text-xs font-medium text-indigo-600 mb-2">
                  🔄 Conditional Patterns
                </h4>
                <p className="text-xs text-gray-500 mb-2 px-1">
                  Environment-aware execution logic
                </p>
              </div>
            )}
            {navItems
              .filter((item) => item.category === 'conditional')
              .map((item) => {
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
                        'font-semibold border-l-2 border-indigo-500 bg-indigo-50 text-indigo-700',
                      item.section === 'expert' && 'border-l-2 border-red-300',
                      item.section === 'advanced' &&
                        'border-l-2 border-orange-300',
                      item.section === 'intermediate' &&
                        'border-l-2 border-yellow-300',
                      item.section === 'basic' && 'border-l-2 border-green-300'
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
                        {item.section && !item.isIndex && (
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded-full font-medium ml-2 ${
                              item.section === 'basic'
                                ? 'bg-green-100 text-green-600'
                                : item.section === 'intermediate'
                                  ? 'bg-yellow-100 text-yellow-600'
                                  : item.section === 'advanced'
                                    ? 'bg-orange-100 text-orange-600'
                                    : item.section === 'expert'
                                      ? 'bg-red-100 text-red-600'
                                      : ''
                            }`}
                          >
                            {item.section.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </span>
                    )}
                  </Link>
                );
              })}

            {/* Performance Section */}
            {!collapsed && (
              <div className="px-3 py-2 mt-4 border-t border-gray-200">
                <h4 className="text-xs font-medium text-red-600 mb-2">
                  ⚡ Performance
                </h4>
              </div>
            )}
            {navItems
              .filter((item) => item.category === 'performance')
              .map((item) => {
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
                        'font-semibold border-l-2 border-red-500 bg-red-50 text-red-700'
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
                          <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium">
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
                <h4 className="text-xs font-medium text-orange-600 mb-2">
                  🔧 Specialized Features
                </h4>
              </div>
            )}
            {navItems
              .filter((item) => ['refs'].includes(item.category))
              .map((item) => {
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
                <h4 className="text-xs font-medium text-gray-500 mb-2">
                  🛠️ Utilities & Tools
                </h4>
              </div>
            )}
            {navItems
              .filter((item) => ['utilities'].includes(item.category))
              .map((item) => {
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
          'flex-1 p-4 md:p-8 transition-all duration-200 w-full min-w-0 overflow-x-hidden',
          'ml-0',
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
