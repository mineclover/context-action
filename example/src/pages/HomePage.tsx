import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui';
import { PageLayout } from '@/components/layout/PageLayout';

function HomePage() {
  return (
    <PageLayout
      title="Context-Action Framework Examples"
      description="Interactive examples demonstrating the Context-Action framework's capabilities. Learn through hands-on experience with action pipelines, store management, and React integration."
    >
      <div className="space-y-6 mb-8">
        <Card category="core" hover>
          <CardContent>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Core ActionRegister
            </h3>
            <p className="text-gray-600 mb-4">
              Learn the fundamentals of action pipeline management and type-safe
              action dispatching.
            </p>
            <ul className="space-y-2 mb-6 text-gray-700">
              <li className="flex items-start">
                <span className="text-danger-500 mr-2">•</span>
                Action registration and dispatching
              </li>
              <li className="flex items-start">
                <span className="text-danger-500 mr-2">•</span>
                Priority-based handler execution
              </li>
              <li className="flex items-start">
                <span className="text-danger-500 mr-2">•</span>
                Pipeline control and error handling
              </li>
            </ul>
            <Link
              to="/foundations/core/basics"
              className="inline-flex items-center text-danger-600 hover:text-danger-700 font-medium"
            >
              Explore Foundations →
            </Link>
          </CardContent>
        </Card>

        <Card category="store" hover>
          <CardContent>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Store System
            </h3>
            <p className="text-gray-600 mb-4">
              Discover reactive state management with the built-in store system.
            </p>
            <ul className="space-y-2 mb-6 text-gray-700">
              <li className="flex items-start">
                <span className="text-success-500 mr-2">•</span>
                Basic store operations (CRUD)
              </li>
              <li className="flex items-start">
                <span className="text-success-500 mr-2">•</span>
                Subscription patterns
              </li>
              <li className="flex items-start">
                <span className="text-success-500 mr-2">•</span>
                React integration with hooks
              </li>
            </ul>
            <Link
              to="/foundations/store/basics"
              className="inline-flex items-center text-success-600 hover:text-success-700 font-medium"
            >
              Explore Stores →
            </Link>
          </CardContent>
        </Card>

        <Card category="pipeline" hover>
          <CardContent>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Pipeline Features
            </h3>
            <p className="text-gray-600 mb-4">
              Explore advanced pipeline flow control patterns including priority jumping, 
              early returns, and complex branching logic.
            </p>
            <ul className="space-y-2 mb-6 text-gray-700">
              <li className="flex items-start">
                <span className="text-orange-500 mr-2">•</span>
                Dynamic priority adjustment
              </li>
              <li className="flex items-start">
                <span className="text-orange-500 mr-2">•</span>
                Smart early return patterns
              </li>
              <li className="flex items-start">
                <span className="text-orange-500 mr-2">•</span>
                Business rule-driven routing
              </li>
              <li className="flex items-start">
                <span className="text-orange-500 mr-2">•</span>
                Real-time flow visualization
              </li>
            </ul>
            <Link
              to="/patterns/pipeline/flow-control"
              className="inline-flex items-center text-orange-600 hover:text-orange-700 font-medium"
            >
              Explore Patterns →
            </Link>
          </CardContent>
        </Card>

        <Card category="react" hover>
          <CardContent>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              React Integration
            </h3>
            <p className="text-gray-600 mb-4">
              See how the framework integrates seamlessly with React
              applications.
            </p>
            <ul className="space-y-2 mb-6 text-gray-700">
              <li className="flex items-start">
                <span className="text-purple-500 mr-2">•</span>
                Provider pattern implementation
              </li>
              <li className="flex items-start">
                <span className="text-purple-500 mr-2">•</span>
                Context API integration
              </li>
              <li className="flex items-start">
                <span className="text-purple-500 mr-2">•</span>
                Custom hooks for actions and stores
              </li>
            </ul>
            <Link
              to="/foundations/react/provider"
              className="inline-flex items-center text-purple-600 hover:text-purple-700 font-medium"
            >
              Explore React →
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card variant="elevated">
        <CardContent>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Getting Started
          </h2>
          <p className="text-gray-600 leading-relaxed">
            Start with{' '}
            <Link
              to="/foundations/core/basics"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Foundations
            </Link>{' '}
            to understand the fundamental concepts, then explore{' '}
            <Link
              to="/performance/action-guard"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Store System
            </Link>{' '}
            for state management, and finally see how it all comes together with{' '}
            <Link
              to="/react/provider"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              React Integration
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </PageLayout>
  );
}

export default HomePage;
