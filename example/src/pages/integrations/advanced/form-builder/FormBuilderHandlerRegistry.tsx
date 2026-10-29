import { type ReactNode, useCallback } from 'react';
import {
  type FieldType,
  type FormBuilderActions as FormBuilderActionMap,
  FormBuilderActions,
  FormBuilderStores,
  type FormField,
  type FormState,
  initialFormState,
} from './FormBuilderContexts';

function makeField(type: FieldType, index: number): FormField {
  const id = `${type}-${Date.now()}-${index}`;
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

function validate(form: FormState): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of form.fields) {
    const value = form.values[field.id];
    if (
      field.required &&
      (value === undefined || value === '' || value === false)
    )
      errors[field.id] = '필수 입력 항목입니다.';
    else if (
      field.type === 'email' &&
      typeof value === 'string' &&
      value &&
      !/^\S+@\S+\.\S+$/u.test(value)
    )
      errors[field.id] = '올바른 이메일 형식을 입력하세요.';
  }
  return errors;
}

export function FormBuilderHandlerRegistry({
  children,
}: {
  children?: ReactNode;
}) {
  const formStore = FormBuilderStores.useStore('form');
  const addField = useCallback(
    ({ type }: FormBuilderActionMap['addField']) => {
      const current = formStore.getValue();
      const field = makeField(type, current.fields.length);
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
    [formStore]
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
    const errors = validate(current);
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
