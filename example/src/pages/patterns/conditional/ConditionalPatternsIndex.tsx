import React from 'react';
import { Link } from 'react-router-dom';

interface ConditionalPattern {
  id: string;
  title: string;
  description: string;
  path: string;
  coreconcept: string;
  features: string[];
  difficulty: 'Basic' | 'Intermediate' | 'Advanced' | 'Expert';
  color: string;
  status: 'Complete' | 'Preview' | 'Coming Soon';
}

const conditionalPatterns: ConditionalPattern[] = [
  {
    id: 'permissions',
    title: '🔒 Permission-Based Execution',
    description: 'Security-first handlers that validate permissions before execution. Clean separation of authorization logic.', 
    path: '/actionguard/conditional/permissions',
    coreconcept: 'Security Guard Pattern',
    features: [
      'Permission validation before handler logic',
      'Role-based execution control',
      'Automatic audit trail generation',
      'Fail-secure by default behavior'
    ],
    difficulty: 'Intermediate', 
    color: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
    status: 'Complete'
  },
  {
    id: 'form-validation',
    title: '📝 Form Validation Pattern',
    description: 'Real-time field validation with conditional submission. Clear visual feedback and error handling.',
    path: '/actionguard/conditional/form-validation',
    coreconcept: 'Conditional Validation',
    features: [
      'Real-time field validation',
      'Conditional form submission',
      'Visual state feedback',
      'Error message display'
    ],
    difficulty: 'Basic',
    color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
    status: 'Complete'
  },
  {
    id: 'workflow-steps',
    title: '⚡ Sequential Workflow Pattern',
    description: 'Multi-step processes where each step conditionally triggers the next. Visual progress tracking.',
    path: '/actionguard/conditional/workflow-steps',
    coreconcept: 'Conditional Sequencing',
    features: [
      'Step-by-step conditional execution',
      'Result-based progression',
      'Visual progress tracking',
      'Error handling and recovery'
    ],
    difficulty: 'Intermediate',
    color: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
    status: 'Complete'
  },
  {
    id: 'feature-toggle',
    title: '🎛️ Feature Toggle Pattern',
    description: 'Environment and user-based conditional feature execution. Dynamic feature management.',
    path: '/actionguard/conditional/feature-toggle',
    coreconcept: 'Conditional Features',
    features: [
      'Environment-based execution',
      'User group conditional access',
      'Dynamic feature toggling',
      'Execution audit trail'
    ],
    difficulty: 'Basic',
    color: 'bg-green-50 border-green-200 hover:bg-green-100',
    status: 'Complete'
  }
];

