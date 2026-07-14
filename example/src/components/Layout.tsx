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
  category = 'main',
}: {
  variant?: 'default' | 'active' | 'disabled';
  category?: string;
}) {
  const baseClasses = 'astryx-nav-item';

  const variantClasses = {
    default: 'astryx-nav-item-default',
    active: 'astryx-nav-item-active',
    disabled: 'astryx-nav-item-disabled',
  };

  const categoryClass =
    category === 'coming-soon' ? 'astryx-nav-item-coming-soon' : '';

  return `${baseClasses} ${variantClasses[variant]} ${categoryClass}`.trim();
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
    {
      path: '/integrations/live-code-editor',
      label: '🧭 Usecase Boundary Lab',
      category: 'architecture',
      description:
        'Live editor for Contract, Runtime, Facade, and Recipe boundaries',
    },
    {
      path: '/integrations/live-web-coding',
      label: '⚡ Realtime Web Coding',
      category: 'architecture',
      description:
        'AI chat and visible web tools update a browser-local HTML/CSS/JS workspace',
    },
    {
      path: '/integrations/action-lifecycle',
      label: '⚙️ Action Lifecycle Workbench',
      category: 'architecture',
      description:
        'Priority, blocking, result collection, and abort behavior in one trace',
    },
    {
      path: '/patterns/implementation-playbook/scenarios',
      label: '🗂️ Playbook Scenarios',
      category: 'architecture',
      description:
        'Scenario library that maps the same implementation-playbook logic to other domains',
    },
    {
      path: '/patterns/implementation-playbook/access-request',
      label: '🔐 Access Request Playbook',
      category: 'architecture',
      description:
        'Approval-oriented interactive example built from the same implementation-playbook skill',
    },
    {
      path: '/patterns/implementation-playbook/incident-escalation',
      label: '🚨 Incident Escalation Playbook',
      category: 'architecture',
      description:
        'Incident-oriented interactive example built from the same implementation-playbook skill',
    },
    {
      path: '/patterns/implementation-playbook/renewal-risk-review',
      label: '📈 Renewal Risk Review Playbook',
      category: 'architecture',
      description:
        'Renewal-oriented interactive example built from the same implementation-playbook skill',
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
      description:
        'AI SDK v7 tool loop controls UI through ToolContext and OpenRouter',
    },
    {
      path: '/catalog/integrations/mcp-function-calling',
      label: '🧩 MCP / Function Calling Catalog',
      category: 'demos',
      description: 'Reusable prompts and expected ToolContext execution chains',
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
    <div className="flex min-h-screen bg-[var(--astryx-color-background-canvas)] w-full max-w-full overflow-hidden">
      <nav
        className={cn(
          'fixed h-full overflow-y-auto bg-[var(--astryx-color-background-surface)] border-r border-[var(--astryx-color-border)] transition-all duration-200 left-0 top-0 z-40 shadow-[var(--astryx-shadow-low)]',
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
        <div className="p-5 border-b border-[var(--astryx-color-border)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-900 rounded-md flex items-center justify-center">
              <span className="text-white font-semibold text-xs tracking-tight">
                CA
              </span>
            </div>
            {!collapsed && (
              <div>
                <h2 className="text-base font-semibold tracking-tight text-slate-900">
                  Context-Action
                </h2>
                <p className="text-[11px] text-slate-500">
                  Astryx-neutral examples
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Section */}
        <div className="p-4">
          {!collapsed && (
            <h3 className="px-3 mb-3 text-xs font-semibold text-slate-500 uppercase tracking-[0.14em]">
              Learning Path
            </h3>
          )}
          <nav className="space-y-1">
            {/* Core Concepts Section */}
            {!collapsed && (
              <div className="px-3 py-2">
                <h4 className="text-xs font-semibold text-slate-600 mb-2 tracking-wide">
                  🧭 Architecture & Runtime
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
                      item.isIndex && 'font-semibold'
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
              <div className="px-3 py-2 mt-4 border-t border-[var(--astryx-color-border)]">
                <h4 className="text-xs font-semibold text-slate-600 mb-2 tracking-wide">
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
                      item.isIndex && 'font-semibold'
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
              <div className="px-3 py-2 mt-4 border-t border-[var(--astryx-color-border)]">
                <h4 className="text-xs font-semibold text-slate-600 mb-2 tracking-wide">
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
                      item.isIndex && 'font-semibold'
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
              <div className="px-3 py-2 mt-4 border-t border-[var(--astryx-color-border)]">
                <h4 className="text-xs font-semibold text-slate-600 mb-2 tracking-wide">
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
              <div className="px-3 py-2 mt-4 border-t border-[var(--astryx-color-border)]">
                <h4 className="text-xs font-semibold text-slate-600 mb-2 tracking-wide">
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
                      item.isIndex && 'font-semibold'
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
              <div className="px-3 py-2 mt-4 border-t border-[var(--astryx-color-border)]">
                <h4 className="text-xs font-semibold text-slate-600 mb-2 tracking-wide">
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
                      item.isIndex && 'font-semibold'
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
              <div className="px-3 py-2 mt-4 border-t border-[var(--astryx-color-border)]">
                <h4 className="text-xs font-semibold text-slate-600 mb-2 tracking-wide">
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
                      item.isIndex && 'font-semibold'
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
