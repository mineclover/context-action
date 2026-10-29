import type { FormState } from '../FormBuilderContexts';

export function validateForm(form: FormState): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const field of form.fields) {
    const value = form.values[field.id];
    if (
      field.required &&
      (value === undefined || value === '' || value === false)
    ) {
      errors[field.id] = '필수 입력 항목입니다.';
    } else if (
      field.type === 'email' &&
      typeof value === 'string' &&
      value &&
      !/^\S+@\S+\.\S+$/u.test(value)
    ) {
      errors[field.id] = '올바른 이메일 형식을 입력하세요.';
    }
  }

  return errors;
}
