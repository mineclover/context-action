import { type ReactNode, useCallback, useId, useRef } from 'react';
import { validateForm } from './business/formValidation';
import {
  type FieldType,
  type FormBuilderActions as FormBuilderActionMap,
  FormBuilderActions,
  FormBuilderStores,
  type FormField,
  initialFormState,
} from './FormBuilderContexts';

function makeField(type: FieldType, nextId: () => string): FormField {
  const id = `${type}-${nextId()}`;
  const defaults: Record<
    FieldType,
    Pick<FormField, 'label' | 'placeholder'>
  > = {
    text: { label: '텍스트 필드', placeholder: '값을 입력하세요' },
    email: { label: '이메일 필드', placeholder: 'name@example.com' },
    number: { label: '숫자 필드', placeholder: '0' },
    textarea: { label: '상세 설명', placeholder: '내용을 입력하세요' },
    checkbox: { label: '동의 여부', placeholder: '' },
  };
  return { id, type, ...defaults[type], required: false };
}

export function FormBuilderHandlerRegistry({
  children,
}: {
  children?: ReactNode;
}) {
  const formStore = FormBuilderStores.useStore('form');
  const nextFieldIdRef = useRef(0);
  const instanceId = useId().replace(/:/gu, '');
  const addField = useCallback(
    ({ type }: FormBuilderActionMap['addField']) => {
      const current = formStore.getValue();
      const field = makeField(
        type,
        () => `${instanceId}-${++nextFieldIdRef.current}`
      );
      formStore.setValue({
        ...current,
        fields: [...current.fields, field],
        values: {
          ...current.values,
          [field.id]: type === 'checkbox' ? false : '',
        },
        errors: {},
        submitted: false,
      });
    },
    [formStore, instanceId]
  );
  const updateField = useCallback(
    ({ id, patch }: FormBuilderActionMap['updateField']) => {
      const current = formStore.getValue();
      formStore.setValue({
        ...current,
        fields: current.fields.map((field) =>
          field.id === id ? { ...field, ...patch } : field
        ),
        errors: { ...current.errors, [id]: '' },
        submitted: false,
      });
    },
    [formStore]
  );
  const removeField = useCallback(
    ({ id }: FormBuilderActionMap['removeField']) => {
      const current = formStore.getValue();
      const { [id]: _removed, ...values } = current.values;
      const { [id]: _error, ...errors } = current.errors;
      formStore.setValue({
        ...current,
        fields: current.fields.filter((field) => field.id !== id),
        values,
        errors,
        submitted: false,
      });
    },
    [formStore]
  );
  const updateValue = useCallback(
    ({ id, value }: FormBuilderActionMap['updateValue']) => {
      const current = formStore.getValue();
      formStore.setValue({
        ...current,
        values: { ...current.values, [id]: value },
        errors: { ...current.errors, [id]: '' },
        submitted: false,
      });
    },
    [formStore]
  );
  const submit = useCallback(() => {
    const current = formStore.getValue();
    const errors = validateForm(current);
    formStore.setValue({
      ...current,
      errors,
      submitted: Object.keys(errors).length === 0,
    });
  }, [formStore]);
  const reset = useCallback(
    () => formStore.setValue(initialFormState()),
    [formStore]
  );
  FormBuilderActions.useActionHandler('addField', addField);
  FormBuilderActions.useActionHandler('updateField', updateField);
  FormBuilderActions.useActionHandler('removeField', removeField);
  FormBuilderActions.useActionHandler('updateValue', updateValue);
  FormBuilderActions.useActionHandler('submit', submit);
  FormBuilderActions.useActionHandler('reset', reset);
  return <>{children}</>;
}
