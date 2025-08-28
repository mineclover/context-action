import { LogArtHelpers } from './utils/logger';
import { useEffect, Suspense, lazy } from 'react';
import {
  Route,
  BrowserRouter as Router,
  Routes,
  useLocation,
} from 'react-router-dom';
// Core components - keep as regular imports
import Layout from './components/Layout';
import { ToastContainer, ToastControlPanel } from './components/ToastSystem';

// Lazy load large page components - Updated for catalog structure

// Foundations
const CoreBasicsPage = lazy(() => import('./pages/foundations/core/BasicsPage'));
const CoreAdvancedPage = lazy(() => import('./pages/foundations/core/AdvancedPage'));
const StoreBasicsPage = lazy(() => import('./pages/foundations/store/BasicsPage'));
const StoreImmutabilityTestPage = lazy(() => import('./pages/foundations/store/ImmutabilityTestPage'));
const ReactProviderPage = lazy(() => import('./pages/foundations/react/ProviderPage'));
const ReactContextPage = lazy(() => import('./pages/foundations/react/ContextPage'));
const ReactHooksPage = lazy(() => import('./pages/foundations/react/HooksPage'));
const UseActionWithResultPage = lazy(() => import('./pages/foundations/react/UseActionWithResultPage'));

// Performance
const ActionGuardIndexPage = lazy(() => import('./pages/performance/action-guard/ActionGuardIndexPage'));
const ActionGuardPage = lazy(() => import('./pages/performance/action-guard/ActionGuardPage'));
const ApiBlockingPage = lazy(() => import('./pages/performance/action-guard/ApiBlockingPage'));
const ContextStoreMouseEventsPage = lazy(() => import('./pages/performance/action-guard/ContextStoreMouseEventsPage').then(m => ({ default: m.ContextStoreMouseEventsPage })));
const MouseEventsPage = lazy(() => import('./pages/performance/action-guard/MouseEventsPage'));
const ScrollPage = lazy(() => import('./pages/performance/action-guard/ScrollPage'));
const SearchPage = lazy(() => import('./pages/performance/action-guard/SearchPage'));
const ThrottleComparisonPage = lazy(() => import('./pages/performance/action-guard/ThrottleComparisonPage'));
const AdvancedFilteringPage = lazy(() => import('./pages/performance/action-guard/AdvancedFilteringPage'));
const PriorityPerformancePage = lazy(() => import('./pages/performance/priority/PriorityPerformancePage').then(m => ({ default: m.PriorityPerformancePage })));
const ActionPriorityDemoPage = lazy(() => import('./pages/performance/priority/DemoPage'));
const MouseEventsIndexPage = lazy(() => import('./pages/performance/mouse-events/MouseEventsIndexPage').then(m => ({ default: m.MouseEventsIndexPage })));
const ContextStoreActionPage = lazy(() => import('./pages/performance/mouse-events/ContextStoreActionPage').then(m => ({ default: m.ContextStoreActionPage })));
const EnhancedContextStorePage = lazy(() => import('./pages/performance/mouse-events/EnhancedContextStorePage').then(m => ({ default: m.EnhancedContextStorePage })));

// Patterns
const ConditionalPatternsIndex = lazy(() => import('./pages/patterns/conditional/ConditionalPatternsIndex').then(m => ({ default: m.ConditionalPatternsIndex })));
const PermissionBasedExecution = lazy(() => import('./pages/patterns/conditional/PermissionBasedExecution').then(m => ({ default: m.PermissionBasedExecution })));
const FormValidation = lazy(() => import('./pages/patterns/conditional/FormValidation').then(m => ({ default: m.FormValidation })));
const WorkflowSteps = lazy(() => import('./pages/patterns/conditional/WorkflowSteps').then(m => ({ default: m.WorkflowSteps })));
const FeatureToggle = lazy(() => import('./pages/patterns/conditional/FeatureToggle').then(m => ({ default: m.FeatureToggle })));
const FlowControlPlaygroundPage = lazy(() => import('./pages/patterns/pipeline/FlowControlPlaygroundPage').then(m => ({ default: m.FlowControlPlaygroundPage })));
const RefsIndexPage = lazy(() => import('./pages/patterns/refs/RefsIndexPage').then(m => ({ default: m.RefsIndexPage })));
const FormBuilderRefDemoPage = lazy(() => import('./pages/patterns/refs/FormBuilderRefDemoPage').then(m => ({ default: m.FormBuilderRefDemoPage })));
const WaitForRefsPerformancePage = lazy(() => import('./pages/patterns/refs/WaitForRefsPerformancePage').then(m => ({ default: m.WaitForRefsPerformancePage })));

