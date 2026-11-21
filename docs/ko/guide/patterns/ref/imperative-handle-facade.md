# Imperative Handle Facade (`useImperativeHandle` + `createRefContext`)

React 위젯에서 `useImperativeHandle`로 **동결(frozen)되고 캡슐화된 OOP 명령 Facade**를 노출하고, 이를 `createRefContext`에 연결한 뒤 `ActionContext` 핸들러의 `withTarget`으로 제어하는 패턴입니다.

- **React 호환성**: React 18 / 19 (`react: ^18.0.0 || ^19.0.0` peer 호환을 위해 `forwardRef` 유지)
- **경계 역할**: **Tier 3 명령형 프레젠테이션 경계** — 도메인 상태는 `Store` + `ActionContext`에 두고, 컴포넌트 경계를 넘는 명령형 제어(`focus`, `validate`, `reset`, `getValue`)만 `RefContext`로 전달합니다.
- **래퍼 API 대신 패턴으로 유지하는 이유**: `forwardRef` + `useImperativeHandle` + `Object.freeze`는 표준 React 조합입니다. 별도 래퍼 API로 숨기지 않고 패턴으로 두면 React ref 수명 주기를 투명하게 유지하면서도 `RefContext`의 안정성 불변식을 명확히 지킬 수 있습니다.

## 사전 요구사항

- [RefContext 설정](../setup/ref-context-setup.md)
- [Ref 기본 사용법](./basic-usage.md)
- [코드 패턴](../../code-patterns.md)

---

## 핵심 함정: `useImperativeHandle` 의존성 배열에 상태 넣기

`useImperativeHandle`을 `createRefContext`와 함께 사용할 때, 반응형 React 상태를 `useImperativeHandle`의 의존성 배열에 넣으면 **절대 안 됩니다**:

```tsx
// ❌ 안티패턴: deps에 value가 들어가면 키 입력마다 ref가 해제 후 재등록됨
const BadInput = forwardRef<FieldHandle, Props>((props, ref) => {
  const [value, setValue] = useState('');

  useImperativeHandle(
    ref,
    () => ({
      getValue: () => value,
      validate: () => value.trim().length > 0,
      focus: () => inputRef.current?.focus(),
      reset: () => setValue(''),
    }),
    [value], // 💥 변경마다 fieldRef.setRef(null) -> fieldRef.setRef(nextHandle) 호출!
  );
  // ...
});
```

### `createRefContext`에서 왜 문제가 되는가

`deps`가 바뀔 때마다 React는 콜백 ref(`fieldRef.setRef`)를 `null`로 한 번 호출한 뒤 새 핸들 객체로 다시 호출합니다. 이 동작은 `createRefContext` 내부에서 다음 문제를 일으킵니다.

1. 입력값이 바뀔 때마다 `isMounted`가 `true → false → true`로 깜빡입니다.
2. 등록된 `onMount` 콜백이 중복 실행됩니다.
3. `useRefMountState` 구독자에게 불필요한 `useSyncExternalStore` 알림이 발생합니다.

---

## 표준 패턴: 동결된 안정 Facade (`deps: []`) + 지연 조회 Ref

노출되는 핸들 객체의 아이덴티티는 **마운트 수명 동안 고정**(`[]` deps)하고 `Object.freeze(...)`로 동결합니다. 내부 최신 상태는 동기화된 `ref`(또는 `store.getValue()`)로 지연 조회하고, 원시 DOM 노드는 컴포넌트 내부로 완전히 은닉합니다.

