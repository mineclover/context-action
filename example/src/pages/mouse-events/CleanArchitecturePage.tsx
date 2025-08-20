/**
 * @fileoverview Clean Architecture Mouse Events Page
 * 
 * Pure Clean Architecture implementation with separated layers
 */

import React from 'react';
import { PageWithLogMonitor } from '../../components/LogMonitor';
import { MouseEventsContainer } from './clean-architecture/containers/MouseEventsContainer';
import { CleanMouseEventsView } from './clean-architecture/components/CleanMouseEventsView';

export function CleanArchitecturePage() {
  return (
    <PageWithLogMonitor
      pageId="clean-architecture-mouse"
      title="Clean Architecture Mouse Events"
      initialConfig={{ enableToast: false, maxLogs: 30 }}
    >
      <div className="page-container">
        <header className="page-header">
          <h1>🏗️ Clean Architecture Mouse Events</h1>
          <p className="page-description">
            Traditional Clean Architecture implementation with{' '}
            <strong>separated View, Controller, Service layers</strong>.
            Testable and maintainable architecture with dependency injection.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <h2 className="font-semibold text-blue-800 mb-2">🎯 Architecture Highlights:</h2>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>Pure View Components</strong> - Zero business logic</li>
              <li>• <strong>Controller Layer</strong> - Event coordination and state management</li>
              <li>• <strong>Service Layer</strong> - Business logic isolation</li>
              <li>• <strong>Dependency Injection</strong> - Testable and modular design</li>
            </ul>
          </div>
        </header>

        <MouseEventsContainer>
          <CleanMouseEventsView />
        </MouseEventsContainer>
      </div>
    </PageWithLogMonitor>
  );
}