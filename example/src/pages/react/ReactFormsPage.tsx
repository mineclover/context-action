import { useState, useCallback } from 'react';
import {
  type ActionPayloadMap,
  createActionContext,
} from '@context-action/react';

// 폼 액션 타입 정의
interface FormActionMap extends ActionPayloadMap {
  updateField: { field: string; value: string };
  validateField: { field: string; value: string };
  submitForm: { formData: Record<string, string> };
  resetForm: undefined;
  setFieldError: { field: string; error: string | null };
  clearAllErrors: undefined;
  setFormSubmitting: boolean;
}

// 유효성 검사 규칙
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

// 폼 상태 타입
interface FormState {
  values: Record<string, string>;
  errors: Record<string, string | null>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
}

// 컨텍스트 생성
const { Provider, useAction, useActionHandler } = createActionContext<FormActionMap>();

// 커스텀 훅: 폼 관리
function useFormManager(initialValues: Record<string, string>, validationRules: ValidationRules) {
  const [formState, setFormState] = useState<FormState>({
    values: initialValues,
    errors: {},
    touched: {},
    isSubmitting: false,
    isValid: false,
  });

  const dispatch = useAction();

  // 필드 업데이트 핸들러
  useActionHandler('updateField', ({ field, value }) => {
    setFormState(prev => ({
      ...prev,
      values: { ...prev.values, [field]: value },
      touched: { ...prev.touched, [field]: true },
    }));
    
    // 자동 유효성 검사
    dispatch('validateField', { field, value });
  });

  // 유효성 검사 핸들러
  useActionHandler('validateField', ({ field, value }) => {
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

    dispatch('setFieldError', { field, error });
  });

  // 에러 설정 핸들러
  useActionHandler('setFieldError', ({ field, error }) => {
    setFormState(prev => {
      const newErrors = { ...prev.errors, [field]: error };
      const isValid = Object.values(newErrors).every(err => !err);
      
      return {
        ...prev,
        errors: newErrors,
        isValid,
      };
    });
  });

  // 폼 제출 핸들러
  useActionHandler('submitForm', async ({ formData }) => {
    setFormState(prev => ({ ...prev, isSubmitting: true }));
    
    try {
      // 모든 필드 유효성 검사
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
        setFormState(prev => ({
          ...prev,
          errors,
          isSubmitting: false,
        }));
        return;
      }

      // 시뮬레이션: API 호출
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Form submitted successfully:', formData);
      alert('폼이 성공적으로 제출되었습니다!');
      
    } catch (error) {
      console.error('Form submission error:', error);
      alert('폼 제출 중 오류가 발생했습니다.');
    } finally {
      setFormState(prev => ({ ...prev, isSubmitting: false }));
    }
  });

  // 폼 리셋 핸들러
  useActionHandler('resetForm', () => {
    setFormState({
      values: initialValues,
      errors: {},
      touched: {},
      isSubmitting: false,
      isValid: false,
    });
  });

  // 모든 에러 지우기
  useActionHandler('clearAllErrors', () => {
    setFormState(prev => ({
      ...prev,
      errors: {},
      isValid: true,
    }));
  });

  return formState;
}

// 입력 필드 컴포넌트
function FormField({ 
  name, 
  label, 
  type = 'text', 
  placeholder,
  formState 
}: { 
  name: string; 
  label: string; 
  type?: string; 
  placeholder?: string;
  formState: FormState;
}) {
  const dispatch = useAction();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    dispatch('updateField', { field: name, value: e.target.value });
  };

  const value = formState.values[name] || '';
  const error = formState.errors[name];
  const touched = formState.touched[name];

  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={{ 
        display: 'block', 
        marginBottom: '5px', 
        fontWeight: 'bold',
        color: error && touched ? '#dc3545' : '#495057'
      }}>
        {label}
      </label>
      
      {type === 'textarea' ? (
        <textarea
          name={name}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          rows={4}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: `1px solid ${error && touched ? '#dc3545' : '#ced4da'}`,
            borderRadius: '4px',
            fontSize: '14px',
            resize: 'vertical',
          }}
        />
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: `1px solid ${error && touched ? '#dc3545' : '#ced4da'}`,
            borderRadius: '4px',
            fontSize: '14px',
          }}
        />
      )}
      
      {error && touched && (
        <div style={{ 
          color: '#dc3545', 
          fontSize: '12px', 
          marginTop: '5px' 
        }}>
          {error}
        </div>
      )}
    </div>
  );
}

