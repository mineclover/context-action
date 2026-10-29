import { describe, expect, it } from 'vitest';
import { type FormState, initialFields } from '../FormBuilderContexts';
import { validateForm } from './formValidation';

const form = (overrides: Partial<FormState> = {}): FormState => ({
  fields: initialFields.map((field) => ({ ...field })),
  values: { name: '', email: '' },
  errors: {},
  submitted: false,
  ...overrides,
});

describe('validateForm', () => {
  it('reports missing required values, including unchecked checkboxes', () => {
    expect(
      validateForm(
        form({
          fields: [{ ...initialFields[0]!, type: 'checkbox', id: 'consent' }],
          values: { consent: false },
        })
      )
    ).toEqual({ consent: '필수 입력 항목입니다.' });
  });

  it('validates non-empty email values and ignores optional empty fields', () => {
    const fields = [{ ...initialFields[1]!, required: false }];

    expect(validateForm(form({ fields, values: { email: '' } }))).toEqual({});
    expect(
      validateForm(form({ fields, values: { email: 'invalid-email' } }))
    ).toEqual({ email: '올바른 이메일 형식을 입력하세요.' });
    expect(
      validateForm(form({ fields, values: { email: 'team@example.com' } }))
    ).toEqual({});
  });
});
