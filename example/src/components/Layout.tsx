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

interface NavSectionConfig {
  id: string;
  title: string;
  subtitle?: string;
  categories: NavItem['category'][];
  withTopDivider?: boolean;
}

const CONDITIONAL_SECTION_BORDERS: Record<
  NonNullable<NavItem['section']>,
  string
> = {
  basic: 'border-l-2 border-green-300',
  intermediate: 'border-l-2 border-yellow-300',
  advanced: 'border-l-2 border-orange-300',
  expert: 'border-l-2 border-red-300',
};

const CONDITIONAL_SECTION_BADGES: Record<
  NonNullable<NavItem['section']>,
  string
> = {
  basic: 'bg-green-100 text-green-600',
  intermediate: 'bg-yellow-100 text-yellow-600',
  advanced: 'bg-orange-100 text-orange-600',
  expert: 'bg-red-100 text-red-600',
};

const NAV_ITEMS: NavItem[] = [
  // === Main Navigation ===
  { path: '/', label: 'Home', category: 'main' },

  // === 6-Layer Context-Layered Architecture (최우선 표시) ===
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
    path: '/integrations/action-lifecycle',
    label: '⚙️ Action Lifecycle Workbench',
    category: 'architecture',
    description:
      'Priority, blocking, result collection, and abort behavior in one trace',
  },
  {
    path: '/integrations/react-aria-reference',
    label: '🗓️ React Aria Table + Calendar',
    category: 'architecture',
    description:
      'Keep React Aria interaction state local while Context-Action owns domain actions',
  },
  {
    path: '/integrations/headless-interactions',
    label: '🎛️ Headless Interactions (v5)',
    category: 'architecture',
    description:
      'createScopedContext, useDismissLayer, useRovingFocus, usePointerGesture & Dual-Lane fast/orchestrated',
  },
  {
    path: '/integrations/preact-web-components',
    label: '🧩 Preact Web Components',
    category: 'architecture',
    description:
      'Micro-Frontend bridge linking React 19 and Preact Signals Custom Elements with FACE',
  },
  {
    path: '/integrations/lit-web-components',
    label: '🔥 Lit Web Components',
    category: 'architecture',
    description:
      'Lit 3 Web Components with StoreController, ActionController, FACE and W3C Context Protocol',
  },
  {
    path: '/integrations/xstate-statechart',
    label: '🔀 XState & Effect Adapter',
    category: 'architecture',
    description:
      'Actor binding with enforceCanGuard, Standard Schema validation, and ActorStateReader',
  },
  {
    path: '/integrations/webmcp-scope',
    label: '🌐 WebMCP Tool Scope',
    category: 'architecture',
    description:
      'Scoped browser capability registration via useWebMCPToolScope with AbortSignal teardown',
  },
  {
    path: '/integrations/ai-sdk-tools',
    label: '🤖 AI SDK Tool Scope',
    category: 'architecture',
    description:
      'AI SDK v7 toolApproval queue, createAISDKToolScope, and redacted observability sink',
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
  {
    path: '/catalog/integrations',
    label: '🧩 Integrations Catalog',
    category: 'main',
    isIndex: true,
    description: 'Adapters, Web Components, Statecharts, and Tool Scopes',
  },
  {
    path: '/catalog/utilities',
    label: '🧰 Utilities Catalog',
    category: 'main',
    isIndex: true,
    description: 'Diagnostics, source directory, and testing helpers',
  },

  // === Core Concepts (기초 개념) ===
  {
    path: '/foundations/core/basics',
    label: '1. Core Basics',
    category: 'core',
  },
  {
    path: '/foundations/core/advanced',
    label: '2. Core Advanced',
    category: 'core',
  },

  // === Store System (상태 관리) ===
  {
    path: '/foundations/store/basics',
    label: '3. Store Basics',
    category: 'store',
  },
  {
    path: '/foundations/store/immutability-test',
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
  {
    path: '/foundations/store/backend-transactions',
    label: '7. 🏦 Backend & Transactions',
    category: 'store',
    description:
      'createStateStore adapter and multi-store atomic StoreTransactionCoordinator',
  },

  // === React Integration (리액트 통합) ===
  {
    path: '/foundations/react/provider',
    label: '8. 🔧 Unified Provider',
    category: 'react',
  },
  {
    path: '/foundations/react/context',
    label: '9. 🏗️ React Context',
    category: 'react',
  },
  {
    path: '/foundations/react/hooks',
    label: '10. React Hooks',
    category: 'react',
  },
  {
    path: '/foundations/react/useActionWithResult',
    label: '11. ✨ useActionWithResult',
    category: 'react',
  },
  {
    path: '/foundations/react/imperativeRef',
    label: '12. 🎯 useImperativeHandle + Ref Context',
    category: 'react',
  },
  {
    path: '/foundations/react/headless-di',
    label: '13. 🧬 Headless-First Symmetric DI',
    category: 'react',
    description:
      'Inject external ActionRegister, Store, and TimeTravelStoreManager via ownership="shared"',
  },

  // === Practical Examples (실용 예제) ===
  {
    path: '/demos',
    label: '🎭 Context-Action Demos',
    category: 'demos',
    isIndex: true,
  },
  {
    path: '/integrations/business/chat',
    label: '💬 Chat Demo',
    category: 'demos',
    description: 'Real-time messaging and auto-scroll features',
  },
  {
    path: '/integrations/advanced/form-builder',
    label: '📝 Form Builder Demo',
    category: 'demos',
    description: 'Dynamic form building with ref-based field management',
  },
  {
    path: '/catalog/integrations/mcp-function-calling',
    label: '🧩 MCP / Function Calling Catalog',
    category: 'demos',
    description: 'Reusable prompts and expected ToolContext execution chains',
  },

  // === Advanced Demos (고급 데모) ===
  {
    path: '/performance/action-guard',
    label: '🛡️ ActionGuard (Standardized)',
    category: 'actionguard',
    isIndex: true,
    description:
      'New standardized ActionGuard demonstrations with unified structure',
  },
  {
    path: '/performance/action-guard/search',
    label: '🔍 Advanced Search Demo',
    category: 'actionguard',
  },
  {
    path: '/performance/action-guard/scroll',
    label: '📜 Advanced Scroll Demo',
    category: 'actionguard',
  },
  {
    path: '/performance/action-guard/api-blocking',
    label: '🚫 API Blocking Demo',
    category: 'actionguard',
    description: 'Working demo with unified structure',
  },
  {
    path: '/performance/action-guard/advanced-filtering',
    label: '🎛️ Advanced Filtering Demo',
    category: 'actionguard',
    description:
      'Sophisticated handler filtering strategies with result collection',
  },
  {
    path: '/performance/priority/advanced',
    label: '🚀 Priority Performance Advanced',
    category: 'actionguard',
    description: 'Multi-instance advanced priority testing system',
  },
  {
    path: '/performance/action-guard/throttle-comparison',
    label: '⚖️ Throttle Comparison Demo',
    category: 'actionguard',
  },

  // === Conditional Execution Patterns (조건부 실행 패턴) ===
  {
    path: '/patterns/conditional',
    label: '🎯 Conditional Patterns',
    category: 'conditional',
    isIndex: true,
    section: 'basic',
    description: 'Complete conditional execution pattern collection',
  },
  {
    path: '/patterns/conditional/permissions',
    label: '🔒 Permission-Based',
    category: 'conditional',
    section: 'intermediate',
    description: 'Role-based access control with audit logging',
  },
  {
    path: '/patterns/conditional/form-validation',
    label: '📝 Form Validation',
    category: 'conditional',
    section: 'basic',
    description: 'Real-time validation with conditional submission',
  },
  {
    path: '/patterns/conditional/workflow-steps',
    label: '⚡ Sequential Workflow',
    category: 'conditional',
    section: 'intermediate',
    description: 'Multi-step conditional execution with progress tracking',
  },
  {
    path: '/patterns/conditional/feature-toggle',
    label: '🎛️ Feature Toggle',
    category: 'conditional',
    section: 'basic',
    description: 'Environment and user-based conditional features',
  },

  // === Pipeline Features (파이프라인 기능) ===
  {
    path: '/patterns/pipeline/flow-control',
    label: '🔀 Flow Control Playground',
    category: 'pipeline',
    description:
      'Interactive priority jumping, early returns, and complex branching patterns',
  },

  // === Specialized Features (전문 기능) ===
  {
    path: '/patterns/refs',
    label: '🎯 Refs Management',
    category: 'refs',
    isIndex: true,
  },
  {
    path: '/patterns/refs/canvas',
    label: '🎨 Canvas Ref Demo',
    category: 'refs',
  },
  {
    path: '/performance/mouse-events',
    label: '🖱️ Mouse Events Demo',
    category: 'refs',
  },
  {
    path: '/patterns/refs/waitforrefs-performance',
    label: '⚡ useWaitForRefs Performance',
    category: 'refs',
    description:
      'Performance verification demo for useWaitForRefs optimization',
  },
  {
    path: '/patterns/refs/use-ref-mount-state-test',
    label: '🎯 useRefMountState Test',
    category: 'refs',
    description: 'Isolated test page for useRefMountState hook functionality',
  },

  // === Performance (성능) ===
  {
    path: '/catalog/performance',
    label: '⚡ Performance',
    category: 'performance',
    isIndex: true,
    description: 'Performance testing and optimization',
  },
  {
    path: '/performance',
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
  {
    path: '/performance/memoization/analysis',
    label: '📊 Memoization Analysis',
    category: 'performance',
    description: 'Interpret memoization measurements and trends',
  },
  {
    path: '/performance/memoization/guidelines',
    label: '📘 Memoization Guidelines',
    category: 'performance',
    description: 'Guidance for choosing memoization boundaries',
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
  {
    path: '/utilities/dev-tools/store-scenarios',
    label: '🏪 Store Scenarios & Comparison Strategies',
    category: 'utilities',
    description:
      'Compare reference/shallow/deep store comparison strategies and live chat state',
  },
  {
    path: '/utilities/dev-tools/logger',
    label: 'Logger System',
    category: 'utilities',
  },
  {
    path: '/utilities/dev-tools/toast-config',
    label: '🍞 Toast Config Example',
    category: 'utilities',
  },
  {
    path: '/integrations/advanced/concurrent-actions',
    label: '🔄 Concurrent Actions Test',
    category: 'utilities',
  },
  {
    path: '/utilities/testing/enhanced-search',
    label: '🔍 Enhanced Abortable Search',
    category: 'utilities',
  },
];

const NAV_SECTIONS: NavSectionConfig[] = [
  {
    id: 'core',
    title: '🧭 Architecture & Runtime',
    categories: ['main', 'architecture', 'core', 'store', 'react'],
    withTopDivider: false,
  },
  {
    id: 'examples',
    title: '🎯 Practical Examples',
    categories: ['demos', 'examples'],
    withTopDivider: true,
  },
  {
    id: 'advanced',
    title: '🚀 Advanced Demos',
    categories: ['actionguard', 'pipeline'],
    withTopDivider: true,
  },
  {
    id: 'conditional',
    title: '🔄 Conditional Patterns',
    subtitle: 'Environment-aware execution logic',
    categories: ['conditional'],
    withTopDivider: true,
  },
  {
    id: 'performance',
    title: '⚡ Performance',
    categories: ['performance'],
    withTopDivider: true,
  },
  {
    id: 'specialized',
    title: '🔧 Specialized Features',
    categories: ['refs'],
    withTopDivider: true,
  },
  {
    id: 'utilities',
    title: '🛠️ Utilities & Tools',
    categories: ['utilities'],
    withTopDivider: true,
  },
];

function NavSection({
  section,
  items,
  collapsed,
  pathname,
}: {
  section: NavSectionConfig;
  items: NavItem[];
  collapsed: boolean;
  pathname: string;
}) {
  return (
    <>
      {!collapsed && (
        <div
          className={cn(
            'px-3 py-2',
            section.withTopDivider &&
              'mt-4 border-t border-[var(--astryx-color-border)]'
          )}
        >
          <h4 className="text-xs font-semibold text-slate-600 mb-2 tracking-wide">
            {section.title}
          </h4>
          {section.subtitle && (
            <p className="text-xs text-gray-500 mb-2 px-1">
              {section.subtitle}
            </p>
          )}
        </div>
      )}
      {items.map((item) => {
        const isActive = pathname === item.path;
        const isConditional = section.id === 'conditional';
        const indexBadgeClass =
          item.category === 'performance'
            ? 'bg-red-100 text-red-600'
            : 'bg-indigo-100 text-indigo-600';

        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              navItemVariants({
                variant: isActive ? 'active' : 'default',
                category: item.category,
              }),
              item.isIndex && 'font-semibold',
              isConditional &&
                item.isIndex &&
                'border-l-2 border-indigo-500 bg-indigo-50 text-indigo-700',
              isConditional &&
                item.section &&
                CONDITIONAL_SECTION_BORDERS[item.section]
            )}
            title={collapsed ? item.label : undefined}
          >
            {collapsed ? (
              <span className="text-xs font-bold">{item.label.charAt(0)}</span>
            ) : (
              <span className={cn(item.isIndex && 'flex items-center gap-1')}>
                {item.label}
                {item.isIndex && (
                  <span
                    className={cn(
                      'text-xs px-1.5 py-0.5 rounded-full font-medium',
                      indexBadgeClass
                    )}
                  >
                    Index
                  </span>
                )}
                {isConditional && item.section && !item.isIndex && (
                  <span
                    className={cn(
                      'text-xs px-1.5 py-0.5 rounded-full font-medium ml-2',
                      CONDITIONAL_SECTION_BADGES[item.section]
                    )}
                  >
                    {item.section.charAt(0).toUpperCase()}
                  </span>
                )}
              </span>
            )}
          </Link>
        );
      })}
    </>
  );
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
  sidebarWidth = 'md',
  collapsed = false,
}: LayoutProps) {
  const location = useLocation();

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
            {NAV_SECTIONS.map((section) => (
              <NavSection
                key={section.id}
                section={section}
                items={NAV_ITEMS.filter((item) =>
                  section.categories.includes(item.category)
                )}
                collapsed={collapsed}
                pathname={location.pathname}
              />
            ))}
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
