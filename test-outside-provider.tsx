import React from 'react';
import { createActionContext, ActionPayloadMap } from '@context-action/react';

interface TestActionMap extends ActionPayloadMap {
  test: string;
}

const { useAction } = createActionContext<TestActionMap>();

// Provider 외부에서 사용하는 컴포넌트
function TestComponent() {
  const action = useAction();
  
  const handleClick = () => {
    try {
      action.dispatch('test', 'Hello World');
    } catch (error) {
      console.error(error.message);
    }
  };

  return (
    <button onClick={handleClick}>
      Test Dispatch Outside Provider
    </button>
  );
}

export default TestComponent;