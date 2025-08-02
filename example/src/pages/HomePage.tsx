import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Card, CardContent, Grid } from '../components/ui';

function HomePage() {
  return (
    <Container size="lg">
      <header className="page-header">
        <h1>Context-Action Framework Examples</h1>
        <p className="page-description">
          Interactive examples demonstrating the Context-Action framework's capabilities.
          Learn through hands-on experience with action pipelines, store management, and React integration.
        </p>
      </header>

      <Grid cols={3} className="mb-12">
        <Card category="core" hover>
          <CardContent>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Core ActionRegister</h3>
            <p className="text-gray-600 mb-4">
              Learn the fundamentals of action pipeline management and type-safe action dispatching.
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
              to="/core/basics" 
              className="inline-flex items-center text-danger-600 hover:text-danger-700 font-medium"
            >
              Explore Core →
            </Link>
          </CardContent>
        </Card>

        <Card category="store" hover>
          <CardContent>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Store System</h3>
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
              to="/store/basics" 
              className="inline-flex items-center text-success-600 hover:text-success-700 font-medium"
            >
              Explore Stores →
            </Link>
          </CardContent>
        </Card>

        <Card category="react" hover>
          <CardContent>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">React Integration</h3>
            <p className="text-gray-600 mb-4">
              See how the framework integrates seamlessly with React applications.
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
              to="/react/provider" 
              className="inline-flex items-center text-purple-600 hover:text-purple-700 font-medium"
            >
              Explore React →
            </Link>
          </CardContent>
        </Card>
      </Grid>

      <Card variant="elevated">
        <CardContent>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Getting Started</h2>
          <p className="text-gray-600 leading-relaxed">
            Start with{' '}
            <Link to="/core/basics" className="text-primary-600 hover:text-primary-700 font-medium">
              Core Basics
            </Link>{' '}
            to understand the fundamental concepts, then explore{' '}
            <Link to="/store/basics" className="text-primary-600 hover:text-primary-700 font-medium">
              Store System
            </Link>{' '}
            for state management, and finally see how it all comes together with{' '}
            <Link to="/react/provider" className="text-primary-600 hover:text-primary-700 font-medium">
              React Integration
            </Link>.
          </p>
        </CardContent>
      </Card>
    </Container>
  );
}

export default HomePage;