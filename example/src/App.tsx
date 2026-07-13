import { lazy, Suspense, useEffect } from 'react';
import {
  Route,
  BrowserRouter as Router,
  Routes,
  useLocation,
} from 'react-router-dom';
// Core components - keep as regular imports
import Layout from './components/Layout';
import { ToastContainer, ToastControlPanel } from './components/ToastSystem';
import { useVitePressRedirect } from './hooks/useVitePressRedirect';
import { SourceLinkRegistryProvider } from './stores/SourceLinkRegistry';
import { LogArtHelpers } from './utils/logger';

// Lazy load large page components - Updated for catalog structure
// 🚀 Enhanced code splitting for better performance

// Warning Demo - New feature demonstration
const WarningDemoPage = lazy(() => import('./pages/WarningDemoPage'));

// Demos Index - Interactive demonstrations hub
const DemosIndexPage = lazy(() => import('./pages/DemosIndexPage'));

// Foundations - Core concepts (smaller chunks)
const CoreBasicsPage = lazy(
  () => import('./pages/foundations/core/BasicsPage')
);
const CoreAdvancedPage = lazy(
  () => import('./pages/foundations/core/AdvancedPage')
);
const StoreBasicsPage = lazy(
  () => import('./pages/foundations/store/BasicsPage')
);
const StoreImmutabilityTestPage = lazy(
  () => import('./pages/foundations/store/ImmutabilityTestPage')
);
const TimeTravelTestPage = lazy(
  () => import('./pages/foundations/store/TimeTravelTestPage')
);
const TimeTravelContextTestPage = lazy(
  () => import('./pages/foundations/store/TimeTravelContextTestPage')
);

// React foundations - Separate chunk for React-specific features
const ReactProviderPage = lazy(
  () => import('./pages/foundations/react/ProviderPage')
);
const ReactContextPage = lazy(
  () => import('./pages/foundations/react/ContextPage')
);
const ReactHooksPage = lazy(
  () => import('./pages/foundations/react/HooksPage')
);
const UseActionWithResultPage = lazy(
  () => import('./pages/foundations/react/UseActionWithResultPage')
);
const ImperativeRefPage = lazy(
  () => import('./pages/foundations/react/ImperativeRefPage')
);

// Performance - Action Guard (heavy performance components)
const ActionGuardIndexPage = lazy(
  () => import('./pages/performance/action-guard/ActionGuardIndexPage')
);
const ApiBlockingPage = lazy(
  () => import('./pages/performance/action-guard/ApiBlockingPage')
);
const ScrollPage = lazy(
  () => import('./pages/performance/action-guard/ScrollPage')
);
const SearchPage = lazy(
  () => import('./pages/performance/action-guard/SearchPage')
);
const ThrottleComparisonPage = lazy(
  () => import('./pages/performance/action-guard/ThrottleComparisonPage')
);
const AdvancedFilteringPage = lazy(
  () => import('./pages/performance/action-guard/AdvancedFilteringPage')
);

// Performance - Mouse Events (separate chunk for mouse event handling)
const ContextStoreMouseEventsPage = lazy(() =>
  import(
    './pages/performance/mouse-events/ActionGuardContextStoreMouseEventsPage'
  ).then((m) => ({ default: m.ContextStoreMouseEventsPage }))
);
const MouseEventsPage = lazy(
  () => import('./pages/performance/mouse-events/LegacyMouseEventsPage')
);
const MouseEventsIndexPage = lazy(() =>
  import('./pages/performance/mouse-events/MouseEventsIndexPage').then((m) => ({
    default: m.MouseEventsIndexPage,
  }))
);
const ContextStoreActionPage = lazy(() =>
  import('./pages/performance/mouse-events/ContextStoreActionPage').then(
    (m) => ({ default: m.ContextStoreActionPage })
  )
);
const EnhancedContextStorePage = lazy(
  () =>
    import(
      './pages/performance/mouse-events/enhanced-context-store/EnhancedContextStorePage'
    )
);
const NonReactiveContextStorePage = lazy(
  () =>
    import(
      './pages/performance/mouse-events/enhanced-context-store/NonReactiveContextStorePage'
    )
);
const CanvasRefDemoPage = lazy(() =>
  import('./pages/performance/mouse-events/CanvasRefDemoPage').then((m) => ({
    default: m.CanvasRefDemoPage,
  }))
);

