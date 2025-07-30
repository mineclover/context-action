import {
  type ActionPayloadMap,
  createActionContext,
} from '@context-action/react';
import { useCallback, useState } from 'react';

// === 타입 정의 ===
interface FormActionMap extends ActionPayloadMap {
  updateField: { field: string; value: string };
  validateField: { field: string; value: string };
  submitForm: { formData: Record<string, string> };
  resetForm: undefined;
  setFieldError: { field: string; error: string | null };
  clearAllErrors: undefined;
  setFormSubmitting: boolean;
}

interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => string | null;
}

interface ValidationRules {
  [key: string]: ValidationRule;
}

interface FormState {
  values: Record<string, string>;
  errors: Record<string, string | null>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
}

// === 컨텍스트 생성 ===
const { Provider, useAction, useActionHandler } =
  createActionContext<FormActionMap>();

// === 스타일 객체 (컴포넌트 외부) ===
const styles = {
  container: {
    padding: '20px',
    border: '1px solid #e9ecef',
    borderRadius: '8px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '30px',
    marginTop: '30px',
  },
  fieldContainer: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold' as const,
  },
  labelError: {
    color: '#dc3545',
  },
  labelNormal: {
    color: '#495057',
  },
  input: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '4px',
    fontSize: '14px',
  },
  inputNormal: {
    border: '1px solid #ced4da',
  },
  inputError: {
    border: '1px solid #dc3545',
  },
  textarea: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '4px',
    fontSize: '14px',
    resize: 'vertical' as const,
  },
  errorMessage: {
    color: '#dc3545',
    fontSize: '12px',
    marginTop: '5px',
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    marginTop: '20px',
  },
  button: {
    padding: '10px 20px',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer' as const,
  },
  submitButton: {
    backgroundColor: '#28a745',
  },
  submitButtonDisabled: {
    backgroundColor: '#6c757d',
    cursor: 'not-allowed' as const,
  },
  resetButton: {
    backgroundColor: '#6c757d',
  },
  warningButton: {
    backgroundColor: '#ffc107',
    color: 'black',
  },
  primaryButton: {
    backgroundColor: '#007bff',
  },
  dangerButton: {
    backgroundColor: '#dc3545',
  },
  formStatus: {
    marginTop: '20px',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
  },
  statusText: {
    fontSize: '12px',
    fontFamily: 'monospace',
  },
  fieldRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    marginBottom: '15px',
  },
  fieldFlex: {
    flex: 1,
  },
  removeButton: {
    padding: '8px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    marginTop: '25px',
    cursor: 'pointer' as const,
  },
  fieldCounter: {
    fontSize: '14px',
    color: '#6c757d',
  },
  codeExample: {
    marginTop: '30px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
  },
  pre: {
    overflow: 'auto' as const,
    fontSize: '14px',
  },
} as const;

