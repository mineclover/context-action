/**
 * @fileoverview Context Store Action-Based Mouse Events Page
 * 
 * Context Store pattern with action-based state management
 */

import React from 'react';
import { PageWithLogMonitor } from '../../components/LogMonitor';
import { ContextStoreMouseEventsWrapper } from './context-store-action-based/ContextStoreMouseEventsWrapper';

export function ContextStoreActionPage() {
  return (
    <PageWithLogMonitor
      pageId="context-store-action-mouse"
      title="Context Store Action-Based Mouse Events"
      initialConfig={{ enableToast: false, maxLogs: 30 }}
    >
      <div className="page-container">
        <header className="page-header">
          <h1>⚡ Context Store Action-Based Mouse Events</h1>
          <p className="page-description">
            Context Store pattern with{' '}
            <strong>action-based state management</strong> and reactive updates.
            Combines Context API with centralized store management.
          </p>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
            <h2 className="font-semibold text-yellow-800 mb-2">⚡ Action-Based Highlights:</h2>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• <strong>Action Handlers</strong> - Centralized business logic</li>
              <li>• <strong>Store Integration</strong> - Reactive state management</li>
              <li>• <strong>Context Wrapping</strong> - Provider-based data flow</li>
              <li>• <strong>Action Dispatch</strong> - Event-driven architecture</li>
            </ul>
          </div>
        </header>

        <ContextStoreMouseEventsWrapper />
      </div>
    </PageWithLogMonitor>
  );
}