// Performance - Priority System (separate chunk for priority management)
const PriorityPerformancePage = lazy(() =>
  import('./pages/performance/priority/PriorityPerformancePage').then((m) => ({
    default: m.PriorityPerformancePage,
  }))
);
const ActionPriorityDemoPage = lazy(
  () => import('./pages/performance/priority/DemoPage')
);

// Performance - Memoization (separate chunk for memoization demos)
const MemoizationPerformancePage = lazy(
  () => import('./pages/performance/memoization/MemoizationPerformancePage')
);
const MemoizationDemoPage = lazy(
  () => import('./pages/performance/memoization/DemoPage')
);

// Patterns - Business Logic (separate chunk for business logic patterns)
const BusinessLogicPage = lazy(
  () => import('./pages/patterns/business-logic/BusinessLogicPage')
);

// Patterns - Conditional (separate chunk for conditional patterns)
const ConditionalPatternsIndex = lazy(() =>
  import('./pages/patterns/conditional/ConditionalPatternsIndex').then((m) => ({
    default: m.ConditionalPatternsIndex,
  }))
);
const PermissionBasedExecution = lazy(() =>
  import('./pages/patterns/conditional/PermissionBasedExecution').then((m) => ({
    default: m.PermissionBasedExecution,
  }))
);
const FormValidation = lazy(() =>
  import('./pages/patterns/conditional/FormValidation').then((m) => ({
    default: m.FormValidation,
  }))
);
const WorkflowSteps = lazy(() =>
  import('./pages/patterns/conditional/WorkflowSteps').then((m) => ({
    default: m.WorkflowSteps,
  }))
);
const FeatureToggle = lazy(() =>
  import('./pages/patterns/conditional/FeatureToggle').then((m) => ({
    default: m.FeatureToggle,
  }))
);

// Patterns - Architecture (separate chunk for architecture patterns)
const LayeredArchitecturePage = lazy(
  () => import('./pages/patterns/layered-architecture/LayeredArchitecturePage')
);
const CanonicalOrderExamplePage = lazy(
  () =>
    import('./pages/patterns/implementation-playbook/CanonicalOrderExamplePage')
);
const ImplementationScenarioLibraryPage = lazy(
  () =>
    import(
      './pages/patterns/implementation-playbook/ImplementationScenarioLibraryPage'
    )
);
const AccessRequestExamplePage = lazy(
  () =>
    import(
      './pages/patterns/implementation-playbook/access-request/AccessRequestExamplePage'
    )
);
const IncidentEscalationExamplePage = lazy(
  () =>
    import(
      './pages/patterns/implementation-playbook/incident-escalation/IncidentEscalationExamplePage'
    )
);
const RenewalRiskReviewExamplePage = lazy(
  () =>
    import(
      './pages/patterns/implementation-playbook/renewal-risk-review/RenewalRiskReviewExamplePage'
    )
);
const FlowControlPlaygroundPage = lazy(() =>
  import('./pages/patterns/pipeline/FlowControlPlaygroundPageV2').then((m) => ({
    default: m.FlowControlPlaygroundPageV2,
  }))
);

// Patterns - Refs (separate chunk for ref patterns)
const RefsIndexPage = lazy(() =>
  import('./pages/patterns/refs/RefsIndexPage').then((m) => ({
    default: m.RefsIndexPage,
  }))
);
const WaitForRefsPerformancePage = lazy(() =>
  import('./pages/patterns/refs/WaitForRefsPerformancePage').then((m) => ({
    default: m.WaitForRefsPerformancePage,
  }))
);
const UseRefMountStateTestPage = lazy(() =>
  import('./pages/patterns/refs/UseRefMountStateTestPage').then((m) => ({
    default: m.UseRefMountStateTestPage,
  }))
);

