/**
 * @fileoverview Enhanced Context Store Page - MVVM Entry Point
 * 
 * Main page component integrating MVVM architecture with Context-Action framework:
 * - MouseEventsModelProvider: Model layer with declarative contexts
 * - EnhancedContextStoreView: View layer with hooks-based state injection
 * - Clean separation between Model, ViewModel, and View layers
 */

import React from 'react';
import { MouseEventsModelProvider } from './context/MouseEventsModel';
import { EnhancedContextStoreView } from './components/EnhancedContextStoreView';

/**
 * Enhanced Context Store 메인 페이지
 * 
 * MVVM 아키텍처 통합:
 * - Model: MouseEventsModel (Context declarations)
 * - ViewModel: Hooks (state injection, event handlers)
 * - View: EnhancedContextStoreView (pure presentation)
 */
export function EnhancedContextStorePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-cyan-50">
      {/* Model Layer - Declarative Context Management */}
      <MouseEventsModelProvider>
        
        {/* View Layer - Hook-based State Injection */}
        <EnhancedContextStoreView />
        
      </MouseEventsModelProvider>
    </div>
  );
}

export default EnhancedContextStorePage;