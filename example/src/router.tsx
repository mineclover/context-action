import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './components/Layout';
import { CoreAdvancedPage } from './pages/core/CoreAdvancedPage';

// Core library pages
import { CoreBasicsPage } from './pages/core/CoreBasicsPage';
import { CorePerformancePage } from './pages/core/CorePerformancePage';
import { HomePage } from './pages/HomePage';
import { JotaiAsyncPage } from './pages/jotai/JotaiAsyncPage';
// Jotai library pages
import { JotaiBasicsPage } from './pages/jotai/JotaiBasicsPage';
import { JotaiPersistencePage } from './pages/jotai/JotaiPersistencePage';
// React library pages
import { ReactBasicsPage } from './pages/react/ReactBasicsPage';
import { ReactContextPage } from './pages/react/ReactContextPage';
import { ReactFormsPage } from './pages/react/ReactFormsPage';
import { ReactHooksPage } from './pages/react/ReactHooksPage';

export const router = createBrowserRouter([
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
        ],
      },
      // React library routes
      {
        path: 'react',
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
            path: 'context',
            element: <ReactContextPage />,
          },
          {
            path: 'forms',
            element: <ReactFormsPage />,
          },
        ],
      },
      // Jotai library routes
      {
        path: 'jotai',
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