export function ConditionalPatternsIndex() {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Basic': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-orange-100 text-orange-800'; 
      case 'Expert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Complete': return 'bg-green-100 text-green-800';
      case 'Preview': return 'bg-blue-100 text-blue-800';
      case 'Coming Soon': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link 
            to="/actionguard" 
            className="text-blue-600 hover:text-blue-800 underline text-sm"
          >
            ← Back to ActionGuard
          </Link>
          <Link 
            to="/" 
            className="text-gray-600 hover:text-gray-800 underline text-sm"
          >
            🏠 Home
          </Link>
        </div>
        
        <h1 className="text-4xl font-bold mb-4">🎯 Conditional Execution Patterns</h1>
        <p className="text-xl text-gray-600 mb-4">
          Action handlers that execute conditionally based on context, state, and business rules
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Conditional Patterns:</strong> These implementations demonstrate how to build flexible, 
            context-aware action handlers that execute conditionally based on various criteria including 
            permissions, validation state, workflow progress, and feature flags.
          </p>
        </div>
      </div>

      {/* Pattern Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {conditionalPatterns.map((pattern) => (
          <Link
            key={pattern.id}
            to={pattern.path}
            className={`border rounded-lg p-6 transition-all duration-200 ${pattern.color} block`}
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-xl font-semibold">{pattern.title}</h3>
              <div className="flex flex-col gap-1">
                <span className={`px-2 py-1 rounded text-xs ${getDifficultyColor(pattern.difficulty)}`}>
                  {pattern.difficulty}
                </span>
                <span className={`px-2 py-1 rounded text-xs ${getStatusColor(pattern.status)}`}>
                  {pattern.status}
                </span>
              </div>
            </div>

            <div className="mb-3">
              <div className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded inline-block mb-2">
                💡 {pattern.coreconcept}
              </div>
              <p className="text-gray-700">{pattern.description}</p>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700">Key Features:</div>
              <ul className="text-sm text-gray-600 space-y-1">
                {pattern.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">•</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="mt-4 text-sm text-blue-600 font-medium flex items-center">
              <span>Explore Pattern</span>
              <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ))}
      </div>

      {/* Implementation Guide */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">🛡️ Security Implementation Guide</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-yellow-700 mb-3 flex items-center">
              <span className="text-lg mr-2">🔐</span> Core Security Concepts
            </h3>
            <ol className="text-sm text-gray-700 space-y-2">
              <li className="flex items-start gap-2">
                <span className="font-semibold text-yellow-600">1.</span>
                <span><strong>Role Hierarchy</strong> - Level-based permission inheritance system</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-yellow-600">2.</span>
                <span><strong>Security Guard Pattern</strong> - Permission validation at handler entry point</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-yellow-600">3.</span>
                <span><strong>Audit Trail</strong> - Comprehensive security event logging and monitoring</span>
              </li>
            </ol>
          </div>
          
          <div>
            <h3 className="font-medium text-orange-700 mb-3 flex items-center">
              <span className="text-lg mr-2">🚀</span> Enterprise Features
            </h3>
            <ol className="text-sm text-gray-700 space-y-2">
              <li className="flex items-start gap-2">
                <span className="font-semibold text-orange-600">1.</span>
                <span><strong>Fail-Secure Defaults</strong> - Deny by default, explicit permissions required</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-orange-600">2.</span>
                <span><strong>Real-time Monitoring</strong> - Live security event tracking and analysis</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-orange-600">3.</span>
                <span><strong>Compliance Ready</strong> - Full audit trails for regulatory requirements</span>
              </li>
            </ol>
          </div>
        </div>
      </div>

      {/* Security Architecture */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">🏗️ Security Architecture</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-red-50 p-4 rounded-lg">
            <h3 className="font-medium text-red-900 mb-2">🛡️ Permission Guards</h3>
            <p className="text-sm text-red-800">
              Action handlers validate user permissions at entry point using role hierarchy. 
              Implements fail-secure defaults with explicit permission requirements.
            </p>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-medium text-yellow-900 mb-2">📋 Audit System</h3>
            <p className="text-sm text-yellow-800">
              Comprehensive audit trail captures all security events with timestamps, user context, 
              and action details for compliance and threat monitoring.
            </p>
          </div>
          
          <div className="bg-orange-50 p-4 rounded-lg">
            <h3 className="font-medium text-orange-900 mb-2">⚖️ Role Management</h3>
            <p className="text-sm text-orange-800">
              Hierarchical role system with inheritance. Higher-level roles automatically 
              inherit permissions from lower levels for simplified management.
            </p>
          </div>
        </div>
      </div>

      {/* Security Best Practices */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-2xl font-semibold text-red-900 mb-4">🔒 Security Best Practices</h2>
        <div className="grid md:grid-cols-2 gap-6 text-sm text-red-800">
          <div>
            <h3 className="font-medium mb-2">Security Implementation:</h3>
            <ul className="space-y-1">
              <li>• Always validate permissions before business logic execution</li>
              <li>• Use fail-secure defaults - deny access unless explicitly granted</li>
              <li>• Implement comprehensive audit logging for all security events</li>
              <li>• Cache permission results carefully to avoid stale security state</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-2">Compliance Strategy:</h3>
            <ul className="space-y-1">
              <li>• Log all access attempts with timestamp and user context</li>
              <li>• Include IP address and user agent in audit trails</li>
              <li>• Implement role-based access control with clear hierarchy</li>
              <li>• Provide detailed error messages for debugging but not exploitation</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}