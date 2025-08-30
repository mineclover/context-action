import {
  type ActionPayloadMap,
  createActionContext,
  createStoreContext,
  useStoreValue,
} from '@context-action/react';
import { useEffect, useCallback, useMemo, useRef } from 'react';
import {
  PageWithLogMonitor,
  useActionLoggerWithToast,
} from '@/components/LogMonitor';
import { Badge, Button, Card, CardContent } from '@/components/ui';

// 상위 컨텍스트: 인터페이스만 정의 (구현체는 몰라야 함)
interface ParentActions extends ActionPayloadMap {
  // 하위 컴포넌트들이 등록할 수 있는 인터페이스만 정의
  onChildRegistered: { childId: string; childType: string };
  onDataChanged: { source: string; data: any };
  onUserInteraction: { action: string; payload: any };
  // 상위 자체 액션
  incrementParentCounter: void;
  resetParentCounter: void;
  // 하위 컨트롤 인터페이스
  controlChild: {
    childId: string;
    action: 'increment' | 'reset';
    amount?: number;
  };
}

// 하위 컴포넌트들의 독립적인 액션 타입들
interface ChildAActions extends ActionPayloadMap {
  incrementCounter: { amount: number };
  resetCounter: void;
}

interface ChildBActions extends ActionPayloadMap {
  updateText: { newText: string };
  clearText: void;
}

// Action Only + Store Only 패턴 생성
const ParentActionContext = createActionContext<ParentActions>({
  name: 'ParentContext-actions'
});
const ParentStores = createStoreContext('ParentContext-stores', {
  'registered-children': { initialValue: [] as Array<{ childId: string; childType: string }> },
  'data-log': { initialValue: [] as Array<{ source: string; data: any; timestamp: number }> },
  'parent-counter': { initialValue: 0 }
});

const ChildAActionContext = createActionContext<ChildAActions>({
  name: 'ChildAContext-actions'
});
const ChildAStores = createStoreContext('ChildAContext-stores', {
  'counter': { initialValue: 0 }
});

const ChildBActionContext = createActionContext<ChildBActions>({
  name: 'ChildBContext-actions'
});
const ChildBStores = createStoreContext('ChildBContext-stores', {
  'text': { initialValue: 'Hello World' }
});