// === 커스텀 훅 ===
function useFormManager(
  initialValues: Record<string, string>,
  validationRules: ValidationRules
) {
  const [formState, setFormState] = useState<FormState>({
    values: initialValues,
    errors: {},
    touched: {},
    isSubmitting: false,
    isValid: false,
  });

  const updateFieldHandler = useCallback(
    ({ field, value }: { field: string; value: string }) => {
      setFormState((prev) => ({
        ...prev,
        values: { ...prev.values, [field]: value },
        touched: { ...prev.touched, [field]: true },
      }));
    },
    []
  );

  const validateFieldHandler = useCallback(
    ({ field, value }: { field: string; value: string }) => {
      const rule = validationRules[field];
      let error: string | null = null;

      if (rule) {
        if (rule.required && !value.trim()) {
          error = `${field}는 필수 입력 항목입니다.`;
        } else if (rule.minLength && value.length < rule.minLength) {
          error = `${field}는 최소 ${rule.minLength}자 이상이어야 합니다.`;
        } else if (rule.maxLength && value.length > rule.maxLength) {
          error = `${field}는 최대 ${rule.maxLength}자까지 입력 가능합니다.`;
        } else if (rule.pattern && !rule.pattern.test(value)) {
          error = `${field} 형식이 올바르지 않습니다.`;
        } else if (rule.custom) {
          error = rule.custom(value);
        }
      }

      setFormState((prev) => {
        const newErrors = { ...prev.errors, [field]: error };
        const isValid = Object.values(newErrors).every((err) => !err);

        return {
          ...prev,
          errors: newErrors,
          isValid,
        };
      });
    },
    [validationRules]
  );

  const submitFormHandler = useCallback(
    async ({ formData }: { formData: Record<string, string> }) => {
      setFormState((prev) => ({ ...prev, isSubmitting: true }));

      try {
        const errors: Record<string, string | null> = {};
        let hasErrors = false;

        for (const [field, value] of Object.entries(formData)) {
          const rule = validationRules[field];
          if (rule?.required && !value.trim()) {
            errors[field] = `${field}는 필수 입력 항목입니다.`;
            hasErrors = true;
          }
        }

        if (hasErrors) {
          setFormState((prev) => ({
            ...prev,
            errors,
            isSubmitting: false,
          }));
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 2000));

        console.log('Form submitted successfully:', formData);
        alert('폼이 성공적으로 제출되었습니다!');
      } catch (error) {
        console.error('Form submission error:', error);
        alert('폼 제출 중 오류가 발생했습니다.');
      } finally {
        setFormState((prev) => ({ ...prev, isSubmitting: false }));
      }
    },
    [validationRules]
  );

  const resetFormHandler = useCallback(() => {
    setFormState({
      values: initialValues,
      errors: {},
      touched: {},
      isSubmitting: false,
      isValid: false,
    });
  }, [initialValues]);

  const setFieldErrorHandler = useCallback(
    ({ field, error }: { field: string; error: string | null }) => {
      setFormState((prev) => {
        const newErrors = { ...prev.errors, [field]: error };
        const isValid = Object.values(newErrors).every((err) => !err);

        return {
          ...prev,
          errors: newErrors,
          isValid,
        };
      });
    },
    []
  );

  const clearAllErrorsHandler = useCallback(() => {
    setFormState((prev) => ({
      ...prev,
      errors: {},
      isValid: true,
    }));
  }, []);

  // 액션 핸들러 등록
  useActionHandler('updateField', updateFieldHandler);
  useActionHandler('validateField', validateFieldHandler);
  useActionHandler('submitForm', submitFormHandler);
  useActionHandler('resetForm', resetFormHandler);
  useActionHandler('setFieldError', setFieldErrorHandler);
  useActionHandler('clearAllErrors', clearAllErrorsHandler);

  return formState;
}

function useFormActions() {
  const dispatch = useAction();

  return {
    updateField: (field: string, value: string) => {
      dispatch('updateField', { field, value });
      dispatch('validateField', { field, value });
    },
    submitForm: (formData: Record<string, string>) =>
      dispatch('submitForm', { formData }),
    resetForm: () => dispatch('resetForm'),
    setFieldError: (field: string, error: string | null) =>
      dispatch('setFieldError', { field, error }),
    clearAllErrors: () => dispatch('clearAllErrors'),
  };
}

function useDynamicFields() {
  const [fields, setFields] = useState([
    { id: '1', name: 'item1', label: '항목 1' },
  ]);

  const addField = useCallback(() => {
    const newField = {
      id: Date.now().toString(),
      name: `item${fields.length + 1}`,
      label: `항목 ${fields.length + 1}`,
    };
    setFields((prev) => [...prev, newField]);
  }, [fields.length]);

  const removeField = useCallback((id: string) => {
    setFields((prev) => prev.filter((field) => field.id !== id));
  }, []);

  return {
    fields,
    addField,
    removeField,
  };
}

