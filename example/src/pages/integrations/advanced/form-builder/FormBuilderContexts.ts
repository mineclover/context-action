import type { ActionPayloadMap } from '@context-action/core';
import { createActionContext, createStoreContext } from '@context-action/react';

export type FieldType = 'text' | 'email' | 'number' | 'textarea' | 'checkbox';
export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder: string;
  required: boolean;
}
export interface FormState {
  fields: FormField[];
  values: Record<string, string | boolean>;
  errors: Record<string, string>;
  submitted: boolean;
}

export interface FormBuilderActions extends ActionPayloadMap {
  addField: { type: FieldType };
  updateField: { id: string; patch: Omit<Partial<FormField>, 'id'> };
  removeField: { id: string };
  updateValue: { id: string; value: string | boolean };
  submit: void;
  reset: void;
}

export const initialFields: FormField[] = [
  {
    id: 'name',
    type: 'text',
    label: '이름',
    placeholder: '홍길동',
    required: true,
  },
  {
    id: 'email',
    type: 'email',
    label: '이메일',
    placeholder: 'team@example.com',
    required: true,
  },
];

export const initialFormState = (): FormState => ({
  fields: initialFields.map((field) => ({ ...field })),
  values: { name: '', email: '' },
  errors: {},
  submitted: false,
});

export const FormBuilderStores = createStoreContext('FormBuilderDemoStores', {
  form: { initialValue: initialFormState() },
});

export const FormBuilderActions = createActionContext<FormBuilderActions>(
  'FormBuilderDemoActions'
);
