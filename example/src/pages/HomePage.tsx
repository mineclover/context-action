import React from 'react';
import { Link } from 'react-router-dom';

function HomePage() {
  return (
    <div className="page-container">
      <header className="page-header">
        <h1>Context-Action Framework Examples</h1>
        <p className="page-description">
          Interactive examples demonstrating the Context-Action framework's capabilities.
          Learn through hands-on experience with action pipelines, store management, and React integration.
        </p>
      </header>

      <div className="example-grid">
        <div className="example-card core">
          <h3>Core ActionRegister</h3>
          <p>Learn the fundamentals of action pipeline management and type-safe action dispatching.</p>
          <ul>
            <li>Action registration and dispatching</li>
            <li>Priority-based handler execution</li>
            <li>Pipeline control and error handling</li>
          </ul>
          <Link to="/core/basics" className="example-link">Explore Core →</Link>
        </div>

        <div className="example-card store">
          <h3>Store System</h3>
          <p>Discover reactive state management with the built-in store system.</p>
          <ul>
            <li>Basic store operations (CRUD)</li>
            <li>Subscription patterns</li>
            <li>React integration with hooks</li>
          </ul>
          <Link to="/store/basics" className="example-link">Explore Stores →</Link>
        </div>

        <div className="example-card react">
          <h3>React Integration</h3>
          <p>See how the framework integrates seamlessly with React applications.</p>
          <ul>
            <li>Provider pattern implementation</li>
            <li>Context API integration</li>
            <li>Custom hooks for actions and stores</li>
          </ul>
          <Link to="/react/provider" className="example-link">Explore React →</Link>
        </div>
      </div>

      <div className="getting-started">
        <h2>Getting Started</h2>
        <p>
          Start with <Link to="/core/basics">Core Basics</Link> to understand the fundamental concepts,
          then explore <Link to="/store/basics">Store System</Link> for state management,
          and finally see how it all comes together with <Link to="/react/provider">React Integration</Link>.
        </p>
      </div>
    </div>
  );
}

export default HomePage;