// === 순수 뷰 컴포넌트 ===
function FormFieldView({
  name,
  label,
  type = 'text',
  placeholder,
  value,
  error,
  touched,
  onChange,
}: {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  error: string | null;
  touched: boolean;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
}) {
  return (
    <div style={styles.fieldContainer}>
      <label
        style={{
          ...styles.label,
          ...(error && touched ? styles.labelError : styles.labelNormal),
        }}
      >
        {label}
      </label>

      {type === 'textarea' ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={4}
          style={{
            ...styles.textarea,
            ...(error && touched ? styles.inputError : styles.inputNormal),
          }}
        />
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          style={{
            ...styles.input,
            ...(error && touched ? styles.inputError : styles.inputNormal),
          }}
        />
      )}

      {error && touched && <div style={styles.errorMessage}>{error}</div>}
    </div>
  );
}

function FormStatusView({ formState }: { formState: FormState }) {
  return (
    <div style={styles.formStatus}>
      <h4>폼 상태</h4>
      <div style={styles.statusText}>
        <div>
          유효성: {formState.isValid ? '✅ 유효함' : '❌ 유효하지 않음'}
        </div>
        <div>
          제출 중: {formState.isSubmitting ? '⏳ 진행 중' : '⏸️ 대기 중'}
        </div>
        <div>
          에러 개수: {Object.values(formState.errors).filter(Boolean).length}
        </div>
        <div>
          터치된 필드:{' '}
          {
            Object.keys(formState.touched).filter(
              (field) => formState.touched[field]
            ).length
          }
        </div>
      </div>
    </div>
  );
}

function BasicFormView({
  formState,
  onSubmit,
  onReset,
}: {
  formState: FormState;
  onSubmit: (e: React.FormEvent) => void;
  onReset: () => void;
}) {
  return (
    <div style={styles.container}>
      <h3>📝 기본 폼 예시</h3>
      <form onSubmit={onSubmit}>
        <FormField
          name="name"
          label="이름"
          placeholder="이름을 입력하세요"
          formState={formState}
        />
        <FormField
          name="email"
          label="이메일"
          type="email"
          placeholder="example@email.com"
          formState={formState}
        />
        <FormField
          name="age"
          label="나이"
          type="number"
          placeholder="나이를 입력하세요"
          formState={formState}
        />

        <div style={styles.buttonGroup}>
          <button
            type="submit"
            disabled={!formState.isValid || formState.isSubmitting}
            style={{
              ...styles.button,
              ...(formState.isValid && !formState.isSubmitting
                ? styles.submitButton
                : styles.submitButtonDisabled),
            }}
          >
            {formState.isSubmitting ? '제출 중...' : '제출'}
          </button>

          <button
            type="button"
            onClick={onReset}
            style={{ ...styles.button, ...styles.resetButton }}
          >
            리셋
          </button>
        </div>
      </form>

      <FormStatusView formState={formState} />
    </div>
  );
}

function DynamicFormView({
  fields,
  formState,
  onSubmit,
  onAddField,
  onRemoveField,
}: {
  fields: Array<{ id: string; name: string; label: string }>;
  formState: FormState;
  onSubmit: (e: React.FormEvent) => void;
  onAddField: () => void;
  onRemoveField: (id: string) => void;
}) {
  return (
    <div style={styles.container}>
      <h3>🔄 동적 폼 예시</h3>

      <div style={{ marginBottom: '20px' }}>
        <button
          type="button"
          onClick={onAddField}
          style={{
            ...styles.button,
            ...styles.primaryButton,
            marginRight: '10px',
          }}
        >
          + 필드 추가
        </button>

        <span style={styles.fieldCounter}>현재 {fields.length}개 필드</span>
      </div>

      <form onSubmit={onSubmit}>
        {fields.map((field) => (
          <div key={field.id} style={styles.fieldRow}>
            <div style={styles.fieldFlex}>
              <FormField
                name={field.name}
                label={field.label}
                placeholder={`${field.label}을 입력하세요`}
                formState={formState}
              />
            </div>

            {fields.length > 1 && (
              <button
                type="button"
                onClick={() => onRemoveField(field.id)}
                style={styles.removeButton}
              >
                ✕
              </button>
            )}
          </div>
        ))}

        <div style={{ marginTop: '20px' }}>
          <button
            type="submit"
            disabled={!formState.isValid || formState.isSubmitting}
            style={{
              ...styles.button,
              ...(formState.isValid && !formState.isSubmitting
                ? styles.submitButton
                : styles.submitButtonDisabled),
            }}
          >
            {formState.isSubmitting ? '제출 중...' : '동적 폼 제출'}
          </button>
        </div>
      </form>
    </div>
  );
}