// 기본 폼 예시
function BasicForm() {
  const validationRules: ValidationRules = {
    name: { 
      required: true, 
      minLength: 2, 
      maxLength: 50 
    },
    email: { 
      required: true, 
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ 
    },
    age: { 
      required: true,
      custom: (value) => {
        const num = parseInt(value);
        if (isNaN(num)) return '숫자를 입력해주세요.';
        if (num < 1 || num > 120) return '나이는 1-120 사이여야 합니다.';
        return null;
      }
    },
  };

  const formState = useFormManager(
    { name: '', email: '', age: '' }, 
    validationRules
  );

  const dispatch = useAction();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch('submitForm', { formData: formState.values });
  };

  const handleReset = () => {
    dispatch('resetForm');
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #e9ecef', borderRadius: '8px' }}>
      <h3>📝 기본 폼 예시</h3>
      <form onSubmit={handleSubmit}>
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

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button
            type="submit"
            disabled={!formState.isValid || formState.isSubmitting}
            style={{
              padding: '10px 20px',
              backgroundColor: formState.isValid && !formState.isSubmitting ? '#28a745' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: formState.isValid && !formState.isSubmitting ? 'pointer' : 'not-allowed',
            }}
          >
            {formState.isSubmitting ? '제출 중...' : '제출'}
          </button>
          
          <button
            type="button"
            onClick={handleReset}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
            }}
          >
            리셋
          </button>
        </div>
      </form>

      {/* 폼 상태 표시 */}
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
        <h4>폼 상태</h4>
        <div style={{ fontSize: '12px', fontFamily: 'monospace' }}>
          <div>유효성: {formState.isValid ? '✅ 유효함' : '❌ 유효하지 않음'}</div>
          <div>제출 중: {formState.isSubmitting ? '⏳ 진행 중' : '⏸️ 대기 중'}</div>
          <div>에러 개수: {Object.values(formState.errors).filter(Boolean).length}</div>
          <div>터치된 필드: {Object.keys(formState.touched).filter(field => formState.touched[field]).length}</div>
        </div>
      </div>
    </div>
  );
}

// 동적 폼 예시
function DynamicForm() {
  const [fields, setFields] = useState([
    { id: '1', name: 'item1', label: '항목 1' },
  ]);

  const dispatch = useAction();

  const addField = () => {
    const newField = {
      id: Date.now().toString(),
      name: `item${fields.length + 1}`,
      label: `항목 ${fields.length + 1}`,
    };
    setFields(prev => [...prev, newField]);
  };

  const removeField = (id: string) => {
    setFields(prev => prev.filter(field => field.id !== id));
  };

  const validationRules: ValidationRules = fields.reduce((rules, field) => {
    rules[field.name] = { required: true, minLength: 2 };
    return rules;
  }, {} as ValidationRules);

  const initialValues = fields.reduce((values, field) => {
    values[field.name] = '';
    return values;
  }, {} as Record<string, string>);

  const formState = useFormManager(initialValues, validationRules);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch('submitForm', { formData: formState.values });
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #e9ecef', borderRadius: '8px' }}>
      <h3>🔄 동적 폼 예시</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <button
          type="button"
          onClick={addField}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            marginRight: '10px',
          }}
        >
          + 필드 추가
        </button>
        
        <span style={{ fontSize: '14px', color: '#6c757d' }}>
          현재 {fields.length}개 필드
        </span>
      </div>

      <form onSubmit={handleSubmit}>
        {fields.map((field) => (
          <div key={field.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '15px' }}>
            <div style={{ flex: 1 }}>
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
                onClick={() => removeField(field.id)}
                style={{
                  padding: '8px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  marginTop: '25px',
                }}
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
              padding: '10px 20px',
              backgroundColor: formState.isValid && !formState.isSubmitting ? '#28a745' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: formState.isValid && !formState.isSubmitting ? 'pointer' : 'not-allowed',
            }}
          >
            {formState.isSubmitting ? '제출 중...' : '동적 폼 제출'}
          </button>
        </div>
      </form>
    </div>
  );
}

// 실시간 검증 폼 예시
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
        if (!/(?=.*[@$!%*?&])/.test(value)) return '특수문자를 포함해야 합니다.';
        return null;
      },
    },
    confirmPassword: {
      required: true,
      custom: (value) => {
        // Note: 실제로는 password 값과 비교해야 하지만, 여기서는 간단히 구현
        return value.length < 8 ? '비밀번호 확인을 입력해주세요.' : null;
      },
    },
  };

  const formState = useFormManager(
    { username: '', password: '', confirmPassword: '' },
    validationRules
  );

  const dispatch = useAction();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 비밀번호 확인 체크
    if (formState.values.password !== formState.values.confirmPassword) {
      dispatch('setFieldError', { 
        field: 'confirmPassword', 
        error: '비밀번호가 일치하지 않습니다.' 
      });
      return;
    }
    
    dispatch('submitForm', { formData: formState.values });
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #e9ecef', borderRadius: '8px' }}>
      <h3>⚡ 실시간 검증 폼</h3>
      
      <form onSubmit={handleSubmit}>
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

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button
            type="submit"
            disabled={!formState.isValid || formState.isSubmitting}
            style={{
              padding: '10px 20px',
              backgroundColor: formState.isValid && !formState.isSubmitting ? '#28a745' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: formState.isValid && !formState.isSubmitting ? 'pointer' : 'not-allowed',
            }}
          >
            회원가입
          </button>
          
          <button
            type="button"
            onClick={() => dispatch('clearAllErrors')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#ffc107',
              color: 'black',
              border: 'none',
              borderRadius: '4px',
            }}
          >
            에러 지우기
          </button>
        </div>
      </form>
    </div>
  );
}

function ReactFormsContent() {
  return (
    <div>
      <h1>React Integration - Forms</h1>
      <p>
        복잡한 폼 처리를 위한 액션 기반 패턴을 보여줍니다. 
        실시간 유효성 검사, 동적 필드 관리, 폼 상태 추적 등을 다룹니다.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px', marginTop: '30px' }}>
        <BasicForm />
        <RealtimeValidationForm />
        <DynamicForm />
      </div>

      {/* Code Example */}
      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <h3>폼 관리 패턴 예시</h3>
        <pre style={{ overflow: 'auto', fontSize: '14px' }}>
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

  // 유효성 검사 로직
  useActionHandler('validateField', ({ field, value }) => {
    const rule = validationRules[field];
    let error = validateValue(value, rule);
    dispatch('setFieldError', { field, error });
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