// 상위 컨텍스트 UI - 하위 컴포넌트들을 모름
function ParentContextUI() {
  const registeredChildren = useStoreValue(
    ParentStores.useStore('registered-children')
  );
  const dataLog = useStoreValue(
    ParentStores.useStore('data-log')
  );
  const parentCounter = useStoreValue(
    ParentStores.useStore('parent-counter')
  );
  const parentDispatch = ParentActionContext.useActionDispatch();

  return (
    <Card className="border-l-4 border-l-blue-500 bg-blue-50">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-blue-900 flex items-center gap-2">
            🌍 Parent Context (Interface Only)
            <Badge variant="outline" className="bg-blue-100 text-blue-800">
              상위 컨텍스트
            </Badge>
          </h3>
        </div>

        <div className="space-y-4">
          {/* 상위 컨텍스트 자체 카운터 */}
          <div className="p-4 bg-white rounded-lg border border-blue-200">
            <h4 className="font-semibold mb-3 text-blue-900">
              🏠 상위 컨텍스트 카운터
            </h4>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-blue-700">
                카운터: {parentCounter}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => parentDispatch('incrementParentCounter')}
                >
                  🔼 상위 +1
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => parentDispatch('resetParentCounter')}
                >
                  🔄 상위 리셋
                </Button>
              </div>
            </div>
          </div>

          {/* 하위 컴포넌트 제어 패널 */}
          <div className="p-4 bg-white rounded-lg border border-orange-200">
            <h4 className="font-semibold mb-3 text-orange-900">
              🎮 하위 컴포넌트 원격 제어
            </h4>
            <p className="text-sm text-orange-700 mb-3">
              상위에서 하위 컴포넌트를 직접 제어할 수 있습니다 (인터페이스를
              통한 제어)
            </p>
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant="success"
                onClick={() =>
                  parentDispatch('controlChild', {
                    childId: 'child-a-counter',
                    action: 'increment',
                    amount: 1,
                  })
                }
              >
                🎯 Child A +1
              </Button>
              <Button
                size="sm"
                variant="success"
                onClick={() =>
                  parentDispatch('controlChild', {
                    childId: 'child-a-counter',
                    action: 'increment',
                    amount: 5,
                  })
                }
              >
                🎯 Child A +5
              </Button>
              <Button
                size="sm"
                variant="warning"
                onClick={() =>
                  parentDispatch('controlChild', {
                    childId: 'child-a-counter',
                    action: 'reset',
                  })
                }
              >
                🎯 Child A 리셋
              </Button>
            </div>
          </div>

          <div className="p-4 bg-white rounded-lg border">
            <h4 className="font-semibold mb-2">등록된 하위 컴포넌트들:</h4>
            {registeredChildren.length === 0 ? (
              <p className="text-sm text-gray-500">
                아직 등록된 컴포넌트가 없습니다
              </p>
            ) : (
              <div className="space-y-1">
                {registeredChildren.map((child, index) => (
                  <div key={index} className="text-sm">
                    📦 {child.childType} - ID: {child.childId}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 bg-white rounded-lg border">
            <h4 className="font-semibold mb-2">데이터 변경 로그:</h4>
            {dataLog.length === 0 ? (
              <p className="text-sm text-gray-500">
                아직 데이터 변경이 없습니다
              </p>
            ) : (
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {dataLog.map((log, index) => (
                  <div key={index} className="text-xs bg-gray-50 p-2 rounded">
                    🔄 {log.source}: {JSON.stringify(log.data)}
                    <span className="text-gray-500 ml-2">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// 독립적인 Child A 컴포넌트 - 자체적으로 상위에 등록됨
function IndependentChildA() {
  return (
    <ChildAActionContext.Provider>
      <ChildAStores.Provider registryId="child-a-context">
        <ChildALogicRegistration />
        <ChildAUI />
      </ChildAStores.Provider>
    </ChildAActionContext.Provider>
  );
}

function ChildALogicRegistration() {
  const counter = ChildAStores.useStore('counter');
  const actionLogger = useActionLoggerWithToast();
  const parentDispatch = ParentActionContext.useActionDispatch();

  const childId = 'child-a-counter';

  useEffect(() => {
    // 🎯 핵심: 하위 컴포넌트가 상위 ActionRegister에 자신의 로직을 등록
    parentDispatch('onChildRegistered', {
      childId,
      childType: 'Counter Component',
    });
  }, []); // parentDispatch 의존성 제거로 무한 리렌더링 방지

  // 🎯 핵심: 상위의 제어 명령을 구독하여 자율적으로 반응
  const controlChildHandler = useMemo(() => 
    ({ childId: targetId, action, amount }: { childId: string; action: 'increment' | 'reset'; amount?: number }) => {
      // 자신에게 향한 명령인지 확인
      if (targetId !== childId) return;

      if (action === 'increment') {
        const currentValue = counter.getValue();
        const incrementAmount = amount || 1;
        const newValue = currentValue + incrementAmount;
        counter.setValue(newValue);

        // 상위에게 변경사항 알림
        parentDispatch('onDataChanged', {
          source: `${childId} (remote-controlled)`,
          data: {
            counter: newValue,
            action: 'remote-increment',
            amount: incrementAmount,
          },
        });

        actionLogger.logAction(
          'remote-increment',
          { amount: incrementAmount, newValue },
          {
            context: 'Child A - Remote Control',
            toast: {
              type: 'info',
              message: `🎮 원격 제어로 카운터 증가: ${newValue}`,
            },
          }
        );
      } else if (action === 'reset') {
        counter.setValue(0);

        // 상위에게 변경사항 알림
        parentDispatch('onDataChanged', {
          source: `${childId} (remote-controlled)`,
          data: { counter: 0, action: 'remote-reset' },
        });

        actionLogger.logAction(
          'remote-reset',
          {},
          {
            context: 'Child A - Remote Control',
            toast: { type: 'info', message: '🎮 원격 제어로 카운터 리셋됨' },
          }
        );
      }
    }, [] // 빈 의존성으로 한 번만 생성
  );

  // Child A의 incrementCounter 핸들러 - useMemo로 안정화
  const incrementCounterHandler = useMemo(() => 
    ({ amount }: { amount: number }) => {
      const newValue = counter.getValue() + amount;
      counter.setValue(newValue);

      // 상위에게 데이터 변경 알림
      parentDispatch('onDataChanged', {
        source: childId,
        data: { counter: newValue, action: 'increment', amount },
      });

      actionLogger.logAction(
        'incrementCounter',
        { amount, newValue },
        {
          context: 'Child A Component',
          toast: { type: 'success', message: `카운터 증가: ${newValue}` },
        }
      );
    }, [] // 빈 의존성으로 한 번만 생성
  );

  // Child A의 resetCounter 핸들러 - useMemo로 안정화
  const resetCounterHandler = useMemo(() => 
    () => {
      counter.setValue(0);

      // 상위에게 데이터 변경 알림
      parentDispatch('onDataChanged', {
        source: childId,
        data: { counter: 0, action: 'reset' },
      });

      actionLogger.logAction(
        'resetCounter',
        {},
        {
          context: 'Child A Component',
          toast: { type: 'info', message: '카운터 리셋됨' },
        }
      );
    }, [] // 빈 의존성으로 한 번만 생성
  );

  // 🛡️ 액션 핸들러 등록
  ParentActionContext.useActionHandler('controlChild', controlChildHandler);
  ChildAActionContext.useActionHandler('incrementCounter', incrementCounterHandler);
  ChildAActionContext.useActionHandler('resetCounter', resetCounterHandler);

  return null;
}

function ChildAUI() {
  const counter = useStoreValue(ChildAStores.useStore('counter'));
  const childADispatch = ChildAActionContext.useActionDispatch();
  const parentDispatch = ParentActionContext.useActionDispatch();

  return (
    <Card className="border-l-4 border-l-green-500 bg-green-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-lg font-bold text-green-900 flex items-center gap-2">
            🏠 Independent Child A
            <Badge
              variant="outline"
              className="bg-green-100 text-green-800 text-xs"
            >
              독립 컴포넌트
            </Badge>
          </h4>
        </div>

        <div className="space-y-3">
          <div className="p-3 bg-white rounded border">
            <p className="text-sm font-semibold">카운터: {counter}</p>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant="success"
              onClick={() => childADispatch('incrementCounter', { amount: 1 })}
            >
              🔢 +1
            </Button>
            <Button
              size="sm"
              variant="success"
              onClick={() => childADispatch('incrementCounter', { amount: 5 })}
            >
              🔢 +5
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => childADispatch('resetCounter')}
            >
              🔄 리셋
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => parentDispatch('incrementParentCounter')}
            >
              🔼 상위 카운터 +1
            </Button>
            <Button
              size="sm"
              variant="info"
              onClick={() =>
                parentDispatch('onUserInteraction', {
                  action: 'button-click',
                  payload: { component: 'child-a', button: 'custom-action' },
                })
              }
            >
              📤 상위에 알림
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// 독립적인 Child B 컴포넌트 - 자체적으로 상위에 등록됨
function IndependentChildB() {
  return (
    <ChildBActionContext.Provider>
      <ChildBStores.Provider registryId="child-b-context">
        <ChildBLogicRegistration />
        <ChildBUI />
      </ChildBStores.Provider>
    </ChildBActionContext.Provider>
  );
}

function ChildBLogicRegistration() {
  const textStore = ChildBStores.useStore('text');
  const actionLogger = useActionLoggerWithToast();
  const parentDispatch = ParentActionContext.useActionDispatch(); // 상위 컨텍스트에 접근

  const childId = 'child-b-text';

  useEffect(() => {
    // 🎯 핵심: 하위 컴포넌트가 상위 ActionRegister에 자신의 로직을 등록
    parentDispatch('onChildRegistered', {
      childId,
      childType: 'Text Editor Component',
    });
  }, []); // parentDispatch 의존성 제거로 무한 리렌더링 방지

  // Child B의 updateText 핸들러 - useCallback으로 안정화
  const updateTextHandler = useCallback(({ newText }: { newText: string }) => {
    textStore.setValue(newText);

    // 상위에게 데이터 변경 알림
    parentDispatch('onDataChanged', {
      source: childId,
      data: { text: newText, action: 'update', length: newText.length },
    });

    actionLogger.logAction(
      'updateText',
      { newText },
      {
        context: 'Child B Component',
        toast: { type: 'success', message: '텍스트 업데이트됨' },
      }
    );
  }, [textStore, parentDispatch, actionLogger, childId]);

  // Child B의 clearText 핸들러 - useCallback으로 안정화
  const clearTextHandler = useCallback(() => {
    textStore.setValue('');

    // 상위에게 데이터 변경 알림
    parentDispatch('onDataChanged', {
      source: childId,
      data: { text: '', action: 'clear' },
    });

    actionLogger.logAction(
      'clearText',
      {},
      {
        context: 'Child B Component',
        toast: { type: 'info', message: '텍스트 클리어됨' },
      }
    );
  }, [textStore, parentDispatch, actionLogger, childId]);

  // Child B의 자체 액션 핸들러 - 안정화된 핸들러 사용
  ChildBActionContext.useActionHandler('updateText', updateTextHandler);
  ChildBActionContext.useActionHandler('clearText', clearTextHandler);

  return null;
}

function ChildBUI() {
  const text = useStoreValue(ChildBStores.useStore('text'));
  const childBDispatch = ChildBActionContext.useActionDispatch();
  const parentDispatch = ParentActionContext.useActionDispatch();

  return (
    <Card className="border-l-4 border-l-purple-500 bg-purple-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-lg font-bold text-purple-900 flex items-center gap-2">
            🧩 Independent Child B
            <Badge
              variant="outline"
              className="bg-purple-100 text-purple-800 text-xs"
            >
              독립 컴포넌트
            </Badge>
          </h4>
        </div>

        <div className="space-y-3">
          <div className="p-3 bg-white rounded border">
            <p className="text-sm font-semibold mb-1">텍스트: "{text}"</p>
            <p className="text-xs text-gray-500">Length: {text.length}</p>
          </div>

          <div className="space-y-2">
            <input
              type="text"
              value={text}
              onChange={(e) =>
                childBDispatch('updateText', { newText: e.target.value })
              }
              placeholder="텍스트를 입력하세요..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant="warning"
                onClick={() =>
                  childBDispatch('updateText', {
                    newText: `Sample Text ${new Date().toLocaleTimeString()}`,
                  })
                }
              >
                📝 샘플 텍스트
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => childBDispatch('clearText')}
              >
                🗑️ 클리어
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={() => parentDispatch('incrementParentCounter')}
              >
                🔼 상위 카운터 +1
              </Button>
              <Button
                size="sm"
                variant="info"
                onClick={() =>
                  parentDispatch('onUserInteraction', {
                    action: 'text-interaction',
                    payload: { component: 'child-b', textLength: text.length },
                  })
                }
              >
                📤 상위에 알림
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// 통신 설명 컴포넌트
function CommunicationExplanation() {
  return (
    <Card className="mt-6">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🏗️ Dependency Inversion 패턴 원리
        </h3>

        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2">
              1. 인터페이스 기반 상위 컨텍스트
            </h4>
            <p className="text-sm text-blue-800">
              상위 컨텍스트는 구현체를 모르고, 오직 <code>ParentActions</code>{' '}
              인터페이스만 정의합니다. 하위 컴포넌트가 무엇인지 전혀 알지
              못합니다.
            </p>
          </div>

          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-900 mb-2">
              2. 완전 독립적 하위 컴포넌트
            </h4>
            <p className="text-sm text-green-800">
              각 하위 컴포넌트는 자체 <code>Provider</code>를 가지며, 완전히
              독립적으로 동작합니다. Context API 계층을 통해 상위
              ActionRegister에 접근 가능합니다.
            </p>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h4 className="font-semibold text-purple-900 mb-2">
              3. 자동 등록 패턴
            </h4>
            <p className="text-sm text-purple-800">
              하위 컴포넌트가 마운트시{' '}
              <code>parentDispatch('onChildRegistered')</code>로 자신을 상위에
              등록합니다. 상위는 등록된 컴포넌트 정보만 알게 됩니다.
            </p>
          </div>

          <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
            <h4 className="font-semibold text-orange-900 mb-2">
              4. 하위 → 상위 통신
            </h4>
            <p className="text-sm text-orange-800">
              하위 컴포넌트에서{' '}
              <code>parentDispatch('incrementParentCounter')</code>로 상위
              카운터를 직접 증가시킬 수 있습니다.
            </p>
          </div>

          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <h4 className="font-semibold text-red-900 mb-2">
              5. 상위 → 하위 제어
            </h4>
            <p className="text-sm text-red-800">
              상위에서 <code>controlChild</code> 인터페이스로 명령을 발송하면,
              하위가 <code>ParentContext.useActionHandler</code>로 구독하여
              자율적으로 반응합니다.
            </p>
          </div>

          <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
            <h4 className="font-semibold text-teal-900 mb-2">
              6. 데이터 변경 알림
            </h4>
            <p className="text-sm text-teal-800">
              모든 상태 변경은 <code>parentDispatch('onDataChanged')</code>로
              상위에게 실시간으로 알려집니다.
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-2">💡 핵심 장점</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>
                • <strong>완전한 독립성</strong>: 각 컴포넌트가 자체 Provider로
                완전 분리
              </li>
              <li>
                • <strong>인터페이스 계약</strong>: TypeScript 인터페이스로
                명확한 통신 규약
              </li>
              <li>
                • <strong>확장성</strong>: 새로운 하위 컴포넌트를 쉽게 추가 가능
              </li>
              <li>
                • <strong>테스트 용이성</strong>: 각 컴포넌트를 독립적으로
                테스트 가능
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// 상위 컨텍스트: 인터페이스만 정의하고 하위 구성을 모름
function ParentContextContainer({ children }: { children: any }) {
  return (
    <ParentActionContext.Provider>
      <ParentStores.Provider registryId="parent-context">
        <ParentContextLogic />
        {children}
      </ParentStores.Provider>
    </ParentActionContext.Provider>
  );
}

// 상위 컨텍스트의 로직 - 하위 컴포넌트들이 뭔지 모름
function ParentContextLogic() {
  const actionLogger = useActionLoggerWithToast();
  const registeredChildrenStore = ParentStores.useStore('registered-children');
  const dataLogStore = ParentStores.useStore('data-log');
  const parentCounterStore = ParentStores.useStore('parent-counter');

  // 상위는 단순히 인터페이스에 정의된 액션들만 처리
  ParentActionContext.useActionHandler(
    'onChildRegistered',
    ({ childId, childType }) => {
      const currentChildren = registeredChildrenStore.getValue();
      const newChildren = [...currentChildren, { childId, childType }];
      registeredChildrenStore.setValue(newChildren);

      actionLogger.logAction(
        'onChildRegistered',
        { childId, childType },
        {
          context: 'Parent Context',
          toast: {
            type: 'info',
            message: `${childType} 컴포넌트 등록됨: ${childId}`,
          },
        }
      );
    }
  );

  ParentActionContext.useActionHandler('onDataChanged', ({ source, data }) => {
    const currentLog = dataLogStore.getValue();
    const newLog = [...currentLog, { source, data, timestamp: Date.now() }];
    dataLogStore.setValue(newLog.slice(-10)); // 최근 10개만 유지

    actionLogger.logAction(
      'onDataChanged',
      { source, data },
      {
        context: 'Parent Context',
        toast: { type: 'success', message: `${source}에서 데이터 변경됨` },
      }
    );
  });

  ParentActionContext.useActionHandler('onUserInteraction', ({ action, payload }) => {
    actionLogger.logAction(
      'onUserInteraction',
      { action, payload },
      {
        context: 'Parent Context',
        toast: { type: 'info', message: `사용자 액션: ${action}` },
      }
    );
  });

  // 상위 자체 카운터 핸들러
  ParentActionContext.useActionHandler('incrementParentCounter', () => {
    const currentCount = parentCounterStore.getValue();
    const newCount = currentCount + 1;
    parentCounterStore.setValue(newCount);

    actionLogger.logAction(
      'incrementParentCounter',
      {},
      {
        context: 'Parent Context',
        toast: { type: 'success', message: `상위 카운터 증가: ${newCount}` },
      }
    );
  });

  ParentActionContext.useActionHandler('resetParentCounter', () => {
    parentCounterStore.setValue(0);

    actionLogger.logAction(
      'resetParentCounter',
      {},
      {
        context: 'Parent Context',
        toast: { type: 'info', message: '상위 카운터 리셋됨' },
      }
    );
  });

  // 하위 컴포넌트 제어 인터페이스 (구현체는 모르고 인터페이스만 사용)
  ParentActionContext.useActionHandler(
    'controlChild',
    ({ childId, action, amount }) => {
      actionLogger.logAction(
        'controlChild',
        { childId, action, amount },
        {
          context: 'Parent Context',
          toast: {
            type: 'info',
            message: `${childId} 원격 제어: ${action}${amount ? ` (${amount})` : ''}`,
          },
        }
      );

      // 실제 제어는 하위 컴포넌트가 이 액션을 구독하여 처리
      // 상위는 단순히 명령만 발송하고, 하위가 자율적으로 반응
    }
  );

  return null;
}

function ReactContextPage() {
  return (
    <PageWithLogMonitor
      pageId="react-context"
      title="React Context Communication"
      initialConfig={{ enableToast: true, maxLogs: 100 }}
    >
      <div className="page-container">
        <header className="page-header">
          <h1>React Context 간 통신</h1>
          <p className="page-description">
            완전히 독립적인 컴포넌트들이 dependency inversion 패턴을 통해 상위
            컨텍스트와 통신합니다. 각 컴포넌트는 자체 Provider를 가지며, Context
            API 계층을 통해 상위 ActionRegister에 접근합니다.
          </p>
        </header>

        {/* 상위 컨텍스트: 인터페이스만 정의 */}
        <ParentContextContainer>
          <ParentContextUI />

          {/* 독립적인 하위 컴포넌트들 - 각자 완전히 분리된 Provider */}
          <div className="ml-8 mt-4 space-y-4">
            <IndependentChildA />
            <IndependentChildB />
          </div>
        </ParentContextContainer>

        <CommunicationExplanation />

        {/* 코드 예제 */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              📝 Dependency Inversion 패턴 구현
            </h3>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
              {`// 1. 양방향 통신 인터페이스 정의
interface ParentActions extends ActionPayloadMap {
  onChildRegistered: { childId: string; childType: string };
  incrementParentCounter: void; // 하위에서 상위 카운터 증가
  controlChild: { childId: string; action: 'increment' | 'reset'; amount?: number };
}

// 2. 하위 → 상위 통신 (직접 호출)
function ChildAUI() {
  const parentDispatch = ParentActionContext.useActionDispatch();
  
  return (
    <button onClick={() => parentDispatch('incrementParentCounter')}>
      🔼 상위 카운터 +1
    </button>
  );
}

// 3. 상위 → 하위 제어 (인터페이스 기반)
function ParentContextUI() {
  const parentDispatch = ParentActionContext.useActionDispatch();
  
  return (
    <button onClick={() => parentDispatch('controlChild', { 
      childId: 'child-a-counter', action: 'increment', amount: 5 
    })}>
      🎯 Child A +5 (원격 제어)
    </button>
  );
}

// 4. 하위에서 상위 명령 구독
ParentActionContext.useActionHandler('controlChild', ({ childId, action, amount }) => {
  if (childId === 'child-a-counter' && action === 'increment') {
    // 자율적으로 반응하여 자신의 상태 변경
    const newValue = counter.getValue() + (amount || 1);
    counter.setValue(newValue);
  }
});`}
            </pre>
          </CardContent>
        </Card>
      </div>
    </PageWithLogMonitor>
  );
}

export default ReactContextPage;