function RealtimeValidationFormView({
  formState,
  onSubmit,
  onClearErrors,
}: {
  formState: FormState;
  onSubmit: (e: React.FormEvent) => void;
  onClearErrors: () => void;
}) {
  return (
    <div style={styles.container}>
      <h3>⚡ 실시간 검증 폼</h3>

      <form onSubmit={onSubmit}>
        <FormField
          name="username"
          label="사용자명 (영문, 숫자, _ 만 허용)"
          placeholder="username"
          formState={formState}
        />

        <FormField
          name="password"
          label="비밀번호 (8자 이상, 대소문자, 숫자, 특수문자 포함)"
          type="password"
          placeholder="********"
          formState={formState}
        />

        <FormField
          name="confirmPassword"
          label="비밀번호 확인"
          type="password"
          placeholder="********"
          formState={formState}
        />

        <div style={styles.buttonGroup}>
          <button
            type="submit"
            disabled={!formState.isValid || formState.isSubmitting}
            style={{
              ...styles.button,
              ...(formState.isValid && !formState.isSubmitting
                ? styles.submitButton
                : styles.submitButtonDisabled),
            }}
          >
            회원가입
          </button>

          <button
            type="button"
            onClick={onClearErrors}
            style={{ ...styles.button, ...styles.warningButton }}
          >
            에러 지우기
          </button>
        </div>
      </form>
    </div>
  );
}

// === 컨테이너 컴포넌트 ===
function FormField({
  name,
  label,
  type = 'text',
  placeholder,
  formState,
}: {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  formState: FormState;
}) {
  const { updateField } = useFormActions();

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      updateField(name, e.target.value);
    },
    [name, updateField]
  );

  const value = formState.values[name] || '';
  const error = formState.errors[name];
  const touched = formState.touched[name];

  return (
    <FormFieldView
      name={name}
      label={label}
      type={type}
      placeholder={placeholder}
      value={value}
      error={error}
      touched={touched}
      onChange={handleChange}
    />
  );
}

function BasicForm() {
  const validationRules: ValidationRules = {
    name: { required: true, minLength: 2, maxLength: 50 },
    email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    age: {
      required: true,
      custom: (value) => {
        const num = parseInt(value);
        if (isNaN(num)) return '숫자를 입력해주세요.';
        if (num < 1 || num > 120) return '나이는 1-120 사이여야 합니다.';
        return null;
      },
    },
  };

  const formState = useFormManager(
    { name: '', email: '', age: '' },
    validationRules
  );

  const { submitForm, resetForm } = useFormActions();

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      submitForm(formState.values);
    },
    [submitForm, formState.values]
  );

  const handleReset = useCallback(() => {
    resetForm();
  }, [resetForm]);

  return (
    <BasicFormView
      formState={formState}
      onSubmit={handleSubmit}
      onReset={handleReset}
    />
  );
}

function DynamicForm() {
  const { fields, addField, removeField } = useDynamicFields();

  const validationRules: ValidationRules = fields.reduce((rules, field) => {
    rules[field.name] = { required: true, minLength: 2 };
    return rules;
  }, {} as ValidationRules);

  const initialValues = fields.reduce(
    (values, field) => {
      values[field.name] = '';
      return values;
    },
    {} as Record<string, string>
  );

  const formState = useFormManager(initialValues, validationRules);
  const { submitForm } = useFormActions();

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      submitForm(formState.values);
    },
    [submitForm, formState.values]
  );

  return (
    <DynamicFormView
      fields={fields}
      formState={formState}
      onSubmit={handleSubmit}
      onAddField={addField}
      onRemoveField={removeField}
    />
  );
}

