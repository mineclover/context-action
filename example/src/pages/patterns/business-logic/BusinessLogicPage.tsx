/**
 * Business Logic Separation Pattern Demo
 *
 * Demonstrates:
 * - Pure business logic module (FileUploadService)
 * - State machine pattern (ProcessState transitions)
 * - Progress-only updates with notifyPath
 * - Modular integration (Business → State → UI layers)
 * - Selective re-rendering with useStorePath
 *
 * Architecture:
 * 1. Business Logic Layer: FileUploadService (pure functions/class)
 * 2. State Management Layer: UploadStore (MutableStore pattern)
 * 3. Action Layer: UploadActions (action dispatching)
 * 4. Orchestration Layer: UploadHandlers (connects layers)
 * 5. UI Layer: Components (pure presentation)
 */

import { UploadStoreProvider } from './contexts/UploadStoreContext';
import { UploadActionProvider } from './contexts/UploadActionContext';
import { UploadHandlers } from './handlers/UploadHandlers';
import { FileUploadZone } from './components/FileUploadZone';
import { StatisticsPanel } from './components/StatisticsPanel';
import { ActiveUploadPanel } from './components/ActiveUploadPanel';
import { ControlPanel } from './components/ControlPanel';
import { UploadQueue } from './components/UploadQueue';

export default function BusinessLogicPage() {
  return (
    <UploadActionProvider>
      <UploadStoreProvider>
        <UploadHandlers>
          <div className="max-w-6xl mx-auto p-6">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-4">
                🏗️ Business Logic Separation Pattern
              </h1>
              <p className="text-lg text-gray-700 mb-4">
                A comprehensive demonstration of modular business logic with async
                process state management using the Context-Action framework.
              </p>

              {/* Architecture Overview */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold mb-3">
                  🎯 Architecture Layers
                </h2>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="font-mono bg-white px-2 py-1 rounded border border-blue-200 min-w-[140px]">
                      Business Logic
                    </span>
                    <span className="text-gray-700">
                      FileUploadService - Pure functions (no React/store dependencies)
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono bg-white px-2 py-1 rounded border border-blue-200 min-w-[140px]">
                      State Management
                    </span>
                    <span className="text-gray-700">
                      UploadStore - MutableStore pattern with notifyPath API
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono bg-white px-2 py-1 rounded border border-blue-200 min-w-[140px]">
                      Action Layer
                    </span>
                    <span className="text-gray-700">
                      UploadActions - Type-safe action dispatching
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono bg-white px-2 py-1 rounded border border-blue-200 min-w-[140px]">
                      Orchestration
                    </span>
                    <span className="text-gray-700">
                      UploadHandlers - Connects business logic + state + actions
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono bg-white px-2 py-1 rounded border border-blue-200 min-w-[140px]">
                      UI Layer
                    </span>
                    <span className="text-gray-700">
                      Components - Pure presentation with selective subscriptions
                    </span>
                  </div>
                </div>
              </div>

              {/* Key Features */}
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-800 mb-2">
                    ✅ State Machine Pattern
                  </h3>
                  <p className="text-sm text-green-700">
                    Explicit state transitions: idle → validating → uploading →
                    processing → complete/error
                  </p>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="font-semibold text-purple-800 mb-2">
                    ⚡ Progress-Only Updates
                  </h3>
                  <p className="text-sm text-purple-700">
                    notifyPath for progress updates without triggering full
                    re-renders (100% efficiency)
                  </p>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h3 className="font-semibold text-orange-800 mb-2">
                    🧪 Testable Business Logic
                  </h3>
                  <p className="text-sm text-orange-700">
                    FileUploadService can be tested independently without
                    React/stores
                  </p>
                </div>

                <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                  <h3 className="font-semibold text-pink-800 mb-2">
                    🎯 Selective Re-rendering
                  </h3>
                  <p className="text-sm text-pink-700">
                    useStorePath subscriptions only re-render affected components
                  </p>
                </div>
              </div>
            </div>

            {/* File Upload Zone */}
            <FileUploadZone />

            {/* Statistics */}
            <StatisticsPanel />

            {/* Active Upload */}
            <ActiveUploadPanel />

            {/* Controls */}
            <ControlPanel />

            {/* Upload Queue */}
            <UploadQueue />

            {/* Documentation Links */}
            <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-3">
                📚 Documentation & Source Code
              </h3>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Convention:</strong>{' '}
                  <code className="bg-gray-200 px-2 py-1 rounded">
                    docs/en/concept/store-conventions.md
                  </code>{' '}
                  → Business Logic Separation section
                </p>
                <p>
                  <strong>Test Suite:</strong>{' '}
                  <code className="bg-gray-200 px-2 py-1 rounded">
                    packages/react/__tests__/stores/notifyPath-async-process.test.tsx
                  </code>
                </p>
                <p>
                  <strong>Source Code:</strong>{' '}
                  <code className="bg-gray-200 px-2 py-1 rounded">
                    example/src/pages/patterns/business-logic/
                  </code>
                </p>
              </div>
            </div>
          </div>
        </UploadHandlers>
      </UploadStoreProvider>
    </UploadActionProvider>
  );
}
