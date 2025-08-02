import React, { Component, ReactNode } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('🚨 ErrorBoundary caught an error:', error);
    console.error('Error Info:', errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // 선택적 에러 핸들러 호출
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="border-2 border-red-500 p-6 rounded-lg bg-red-50 max-w-2xl mx-auto">
          <h2 className="text-red-800 font-bold text-lg mb-4">🚨 Component Error</h2>
          
          <div className="bg-white border border-red-200 rounded p-4 mb-4">
            <h3 className="font-semibold text-red-700 mb-2">Error Details:</h3>
            <div className="text-sm text-red-600">
              <strong>Message:</strong> {this.state.error?.message || 'Unknown error'}
            </div>
            {this.state.error?.stack && (
              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-red-500 hover:text-red-700">
                  Show Stack Trace
                </summary>
                <pre className="text-xs bg-red-100 p-2 rounded mt-1 overflow-auto max-h-40">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-4">
            <h3 className="font-semibold text-yellow-700 mb-2">🔧 Common Causes:</h3>
            <ul className="text-sm text-yellow-600 list-disc list-inside space-y-1">
              <li><strong>Hook Rule Violation:</strong> Conditional hooks or early returns</li>
              <li><strong>Infinite Loop:</strong> State updates causing endless re-renders</li>
              <li><strong>Type Errors:</strong> Unexpected data types or null values</li>
              <li><strong>Store Issues:</strong> Comparison strategy conflicts</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={this.handleReset}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              🔄 Try Again
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              🔃 Reload Page
            </button>
          </div>

          <div className="mt-4 text-xs text-gray-600">
            <strong>Tip:</strong> If this keeps happening, try the "Reset All" button or reload the page completely.
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}