import { useStoreValue } from '@context-action/react';
import { useMemo } from 'react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  Input,
  Textarea,
} from '@/components/ui';
import {
  type FieldType,
  FormBuilderActions,
  FormBuilderStores,
  type FormField,
} from './FormBuilderContexts';
import { FormBuilderHandlerRegistry } from './FormBuilderHandlerRegistry';

function FieldPreview({
  field,
  value,
  error,
  onChange,
}: {
  field: FormField;
  value: string | boolean | undefined;
  error?: string;
  onChange: (value: string | boolean) => void;
}) {
  const inputId = `form-field-${field.id}`;
  const errorId = `${inputId}-error`;
  const common = {
    id: inputId,
    placeholder: field.placeholder,
    className: 'w-full rounded-md border border-slate-300 px-3 py-2 text-sm',
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? errorId : undefined,
  };
  return (
    <div className="space-y-1">
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-slate-700"
      >
        {field.label}
        {field.required ? ' *' : ''}
      </label>
      {field.type === 'textarea' ? (
        <Textarea
          {...common}
          value={String(value ?? '')}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : field.type === 'checkbox' ? (
        <span className="flex items-center gap-2">
          <input
            id={inputId}
            type="checkbox"
            checked={Boolean(value)}
            aria-invalid={common['aria-invalid']}
            aria-describedby={common['aria-describedby']}
            onChange={(event) => onChange(event.target.checked)}
          />{' '}
          동의합니다
        </span>
      ) : (
        <Input
          {...common}
          type={field.type}
          value={String(value ?? '')}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      {error ? (
        <span id={errorId} role="alert" className="text-xs text-red-600">
          {error}
        </span>
      ) : null}
    </div>
  );
}

function FormBuilderSurface() {
  const dispatch = FormBuilderActions.useActionDispatch();
  const form = useStoreValue(FormBuilderStores.useStore('form'));
  const schemaJson = useMemo(
    () => JSON.stringify(form.fields, null, 2),
    [form.fields]
  );
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {(
          ['text', 'email', 'number', 'textarea', 'checkbox'] as FieldType[]
        ).map((type) => (
          <Button
            key={type}
            variant="outline"
            size="sm"
            onClick={() => dispatch('addField', { type })}
          >
            + {type}
          </Button>
        ))}
        <Button variant="outline" size="sm" onClick={() => dispatch('reset')}>
          초기화
        </Button>
        <Badge variant="outline">{form.fields.length} fields</Badge>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-4 p-5">
            <h4 className="font-semibold text-slate-900">필드 설정</h4>
            {form.fields.map((field) => (
              <div
                key={field.id}
                className="space-y-2 rounded-lg border border-slate-200 p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <strong className="text-sm">{field.type}</strong>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => dispatch('removeField', { id: field.id })}
                  >
                    삭제
                  </Button>
                </div>
                <label
                  htmlFor={`field-label-${field.id}`}
                  className="block text-xs font-medium text-slate-600"
                >
                  필드 라벨
                </label>
                <Input
                  id={`field-label-${field.id}`}
                  value={field.label}
                  onChange={(event) =>
                    dispatch('updateField', {
                      id: field.id,
                      patch: { label: event.target.value },
                    })
                  }
                  placeholder="라벨"
                />
                {field.type !== 'checkbox' && (
                  <div>
                    <label
                      htmlFor={`field-placeholder-${field.id}`}
                      className="block text-xs font-medium text-slate-600"
                    >
                      Placeholder
                    </label>
                    <Input
                      id={`field-placeholder-${field.id}`}
                      value={field.placeholder}
                      onChange={(event) =>
                        dispatch('updateField', {
                          id: field.id,
                          patch: { placeholder: event.target.value },
                        })
                      }
                      placeholder="placeholder"
                    />
                  </div>
                )}
                <label
                  htmlFor={`field-required-${field.id}`}
                  className="flex items-center gap-2 text-sm"
                >
                  <input
                    id={`field-required-${field.id}`}
                    type="checkbox"
                    checked={field.required}
                    onChange={(event) =>
                      dispatch('updateField', {
                        id: field.id,
                        patch: { required: event.target.checked },
                      })
                    }
                  />{' '}
                  필수 필드
                </label>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-slate-900">실시간 미리보기</h4>
              <Badge variant="outline">
                {form.submitted ? 'valid' : 'draft'}
              </Badge>
            </div>
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                dispatch('submit');
              }}
            >
              {form.fields.map((field) => (
                <FieldPreview
                  key={field.id}
                  field={field}
                  value={form.values[field.id]}
                  error={form.errors[field.id]}
                  onChange={(value) =>
                    dispatch('updateValue', { id: field.id, value })
                  }
                />
              ))}
              <Button type="submit">검증 및 제출</Button>
            </form>
            {form.submitted && (
              <p
                role="status"
                className="rounded-md bg-green-50 p-3 text-sm text-green-700"
              >
                모든 필드가 유효합니다.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      <details>
        <summary className="cursor-pointer text-sm font-medium text-slate-700">
          폼 schema 보기
        </summary>
        <pre className="mt-2 overflow-auto rounded-md bg-slate-950 p-4 text-xs text-slate-100">
          {schemaJson}
        </pre>
      </details>
    </div>
  );
}

export function FormBuilderInteractiveDemo() {
  return (
    <FormBuilderActions.Provider>
      <FormBuilderStores.Provider>
        <FormBuilderHandlerRegistry>
          <FormBuilderSurface />
        </FormBuilderHandlerRegistry>
      </FormBuilderStores.Provider>
    </FormBuilderActions.Provider>
  );
}