// Integrations
const TodoListPage = lazy(() => import('./pages/integrations/business/TodoListPage').then(m => ({ default: m.TodoListPage })));
const ShoppingCartPage = lazy(() => import('./pages/integrations/business/ShoppingCartPage').then(m => ({ default: m.ShoppingCartPage })));
const ChatPage = lazy(() => import('./pages/integrations/business/ChatPage').then(m => ({ default: m.ChatPage })));
const UserProfilePage = lazy(() => import('./pages/integrations/business/UserProfilePage').then(m => ({ default: m.UserProfilePage })));
const ElementManagementPage = lazy(() => import('./pages/integrations/advanced/ElementManagementPage').then(m => ({ default: m.ElementManagementPage })));
const FormBuilderDemoPage = lazy(() => import('./pages/integrations/advanced/FormBuilderPage').then(m => ({ default: m.FormBuilderDemoPage })));
const AdvancedCanvasExample = lazy(() => import('./pages/integrations/advanced/CanvasPage').then(m => ({ default: m.AdvancedCanvasExample })));
const ConcurrentActionTestPage = lazy(() => import('./pages/integrations/advanced/ConcurrentActionsPage'));

// Utilities
const LoggerDemoPage = lazy(() => import('./pages/utilities/dev-tools/LoggerPage'));
const ToastConfigPage = lazy(() => import('./pages/utilities/dev-tools/ToastConfigPage'));
const StoreScenariosPage = lazy(() => import('./pages/utilities/dev-tools/StoreScenariosPage').then(m => ({ default: m.StoreScenariosPage })));

// Overview Pages (keep in root)
const ActionGuardOverview = lazy(() => import('./pages/ActionGuardOverview'));
const CoreConceptsOverview = lazy(() => import('./pages/CoreConceptsOverview'));
const ExamplesUtilitiesOverview = lazy(() => import('./pages/ExamplesUtilitiesOverview'));
const HomePage = lazy(() => import('./pages/HomePage'));

