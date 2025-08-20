/**
 * @fileoverview Enhanced Context Store Mouse Events Page
 * 
 * Advanced Context Store pattern with real-time debugging and analytics
 */

import React from 'react';
import { PageWithLogMonitor } from '../../components/LogMonitor';
import { EnhancedContextStoreContainer } from './context-store-pattern/containers/EnhancedContextStoreContainer';

export function EnhancedContextStorePage() {
  return (
    <PageWithLogMonitor
      pageId="enhanced-context-store-mouse"
      title="Enhanced Context Store Mouse Events"
      initialConfig={{ enableToast: false, maxLogs: 50 }}
    >
      <div className="page-container">
        <header className="page-header">
          <h1>🏪 Enhanced Context Store Mouse Events</h1>
          <p className="page-description">
            Advanced Context Store pattern with{' '}
            <strong>real-time debugging, analytics, and performance monitoring</strong>.
            Individual store subscriptions with fine-grained reactivity.
          </p>
          
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mt-4">
            <h2 className="font-semibold text-emerald-800 mb-2">🏪 Enhanced Features:</h2>
            <ul className="text-sm text-emerald-700 space-y-1">
              <li>• <strong>Individual Store Access</strong> - Fine-grained reactivity</li>
              <li>• <strong>Real-time Debugger</strong> - Live state inspection</li>
              <li>• <strong>Advanced Metrics</strong> - Performance analytics</li>
              <li>• <strong>Selective Subscriptions</strong> - Optimized re-renders</li>
            </ul>
          </div>
        </header>

        <EnhancedContextStoreContainer />
      </div>
    </PageWithLogMonitor>
  );
}