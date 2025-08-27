/**
 * @fileoverview Store Error Boundary Component
 * 
 * Context-Action Store 시스템을 위한 에러 경계 컴포넌트
 * Store 관련 에러들을 적절히 처리하고 사용자에게 우아한 fallback UI를 제공
 */

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { ErrorHandlers, getErrorStatistics, type ContextActionError } from '../utils/error-handling';

/**
 * Store Error Boundary Props
 */
export interface StoreErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: ContextActionError, errorInfo: ErrorInfo) => ReactNode);
  onError?: (error: ContextActionError, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

/**
 * Store Error Boundary State
 */
export interface StoreErrorBoundaryState {
  hasError: boolean;
  error: ContextActionError | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

/**
 * Store 시스템을 위한 에러 경계 컴포넌트
 * 
 * Store 관련 에러들을 캐치하고 적절한 fallback UI를 제공합니다.
 * 개발 모드에서는 자세한 에러 정보를 표시하고, 프로덕션에서는 
 * 사용자 친화적인 메시지를 보여줍니다.
 */
export class StoreErrorBoundary extends Component<StoreErrorBoundaryProps, StoreErrorBoundaryState> {
  private resetTimeoutId: number | null = null;

  constructor(props: StoreErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<StoreErrorBoundaryState> {
    // Context-Action 에러인지 확인
    const isContextActionError = error instanceof Error && error.name === 'ContextActionError';
    const contextActionError = isContextActionError ? (error as any) : null;

    return {
      hasError: true,
      error: contextActionError,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Context-Action 에러 시스템으로 에러 로깅
    if (error.name === 'ContextActionError') {
      // 이미 처리된 ContextActionError
      const contextActionError = error as any;
      this.setState({ errorInfo });
      
      // 사용자 정의 onError 콜백 호출
      this.props.onError?.(contextActionError, errorInfo);
    } else {
      // 일반 에러를 ContextActionError로 변환
      const contextActionError = ErrorHandlers.store(
        `Unhandled error in Store component: ${error.message}`,
        {
          component: 'StoreErrorBoundary',
          stack: error.stack,
          componentStack: errorInfo.componentStack
        },
        error
      );

      this.setState({ 
        error: contextActionError,
        errorInfo 
      });

      // 사용자 정의 onError 콜백 호출
      this.props.onError?.(contextActionError, errorInfo);
    }
  }

  componentDidUpdate(prevProps: StoreErrorBoundaryProps) {
    const { hasError } = this.state;
    const { resetOnPropsChange, resetKeys } = this.props;

    // props 변경 시 에러 상태 리셋
    if (hasError && resetOnPropsChange) {
      if (resetKeys) {
        const hasResetKeyChanged = resetKeys.some(key => {
          const prevKey = (prevProps as any)[key];
          const currentKey = (this.props as any)[key];
          return prevKey !== currentKey;
        });

        if (hasResetKeyChanged) {
          this.resetErrorBoundary();
        }
      } else if (prevProps !== this.props) {
        this.resetErrorBoundary();
      }
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
    
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // 사용자 정의 fallback이 있는 경우
      if (fallback) {
        if (typeof fallback === 'function') {
          return fallback(error!, errorInfo!);
        }
        return fallback;
      }

      // 기본 fallback UI
      return this.renderDefaultFallback();
    }

    return children;
  }

  private renderDefaultFallback(): ReactNode {
    const isDevelopment = process.env.NODE_ENV === 'development';

    if (isDevelopment) {
      return this.renderDevelopmentFallback();
    } else {
      return this.renderProductionFallback();
    }
  }

  private renderDevelopmentFallback(): ReactNode {
    const { error, errorInfo, errorId } = this.state;
    const stats = getErrorStatistics();

    return (
      <div style={{
        padding: '20px',
        margin: '20px',
        border: '2px solid #ff6b6b',
        borderRadius: '8px',
        backgroundColor: '#ffe0e0',
        fontFamily: 'monospace'
      }}>
        <h2 style={{ color: '#d63031', margin: '0 0 10px 0' }}>
          🚨 Store Error Boundary
        </h2>
        
        <div style={{ marginBottom: '15px' }}>
          <strong>Error ID:</strong> {errorId}
        </div>
        
        {error && (
          <div style={{ marginBottom: '15px' }}>
            <strong>Error Type:</strong> {error.type}<br />
            <strong>Message:</strong> {error.message}<br />
            <strong>Timestamp:</strong> {new Date(error.timestamp).toISOString()}
          </div>
        )}
        
        {error?.context && (
          <div style={{ marginBottom: '15px' }}>
            <strong>Context:</strong>
            <pre style={{ 
              background: '#f8f9fa', 
              padding: '10px', 
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '12px'
            }}>
              {JSON.stringify(error.context, null, 2)}
            </pre>
          </div>
        )}
        
        <div style={{ marginBottom: '15px' }}>
          <strong>Error Statistics:</strong><br />
          Total Errors: {stats.totalErrors}<br />
          Recent Errors: {stats.recentErrors.length}
        </div>
        
        {errorInfo && (
          <details style={{ marginBottom: '15px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
              Component Stack
            </summary>
            <pre style={{ 
              background: '#f8f9fa', 
              padding: '10px', 
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '11px',
              whiteSpace: 'pre-wrap'
            }}>
              {errorInfo.componentStack}
            </pre>
          </details>
        )}
        
        <button
          onClick={this.resetErrorBoundary}
          style={{
            padding: '8px 16px',
            backgroundColor: '#00b894',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  private renderProductionFallback(): ReactNode {
    // Production fallback은 간단한 메시지만 표시
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        margin: '20px 0'
      }}>
        <h3 style={{ color: '#6c757d', margin: '0 0 10px 0' }}>
          Something went wrong
        </h3>
        <p style={{ color: '#6c757d', margin: '0 0 15px 0' }}>
          We're sorry, but something unexpected happened. Please try again.
        </p>
        <button
          onClick={this.resetErrorBoundary}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Try Again
        </button>
      </div>
    );
  }
}

/**
 * HOC로 컴포넌트를 Store Error Boundary로 감싸는 헬퍼
 */
export function withStoreErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<StoreErrorBoundaryProps, 'children'>
): React.ComponentType<P> {
  const WithStoreErrorBoundaryComponent = (props: P) => (
    <StoreErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </StoreErrorBoundary>
  );

  WithStoreErrorBoundaryComponent.displayName = 
    `withStoreErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithStoreErrorBoundaryComponent;
}

/**
 * 특정 Store와 연결된 에러 경계 생성 헬퍼
 */
export function createStoreErrorBoundary(
  storeName: string,
  customFallback?: ReactNode
): React.ComponentType<{ children: ReactNode }> {
  return ({ children }) => (
    <StoreErrorBoundary
      fallback={customFallback}
      onError={(error, errorInfo) => {
        console.group(`Store Error in ${storeName}`);
        console.error('Error:', error);
        console.error('Component Stack:', errorInfo.componentStack);
        console.groupEnd();
      }}
      resetKeys={[storeName]}
    >
      {children}
    </StoreErrorBoundary>
  );
}