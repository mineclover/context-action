
import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './components/Layout';

// Index pages
import { CoreIndexPage } from './pages/CoreIndexPage';
import { CoreAdvancedPage } from './pages/core/CoreAdvancedPage';
// Core library pages
import { CoreBasicsPage } from './pages/core/CoreBasicsPage';
import { CorePerformancePage } from './pages/core/CorePerformancePage';
import { CoreIntegrationPage } from './pages/core/CoreIntegrationPage';
import { HomePage } from './pages/HomePage';
import { JotaiIndexPage } from './pages/JotaiIndexPage';
import { JotaiAsyncPage } from './pages/jotai/JotaiAsyncPage';
// Jotai library pages
import { JotaiBasicsPage } from './pages/jotai/JotaiBasicsPage';
import { JotaiPersistencePage } from './pages/jotai/JotaiPersistencePage';
import { ReactIndexPage } from './pages/ReactIndexPage';
// React library pages
import { ReactBasicsPage } from './pages/react/ReactBasicsPage';
import { ReactContextPage } from './pages/react/ReactContextPage';
import { ReactFormsPage } from './pages/react/ReactFormsPage';
import { ReactHooksPage } from './pages/react/ReactHooksPage';  
import { ReactActionGuardPage } from './pages/react/ReactActionGuardPage';
import { ReactActionGuardConfigPage } from './pages/react/ReactActionGuardConfigPage';
import { StoreIndexPage } from './pages/react/store/StoreIndexPage';
import { StoreBasicsPage } from './pages/react/store/StoreBasicsPage';
import { StoreRegistryPage } from './pages/react/store/StoreRegistryPage';
import { StoreContextPage } from './pages/react/store/StoreContextPage';
import { StoreSyncPage } from './pages/react/store/StoreSyncPage';
import { StoreFullDemoPage } from './pages/react/store/StoreFullDemoPage';

export const router: ReturnType<typeof createBrowserRouter> =
  createBrowserRouter([
    {
      path: '/',
      element: <Layout />,
      children: [
        {
          index: true,
          element: <HomePage />,
        },
        // Core library routes
        {
          path: 'core',
          element: <CoreIndexPage />,
          children: [
            {
              path: 'basics',
              element: <CoreBasicsPage />,
            },
            {
              path: 'advanced',
              element: <CoreAdvancedPage />,
            },
            {
              path: 'performance',
              element: <CorePerformancePage />,
            },
            {
              path: 'integration',
              element: <CoreIntegrationPage />,
            },
          ],
        },
        // React library routes
        {
          path: 'react',
          element: <ReactIndexPage />,
          children: [
            {
              path: 'basics',
              element: <ReactBasicsPage />,
            },
            {
              path: 'hooks',
              element: <ReactHooksPage />,
            },
            {
              path: 'action-guard',
              element: <ReactActionGuardPage />,
            },
            {
              path: 'action-guard-config',
              element: <ReactActionGuardConfigPage />,
            },
            {
              path: 'context',
              element: <ReactContextPage />,
            },
            {
              path: 'forms',
              element: <ReactFormsPage />,
            },
            {
              path: 'store',
              element: <StoreIndexPage />,
              children: [
                {
                  path: 'basics',
                  element: <StoreBasicsPage />,
                },
                {
                  path: 'registry',
                  element: <StoreRegistryPage />,
                },
                {
                  path: 'context',
                  element: <StoreContextPage />,
                },
                {
                  path: 'sync',
                  element: <StoreSyncPage />,
                },
                {
                  path: 'demo',
                  element: <StoreFullDemoPage />,
                },
              ],
            },
          ],
        },
        // Jotai library routes
        {
          path: 'jotai',
          element: <JotaiIndexPage />,
          children: [
            {
              path: 'basics',
              element: <JotaiBasicsPage />,
            },
            {
              path: 'async',
              element: <JotaiAsyncPage />,
            },
            {
              path: 'persistence',
              element: <JotaiPersistencePage />,
            },
          ],
        },
      ],
    },
  ]);