function RealtimeValidationForm() {
  const validationRules: ValidationRules = {
    username: {
      required: true,
      minLength: 3,
      maxLength: 20,
      pattern: /^[a-zA-Z0-9_]+$/,
    },
    password: {
      required: true,
      minLength: 8,
      custom: (value) => {
        if (!/(?=.*[a-z])/.test(value)) return '소문자를 포함해야 합니다.';
        if (!/(?=.*[A-Z])/.test(value)) return '대문자를 포함해야 합니다.';
        if (!/(?=.*\d)/.test(value)) return '숫자를 포함해야 합니다.';
        if (!/(?=.*[@$!%*?&])/.test(value))
          return '특수문자를 포함해야 합니다.';
        return null;
      },
    },
    confirmPassword: {
      required: true,
      custom: (value) => {
        return value.length < 8 ? '비밀번호 확인을 입력해주세요.' : null;
      },
    },
  };

  const formState = useFormManager(
    { username: '', password: '', confirmPassword: '' },
    validationRules
  );

  const { submitForm, setFieldError, clearAllErrors } = useFormActions();

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (formState.values.password !== formState.values.confirmPassword) {
        setFieldError('confirmPassword', '비밀번호가 일치하지 않습니다.');
        return;
      }

      submitForm(formState.values);
    },
    [formState.values, submitForm, setFieldError]
  );

  const handleClearErrors = useCallback(() => {
    clearAllErrors();
  }, [clearAllErrors]);

  return (
    <RealtimeValidationFormView
      formState={formState}
      onSubmit={handleSubmit}
      onClearErrors={handleClearErrors}
    />
  );
}

function ReactFormsContent() {
  return (
    <div>
      <h1>React Integration - Forms</h1>
      <p>
        복잡한 폼 처리를 위한 액션 기반 패턴을 보여줍니다. 실시간 유효성 검사,
        동적 필드 관리, 폼 상태 추적 등을 다룹니다.
      </p>

      <div style={styles.grid}>
        <BasicForm />
        <RealtimeValidationForm />
        <DynamicForm />
      </div>

      <div style={styles.codeExample}>
        <h3>폼 관리 패턴 예시</h3>
        <pre style={styles.pre}>
          {`// 1. 폼 액션 정의
interface FormActionMap extends ActionPayloadMap {
  updateField: { field: string; value: string };
  validateField: { field: string; value: string };
  submitForm: { formData: Record<string, string> };
  setFieldError: { field: string; error: string | null };
}

// 2. 폼 상태 관리 훅
function useFormManager(initialValues, validationRules) {
  const [formState, setFormState] = useState({
    values: initialValues,
    errors: {},
    touched: {},
    isSubmitting: false,
    isValid: false,
  });

  // 필드 업데이트 시 자동 검증
  useActionHandler('updateField', ({ field, value }) => {
    setFormState(prev => ({
      ...prev,
      values: { ...prev.values, [field]: value },
      touched: { ...prev.touched, [field]: true },
    }));
    dispatch('validateField', { field, value });
  });

  return formState;
}

// 3. 폼 컴포넌트에서 사용
function MyForm() {
  const formState = useFormManager(initialValues, rules);
  const dispatch = useAction();
  
  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch('submitForm', { formData: formState.values });
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <FormField name="email" formState={formState} />
      <button type="submit" disabled={!formState.isValid}>
        제출
      </button>
    </form>
  );
}`}
        </pre>
      </div>
    </div>
  );
}

export function ReactFormsPage() {
  return (
    <Provider>
      <ReactFormsContent />
    </Provider>
  );
}