// Integrations - Business (separate chunk for business use cases)
const ChatPage = lazy(() =>
  import('./pages/integrations/business/ChatPage').then((m) => ({
    default: m.ChatPage,
  }))
);

// Integrations - AI/LLM (ToolContext with OpenRouter and AI SDK)
const ToolContextAIDemo = lazy(
  () => import('./pages/integrations/ai/ToolContextAIDemo')
);
const ActionLifecycleWorkbenchPage = lazy(
  () =>
    import('./pages/integrations/action-lifecycle/ActionLifecycleWorkbenchPage')
);

// Integrations - Advanced (separate chunk for advanced features)
const FormBuilderDemoPage = lazy(() =>
  import('./pages/integrations/advanced/FormBuilderPage').then((m) => ({
    default: m.FormBuilderDemoPage,
  }))
);
const AdvancedCanvasExample = lazy(() =>
  import('./pages/integrations/advanced/CanvasPage').then((m) => ({
    default: m.AdvancedCanvasExample,
  }))
);
const ConcurrentActionTestPage = lazy(
  () => import('./pages/integrations/advanced/ConcurrentActionsPage')
);

// Utilities - Dev Tools (separate chunk for development utilities)
const LoggerDemoPage = lazy(
  () => import('./pages/utilities/dev-tools/LoggerPage')
);
const ToastConfigPage = lazy(
  () => import('./pages/utilities/dev-tools/ToastConfigPage')
);
const SourceLinkDirectory = lazy(() =>
  import('./pages/utilities/SourceLinkDirectory').then((m) => ({
    default: m.SourceLinkDirectory,
  }))
);

// Overview Pages (keep in root)
const ActionGuardOverview = lazy(
  () => import('./pages/catalog/performance/ActionGuardOverview')
);
const CoreConceptsOverview = lazy(
  () => import('./pages/catalog/foundations/CoreConceptsOverview')
);
const ExamplesUtilitiesOverview = lazy(
  () => import('./pages/catalog/utilities/ExamplesUtilitiesOverview')
);
const HomePage = lazy(() => import('./pages/HomePage'));

// Catalog Overview Pages
const FoundationsOverview = lazy(
  () => import('./pages/catalog/foundations/FoundationsOverview')
);
const PerformanceOverview = lazy(
  () => import('./pages/catalog/performance/PerformanceOverview')
);
const PatternsOverview = lazy(
  () => import('./pages/catalog/patterns/PatternsOverview')
);
const IntegrationsOverview = lazy(
  () => import('./pages/catalog/integrations/IntegrationsOverview')
);
const UtilitiesOverview = lazy(
  () => import('./pages/catalog/utilities/UtilitiesOverview')
);

// Legacy components
const EnhancedAbortableSearchExample = lazy(
  () => import('./components/EnhancedAbortableSearchExample')
);

// 라우트 변경 시 콘솔 클리어 (개발 환경에서만)
function ConsoleClearer() {
  const location = useLocation();

  useEffect(() => {
    // 개발 환경에서만 콘솔 클리어 (프로덕션이 아닌 경우)
    if (process.env.NODE_ENV !== 'production') {
      console.clear();
      console.info(LogArtHelpers.react.separator(`페이지 이동`));
      console.info(LogArtHelpers.react.info(`현재 경로: ${location.pathname}`));
      console.info(LogArtHelpers.react.separator());
    }
  }, [location.pathname]);

  return null;
}

