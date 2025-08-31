import React from 'react';
import { useRegisterSourceFile } from '../../hooks/useRegisterSourceFile';

interface WithSourceRegistrationProps {
  filePath: string;
  name?: string;
  description?: string;
  tags?: string[];
  priority?: number;
  children: React.ReactNode;
}

/**
 * 자식 컴포넌트를 렌더링하면서 소스 파일을 자동으로 등록하는 래퍼 컴포넌트
 * 
 * @example
 * ```tsx
 * <WithSourceRegistration 
 *   filePath="components/MyComponent.tsx"
 *   name="My Component"
 * >
 *   <MyComponent />
 * </WithSourceRegistration>
 * ```
 */
export function WithSourceRegistration({
  filePath,
  name,
  description,
  tags,
  priority,
  children
}: WithSourceRegistrationProps) {
  useRegisterSourceFile(filePath, { name, description, tags, priority });
  return <>{children}</>;
}

/**
 * HOC 버전 - 컴포넌트를 감싸서 소스 파일을 자동 등록
 * 
 * @example
 * ```tsx
 * export default withSourceRegistration(MyComponent, {
 *   filePath: 'components/MyComponent.tsx',
 *   name: 'My Component'
 * });
 * ```
 */
export function withSourceRegistration<P extends object>(
  Component: React.ComponentType<P>,
  registrationOptions: {
    filePath: string;
    name?: string;
    description?: string;
    tags?: string[];
    priority?: number;
  }
) {
  const WrappedComponent = (props: P) => {
    useRegisterSourceFile(registrationOptions.filePath, registrationOptions);
    return <Component {...props} />;
  };
  
  WrappedComponent.displayName = `WithSourceRegistration(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}