// Legacy components
const EnhancedAbortableSearchExample = lazy(() => import('./components/EnhancedAbortableSearchExample'));
const DemosIndexPage = lazy(() => import('./pages/utilities/dev-tools/StoreScenariosPage').then(m => ({ default: m.StoreScenariosPage })));

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
  return (
    <>
      <ConsoleClearer />
      <Layout>
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">Loading page...</div>
        </div>}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            
            {/* Overview Pages */}
            <Route path="/overview/core" element={<CoreConceptsOverview />} />
            <Route path="/overview/actionguard" element={<ActionGuardOverview />} />
            <Route path="/overview/examples" element={<ExamplesUtilitiesOverview />} />
            
            {/* 🏗️ FOUNDATIONS - Core concepts and basic usage */}
            <Route path="/foundations/core/basics" element={<CoreBasicsPage />} />
            <Route path="/foundations/core/advanced" element={<CoreAdvancedPage />} />
            <Route path="/foundations/store/basics" element={<StoreBasicsPage />} />
            <Route path="/foundations/store/immutability-test" element={<StoreImmutabilityTestPage />} />
            <Route path="/foundations/react/provider" element={<ReactProviderPage />} />
            <Route path="/foundations/react/context" element={<ReactContextPage />} />
            <Route path="/foundations/react/hooks" element={<ReactHooksPage />} />
            <Route path="/foundations/react/useActionWithResult" element={<UseActionWithResultPage />} />
            
            {/* ⚡ PERFORMANCE - Optimization, Action Guard, Priority */}
            <Route path="/performance/action-guard" element={<ActionGuardIndexPage />} />
            <Route path="/performance/action-guard/search" element={<SearchPage />} />
            <Route path="/performance/action-guard/scroll" element={<ScrollPage />} />
            <Route path="/performance/action-guard/api-blocking" element={<ApiBlockingPage />} />
            <Route path="/performance/action-guard/throttle-comparison" element={<ThrottleComparisonPage />} />
            <Route path="/performance/action-guard/advanced-filtering" element={<AdvancedFilteringPage />} />
            <Route path="/performance/priority/advanced" element={<PriorityPerformancePage />} />
            <Route path="/performance/priority/demo" element={<ActionPriorityDemoPage />} />
            <Route path="/performance/mouse-events" element={<MouseEventsIndexPage />} />
            <Route path="/performance/mouse-events/enhanced-context-store" element={<EnhancedContextStorePage />} />
            <Route path="/performance/mouse-events/context-store-action" element={<ContextStoreActionPage />} />
            <Route path="/performance/mouse-events/legacy" element={<MouseEventsPage />} />
            <Route path="/performance/mouse-events/context-store" element={<ContextStoreMouseEventsPage />} />
            
            {/* 🎛️ PATTERNS - Advanced patterns, conditional execution */}
            <Route path="/patterns/conditional" element={<ConditionalPatternsIndex />} />
            <Route path="/patterns/conditional/permissions" element={<PermissionBasedExecution />} />
            <Route path="/patterns/conditional/form-validation" element={<FormValidation />} />
            <Route path="/patterns/conditional/workflow-steps" element={<WorkflowSteps />} />
            <Route path="/patterns/conditional/feature-toggle" element={<FeatureToggle />} />
            <Route path="/patterns/pipeline/flow-control" element={<FlowControlPlaygroundPage />} />
            <Route path="/patterns/refs" element={<RefsIndexPage />} />
            <Route path="/patterns/refs/form-builder" element={<FormBuilderRefDemoPage />} />
            <Route path="/patterns/refs/waitforrefs-performance" element={<WaitForRefsPerformancePage />} />
            <Route path="/patterns/refs/canvas" element={<AdvancedCanvasExample />} />
            
            {/* 🧩 INTEGRATIONS - Real-world use cases */}
            <Route path="/integrations/business/todo-list" element={<TodoListPage />} />
            <Route path="/integrations/business/shopping-cart" element={<ShoppingCartPage />} />
            <Route path="/integrations/business/chat" element={<ChatPage />} />
            <Route path="/integrations/business/user-profile" element={<UserProfilePage />} />
            <Route path="/integrations/advanced/element-management" element={<ElementManagementPage />} />
            <Route path="/integrations/advanced/form-builder" element={<FormBuilderDemoPage />} />
            <Route path="/integrations/advanced/canvas" element={<AdvancedCanvasExample />} />
            <Route path="/integrations/advanced/concurrent-actions" element={<ConcurrentActionTestPage />} />
            
            {/* 🛠️ UTILITIES - Development tools, debugging */}
            <Route path="/utilities/dev-tools/logger" element={<LoggerDemoPage />} />
            <Route path="/utilities/dev-tools/toast-config" element={<ToastConfigPage />} />
            <Route path="/utilities/dev-tools/store-scenarios" element={<StoreScenariosPage />} />
            <Route path="/utilities/testing/enhanced-search" element={<EnhancedAbortableSearchExample />} />
            
            {/* Legacy Routes - Redirects for backward compatibility */}
            <Route path="/core/basics" element={<CoreBasicsPage />} />
            <Route path="/core/advanced" element={<CoreAdvancedPage />} />
            <Route path="/store/basics" element={<StoreBasicsPage />} />
            <Route path="/store/immutability-test" element={<StoreImmutabilityTestPage />} />
            <Route path="/react/provider" element={<ReactProviderPage />} />
            <Route path="/react/context" element={<ReactContextPage />} />
            <Route path="/react/hooks" element={<ReactHooksPage />} />
            <Route path="/react/useActionWithResult" element={<UseActionWithResultPage />} />
            <Route path="/actionguard" element={<ActionGuardIndexPage />} />
            <Route path="/actionguard/search" element={<SearchPage />} />
            <Route path="/actionguard/scroll" element={<ScrollPage />} />
            <Route path="/actionguard/api-blocking" element={<ApiBlockingPage />} />
            <Route path="/actionguard/throttle-comparison" element={<ThrottleComparisonPage />} />
            <Route path="/actionguard/advanced-filtering" element={<AdvancedFilteringPage />} />
            <Route path="/actionguard/priority-performance-advanced" element={<PriorityPerformancePage />} />
            <Route path="/actionguard/mouse-events" element={<MouseEventsIndexPage />} />
            <Route path="/actionguard/mouse-events/enhanced-context-store" element={<EnhancedContextStorePage />} />
            <Route path="/actionguard/mouse-events/context-store-action" element={<ContextStoreActionPage />} />
            <Route path="/actionguard/mouse-events/legacy" element={<MouseEventsPage />} />
            <Route path="/actionguard/mouse-events/context-store" element={<ContextStoreMouseEventsPage />} />
            <Route path="/actionguard/conditional" element={<ConditionalPatternsIndex />} />
            <Route path="/actionguard/conditional/permissions" element={<PermissionBasedExecution />} />
            <Route path="/actionguard/conditional/form-validation" element={<FormValidation />} />
            <Route path="/actionguard/conditional/workflow-steps" element={<WorkflowSteps />} />
            <Route path="/actionguard/conditional/feature-toggle" element={<FeatureToggle />} />
            <Route path="/pipeline/flow-control" element={<FlowControlPlaygroundPage />} />
            <Route path="/refs" element={<RefsIndexPage />} />
            <Route path="/refs/form-builder" element={<FormBuilderRefDemoPage />} />
            <Route path="/refs/waitforrefs-performance" element={<WaitForRefsPerformancePage />} />
            <Route path="/refs/canvas" element={<AdvancedCanvasExample />} />
            <Route path="/demos/todo-list" element={<TodoListPage />} />
            <Route path="/demos/shopping-cart" element={<ShoppingCartPage />} />
            <Route path="/demos/chat" element={<ChatPage />} />
            <Route path="/demos/user-profile" element={<UserProfilePage />} />
            <Route path="/demos/action-priority" element={<ActionPriorityDemoPage />} />
            <Route path="/demos/store-scenarios" element={<StoreScenariosPage />} />
            <Route path="/examples/element-management" element={<ElementManagementPage />} />
            <Route path="/examples/element-management/form-builder" element={<FormBuilderDemoPage />} />
            <Route path="/examples/element-management/canvas" element={<AdvancedCanvasExample />} />
            <Route path="/examples/concurrent-actions" element={<ConcurrentActionTestPage />} />
            <Route path="/examples/toast-config" element={<ToastConfigPage />} />
            <Route path="/examples/enhanced-search" element={<EnhancedAbortableSearchExample />} />
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
  const basename = process.env.NODE_ENV === 'production' ? '/context-action/example' : '/';
  
  return (
    <Router basename={basename}>
      <AppContent />
    </Router>
  );
}

export default App;