<!-- @context-action-compile -->
```tsx
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import type { ActionPayloadMap } from '@context-action/core';
import { createActionContext, createRefContext } from '@context-action/react';

const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect;

export interface FieldHandle {
  readonly focus: () => void;
  readonly validate: () => boolean;
  readonly reset: () => void;
  readonly getValue: () => string;
}

interface EncapsulatedFieldProps {
  label: string;
  required?: boolean;
}

export const EncapsulatedField = forwardRef<FieldHandle, EncapsulatedFieldProps>(
  function EncapsulatedField({ label, required = false }, ref) {
    const [value, setValue] = useState('');
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    // React 19 동시성 / React Compiler 순수성 규칙을 지키기 위해
    // 렌더 본문이 아닌 layout effect에서 커밋된 최신 값을 동기화합니다.
    const latestRef = useRef({ value, label, required });
    useIsomorphicLayoutEffect(() => {
      latestRef.current = { value, label, required };
    }, [value, label, required]);

    useImperativeHandle(
      ref,
      () =>
        Object.freeze({
          focus: () => {
            inputRef.current?.focus();
          },
          validate: () => {
            const current = latestRef.current;
            const valid = !current.required || current.value.trim().length > 0;
            setError(valid ? null : `${current.label} is required`);
            return valid;
          },
          reset: () => {
            latestRef.current = { ...latestRef.current, value: '' };
            setValue('');
            setError(null);
          },
          getValue: () => latestRef.current.value,
        }),
      [],
    );

    return (
      <label>
        <span>{label}</span>
        <input
          ref={inputRef}
          value={value}
          onChange={(event) => {
            const next = event.target.value;
            latestRef.current = { ...latestRef.current, value: next };
            setValue(next);
            if (error) setError(null);
          }}
        />
        {error && <span role="alert">{error}</span>}
      </label>
    );
  },
);

interface FormActions extends ActionPayloadMap {
  submitForm: void;
  resetForm: void;
}

const {
  Provider: FormActionProvider,
  useActionDispatch: useFormDispatch,
  useActionCommandHandler: useFormCommand,
} = createActionContext<FormActions>('FormFacadeActions');

const {
  Provider: FormRefProvider,
  useRefHandler: useFormRef,
} = createRefContext<{ emailField: FieldHandle }>('FormFacadeRefs');

function FormCoordinator({ children }: { children: React.ReactNode }) {
  // `isMounted` 변경 시 핸들러 콜백이 재등록되지 않도록 `withTarget`을 구조 분해합니다.
  const { withTarget } = useFormRef('emailField');

  useFormCommand(
    'submitForm',
    useCallback(async () => {
      await withTarget((handle) => {
        if (!handle.validate()) {
          handle.focus();
        }
      });
    }, [withTarget]),
  );

  useFormCommand(
    'resetForm',
    useCallback(async () => {
      await withTarget((handle) => {
        handle.reset();
      });
    }, [withTarget]),
  );

  return <>{children}</>;
}

function ProfileFormContent() {
  const emailField = useFormRef('emailField');
  const dispatch = useFormDispatch();

  return (
    <>
      <EncapsulatedField ref={emailField.setRef} label="Work Email" required />
      <button type="button" onClick={() => void dispatch('submitForm')}>
        Validate &amp; Submit
      </button>
      <button type="button" onClick={() => void dispatch('resetForm')}>
        Reset
      </button>
    </>
  );
}

export function ProfileFormSection() {
  return (
    <FormActionProvider>
      <FormRefProvider>
        <FormCoordinator>
          <ProfileFormContent />
        </FormCoordinator>
      </FormRefProvider>
    </FormActionProvider>
  );
}
```

---

## 핵심 불변식

1. **`useImperativeHandle` 의존성은 빈 배열(`[]`) 유지**: 마운트 전체 수명 동안 `setRef`가 단 하나의 안정된 핸들 참조만 받도록 보장합니다.
2. **Facade 동결 (`Object.freeze`)**: `RefContext`를 통해 전달받은 소비자가 노출 메서드를 변조하거나 임의 프로퍼티를 덮어쓰지 못하게 보호합니다.
3. **커밋 시점·이벤트 내부에서의 ref 동기화**: 동시성 렌더링·React Compiler 순수성을 지키기 위해 `latestRef` 동기화는 `useIsomorphicLayoutEffect`에서 수행하고, `handle.reset(); handle.getValue();` 같은 동일 턴 연속 호출을 지원할 때는 `onChange`/`reset` 핸들러 내부에서도 `latestRef`를 즉시 갱신합니다.
4. **코디네이터에서 `{ withTarget }` / `{ setRef }` 구조 분해**: `useRefHandler()` 반환 객체는 `isMounted` 변경 시 새 참조가 되지만, `withTarget`과 `setRef`는 마운트 상태 변화에도 참조가 안정적입니다.
5. **원시 DOM 노드 비노출 및 `forwardRef` 유지**: 부모나 `ActionContext` 핸들러는 `HTMLInputElement`가 아닌 `FieldHandle` 계약만 다루고, React 18·19 호환을 위해 `forwardRef`를 유지합니다.

## 관련 패턴

- [로컬 상태 캡슐화 핸들](./local-state-imperative-handle.md) — `useLocalStore` / `useReducer` 기반 위젯 내부 상태 은닉
- [외부 OOP 라이프사이클 브릿지](./external-oop-lifecycle.md) — `useLayoutEffect` + `createRefContext`로 비-React OOP 엔진 수명 관리
- [통합 트라이어드 자율 동기화 가이드](../../../context-layered/triad-evidence-sync-guide.md) — 명령형 핸들이 Tier 3 휘발성 프레젠테이션 경계로 분류되는 이유