function AppContent() {
  // VitePress에서 전달된 리디렉션 처리
  useVitePressRedirect();

  return (
    <>
      <ConsoleClearer />
      <Layout>
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-lg">Loading page...</div>
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<HomePage />} />

            {/* 📚 CATALOG - Main overview pages with better organization */}
            <Route
              path="/catalog/foundations"
              element={<FoundationsOverview />}
            />
            <Route
              path="/catalog/performance"
              element={<PerformanceOverview />}
            />
            <Route path="/catalog/patterns" element={<PatternsOverview />} />
            <Route
              path="/catalog/integrations"
              element={<IntegrationsOverview />}
            />
            <Route path="/catalog/utilities" element={<UtilitiesOverview />} />

            {/* Legacy Overview Pages (backward compatibility) */}
            <Route path="/overview/core" element={<CoreConceptsOverview />} />
            <Route
              path="/overview/actionguard"
              element={<ActionGuardOverview />}
            />
            <Route
              path="/overview/examples"
              element={<ExamplesUtilitiesOverview />}
            />

            {/* 🏗️ FOUNDATIONS - Core concepts and basic usage */}
            <Route
              path="/foundations/core/basics"
              element={<CoreBasicsPage />}
            />
            <Route
              path="/foundations/core/advanced"
              element={<CoreAdvancedPage />}
            />
            <Route
              path="/foundations/store/basics"
              element={<StoreBasicsPage />}
            />
            <Route
              path="/foundations/store/immutability-test"
              element={<StoreImmutabilityTestPage />}
            />
            <Route
              path="/foundations/store/time-travel"
              element={<TimeTravelTestPage />}
            />
            <Route
              path="/foundations/store/time-travel-context"
              element={<TimeTravelContextTestPage />}
            />
            <Route
              path="/foundations/react/provider"
              element={<ReactProviderPage />}
            />
            <Route
              path="/foundations/react/context"
              element={<ReactContextPage />}
            />
            <Route
              path="/foundations/react/hooks"
              element={<ReactHooksPage />}
            />
            <Route
              path="/foundations/react/useActionWithResult"
              element={<UseActionWithResultPage />}
            />
            <Route
              path="/foundations/react/imperativeRef"
              element={<ImperativeRefPage />}
            />

            {/* ⚡ PERFORMANCE - Optimization, Action Guard, Priority */}
            <Route
              path="/performance/action-guard"
              element={<ActionGuardIndexPage />}
            />
            <Route
              path="/performance/action-guard/search"
              element={<SearchPage />}
            />
            <Route
              path="/performance/action-guard/scroll"
              element={<ScrollPage />}
            />
            <Route
              path="/performance/action-guard/api-blocking"
              element={<ApiBlockingPage />}
            />
            <Route
              path="/performance/action-guard/throttle-comparison"
              element={<ThrottleComparisonPage />}
            />
            <Route
              path="/performance/action-guard/advanced-filtering"
              element={<AdvancedFilteringPage />}
            />
            <Route
              path="/performance/priority/advanced"
              element={<PriorityPerformancePage />}
            />
            <Route
              path="/performance/priority/demo"
              element={<ActionPriorityDemoPage />}
            />
            <Route
              path="/performance/mouse-events"
              element={<MouseEventsIndexPage />}
            />
            <Route
              path="/performance/mouse-events/legacy"
              element={<MouseEventsPage />}
            />
            <Route
              path="/performance/mouse-events/reactive"
              element={<EnhancedContextStorePage />}
            />
            <Route
              path="/performance/mouse-events/non-reactive"
              element={<NonReactiveContextStorePage />}
            />
            <Route
              path="/performance/mouse-events/context-store-action"
              element={<ContextStoreActionPage />}
            />
            <Route
              path="/performance/mouse-events/canvas-ref-demo"
              element={<CanvasRefDemoPage />}
            />
            <Route
              path="/performance/mouse-events/context-store"
              element={<ContextStoreMouseEventsPage />}
            />

            {/* Memoization Performance Routes */}
            <Route
              path="/performance"
              element={<MemoizationPerformancePage />}
            />
            <Route
              path="/performance/memoization"
              element={<MemoizationPerformancePage />}
            />
            <Route
              path="/performance/memoization/demo"
              element={<MemoizationDemoPage />}
            />

            {/* 🎛️ PATTERNS - Advanced patterns, conditional execution */}
            <Route
              path="/patterns/conditional"
              element={<ConditionalPatternsIndex />}
            />
            <Route
              path="/patterns/conditional/permissions"
              element={<PermissionBasedExecution />}
            />
            <Route
              path="/patterns/conditional/form-validation"
              element={<FormValidation />}
            />
            <Route
              path="/patterns/conditional/workflow-steps"
              element={<WorkflowSteps />}
            />
            <Route
              path="/patterns/conditional/feature-toggle"
              element={<FeatureToggle />}
            />
            <Route
              path="/patterns/business-logic"
              element={<BusinessLogicPage />}
            />
            <Route
              path="/patterns/layered-architecture"
              element={<LayeredArchitecturePage />}
            />
            <Route
              path="/patterns/implementation-playbook"
              element={<CanonicalOrderExamplePage />}
            />
            <Route
              path="/patterns/implementation-playbook/scenarios"
              element={<ImplementationScenarioLibraryPage />}
            />
            <Route
              path="/patterns/implementation-playbook/access-request"
              element={<AccessRequestExamplePage />}
            />
            <Route
              path="/patterns/implementation-playbook/incident-escalation"
              element={<IncidentEscalationExamplePage />}
            />
            <Route
              path="/patterns/implementation-playbook/renewal-risk-review"
              element={<RenewalRiskReviewExamplePage />}
            />
            <Route
              path="/patterns/pipeline/flow-control"
              element={<FlowControlPlaygroundPage />}
            />
            <Route path="/patterns/refs" element={<RefsIndexPage />} />
            <Route
              path="/patterns/refs/waitforrefs-performance"
              element={<WaitForRefsPerformancePage />}
            />
            <Route
              path="/patterns/refs/use-ref-mount-state-test"
              element={<UseRefMountStateTestPage />}
            />
            <Route
              path="/patterns/refs/canvas"
              element={<AdvancedCanvasExample />}
            />

            {/* 🧩 INTEGRATIONS - Real-world use cases */}
            <Route
              path="/integrations/action-lifecycle"
              element={<ActionLifecycleWorkbenchPage />}
            />
            <Route
              path="/integrations/tool-context-ai"
              element={<ToolContextAIDemo />}
            />
            <Route path="/integrations/business/chat" element={<ChatPage />} />
            <Route
              path="/integrations/advanced/form-builder"
              element={<FormBuilderDemoPage />}
            />
            <Route
              path="/integrations/advanced/canvas"
              element={<AdvancedCanvasExample />}
            />
            <Route
              path="/integrations/advanced/concurrent-actions"
              element={<ConcurrentActionTestPage />}
            />

            {/* 🛠️ UTILITIES - Development tools, debugging */}
            <Route
              path="/utilities/dev-tools/logger"
              element={<LoggerDemoPage />}
            />
            <Route
              path="/utilities/dev-tools/toast-config"
              element={<ToastConfigPage />}
            />
            <Route
              path="/utilities/dev-tools/warning-demo"
              element={<WarningDemoPage />}
            />
            <Route
              path="/utilities/source-directory"
              element={<SourceLinkDirectory />}
            />
            <Route
              path="/utilities/testing/enhanced-search"
              element={<EnhancedAbortableSearchExample />}
            />

            {/* Legacy Routes - Redirects for backward compatibility */}
            <Route path="/core/basics" element={<CoreBasicsPage />} />
            <Route path="/core/advanced" element={<CoreAdvancedPage />} />
            <Route path="/store/basics" element={<StoreBasicsPage />} />
            <Route
              path="/store/immutability-test"
              element={<StoreImmutabilityTestPage />}
            />
            <Route path="/react/provider" element={<ReactProviderPage />} />
            <Route path="/react/context" element={<ReactContextPage />} />
            <Route path="/react/hooks" element={<ReactHooksPage />} />
            <Route
              path="/react/useActionWithResult"
              element={<UseActionWithResultPage />}
            />
            <Route
              path="/react/imperativeRef"
              element={<ImperativeRefPage />}
            />
            <Route path="/actionguard" element={<ActionGuardIndexPage />} />
            <Route path="/actionguard/search" element={<SearchPage />} />
            <Route path="/actionguard/scroll" element={<ScrollPage />} />
            <Route
              path="/actionguard/api-blocking"
              element={<ApiBlockingPage />}
            />
            <Route
              path="/actionguard/throttle-comparison"
              element={<ThrottleComparisonPage />}
            />
            <Route
              path="/actionguard/advanced-filtering"
              element={<AdvancedFilteringPage />}
            />
            <Route
              path="/actionguard/priority-performance-advanced"
              element={<PriorityPerformancePage />}
            />
            <Route
              path="/actionguard/mouse-events"
              element={<MouseEventsIndexPage />}
            />
            <Route
              path="/actionguard/mouse-events/legacy"
              element={<MouseEventsPage />}
            />
            <Route
              path="/actionguard/mouse-events/reactive"
              element={<EnhancedContextStorePage />}
            />
            <Route
              path="/actionguard/mouse-events/non-reactive"
              element={<NonReactiveContextStorePage />}
            />
            <Route
              path="/actionguard/mouse-events/context-store-action"
              element={<ContextStoreActionPage />}
            />
            <Route
              path="/actionguard/mouse-events/canvas-ref-demo"
              element={<CanvasRefDemoPage />}
            />
            <Route
              path="/actionguard/mouse-events/context-store"
              element={<ContextStoreMouseEventsPage />}
            />
            <Route
              path="/actionguard/conditional"
              element={<ConditionalPatternsIndex />}
            />
            <Route
              path="/actionguard/conditional/permissions"
              element={<PermissionBasedExecution />}
            />
            <Route
              path="/actionguard/conditional/form-validation"
              element={<FormValidation />}
            />
            <Route
              path="/actionguard/conditional/workflow-steps"
              element={<WorkflowSteps />}
            />
            <Route
              path="/actionguard/conditional/feature-toggle"
              element={<FeatureToggle />}
            />
            <Route
              path="/pipeline/flow-control"
              element={<FlowControlPlaygroundPage />}
            />
            <Route path="/refs" element={<RefsIndexPage />} />
            <Route
              path="/refs/waitforrefs-performance"
              element={<WaitForRefsPerformancePage />}
            />
            <Route
              path="/refs/use-ref-mount-state-test"
              element={<UseRefMountStateTestPage />}
            />
            <Route path="/refs/canvas" element={<AdvancedCanvasExample />} />
            {/* 🛡️ ACTION GUARD - Performance optimization demos */}
            <Route path="/action-guard" element={<ActionGuardIndexPage />} />

            {/* 🎭 DEMOS - Interactive demonstrations */}
            <Route path="/demos" element={<DemosIndexPage />} />
            <Route path="/demos/chat" element={<ChatPage />} />
            <Route
              path="/demos/action-priority"
              element={<ActionPriorityDemoPage />}
            />
            <Route
              path="/examples/concurrent-actions"
              element={<ConcurrentActionTestPage />}
            />
            <Route
              path="/examples/toast-config"
              element={<ToastConfigPage />}
            />
            <Route
              path="/examples/enhanced-search"
              element={<EnhancedAbortableSearchExample />}
            />
            <Route path="/logger/demo" element={<LoggerDemoPage />} />
          </Routes>
        </Suspense>
      </Layout>

      {/* 글로벌 토스트 시스템 */}
      <ToastContainer />
      <ToastControlPanel />
    </>
  );
}

function App() {
  // 환경에 따라 basename 설정
  const basename =
    process.env.NODE_ENV === 'production' ? '/context-action/example' : '/';

  return (
    <SourceLinkRegistryProvider>
      <Router basename={basename}>
        <AppContent />
      </Router>
    </SourceLinkRegistryProvider>
  );
}

export default App;
