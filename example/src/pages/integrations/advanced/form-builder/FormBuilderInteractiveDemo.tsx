import { useCallback, useMemo } from 'react';
import { createActionContext, createStoreContext, useStoreValue } from '@context-action/react';
import { Badge, Button, Card, CardContent, Input, Textarea } from '@/components/ui';

type FieldType = 'text' | 'email' | 'number' | 'textarea' | 'checkbox';
interface FormField { id: string; type: FieldType; label: string; placeholder: string; required: boolean; }
interface FormState { fields: FormField[]; values: Record<string, string | boolean>; errors: Record<string, string>; submitted: boolean; }
interface FormBuilderActions {
  addField: { type: FieldType };
  updateField: { id: string; patch: Partial<FormField> };
  removeField: { id: string };
  updateValue: { id: string; value: string | boolean };
  submit: void;
  reset: void;
}

const initialFields: FormField[] = [
  { id: 'name', type: 'text', label: '이름', placeholder: '홍길동', required: true },
  { id: 'email', type: 'email', label: '이메일', placeholder: 'team@example.com', required: true },
];
const initialFormState = (): FormState => ({ fields: initialFields, values: { name: '', email: '' }, errors: {}, submitted: false });

const FormBuilderStores = createStoreContext('FormBuilderDemoStores', { form: { initialValue: initialFormState() } });
const FormBuilderActions = createActionContext<FormBuilderActions>('FormBuilderDemoActions');

function makeField(type: FieldType, index: number): FormField {
  const id = `${type}-${Date.now()}-${index}`;
  const defaults: Record<FieldType, Pick<FormField, 'label' | 'placeholder'>> = {
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
    if (field.required && (value === undefined || value === '' || value === false)) errors[field.id] = '필수 입력 항목입니다.';
    else if (field.type === 'email' && typeof value === 'string' && value && !/^\S+@\S+\.\S+$/u.test(value)) errors[field.id] = '올바른 이메일 형식을 입력하세요.';
  }
  return errors;
}

function FormBuilderHandlers() {
  const formStore = FormBuilderStores.useStore('form');
  const addField = useCallback(({ type }: { type: FieldType }) => {
    const current = formStore.getValue();
    const field = makeField(type, current.fields.length);
    formStore.setValue({ ...current, fields: [...current.fields, field], values: { ...current.values, [field.id]: type === 'checkbox' ? false : '' }, errors: {}, submitted: false });
  }, [formStore]);
  const updateField = useCallback(({ id, patch }: FormBuilderActions['updateField']) => {
    const current = formStore.getValue();
    formStore.setValue({ ...current, fields: current.fields.map(field => field.id === id ? { ...field, ...patch } : field), errors: { ...current.errors, [id]: '' }, submitted: false });
  }, [formStore]);
  const removeField = useCallback(({ id }: { id: string }) => {
    const current = formStore.getValue();
    const { [id]: _removed, ...values } = current.values;
    const { [id]: _error, ...errors } = current.errors;
    formStore.setValue({ ...current, fields: current.fields.filter(field => field.id !== id), values, errors, submitted: false });
  }, [formStore]);
  const updateValue = useCallback(({ id, value }: FormBuilderActions['updateValue']) => {
    const current = formStore.getValue();
    formStore.setValue({ ...current, values: { ...current.values, [id]: value }, errors: { ...current.errors, [id]: '' }, submitted: false });
  }, [formStore]);
  const submit = useCallback(() => {
    const current = formStore.getValue();
    const errors = validate(current);
    formStore.setValue({ ...current, errors, submitted: Object.keys(errors).length === 0 });
  }, [formStore]);
  const reset = useCallback(() => formStore.setValue(initialFormState()), [formStore]);
  FormBuilderActions.useActionHandler('addField', addField);
  FormBuilderActions.useActionHandler('updateField', updateField);
  FormBuilderActions.useActionHandler('removeField', removeField);
  FormBuilderActions.useActionHandler('updateValue', updateValue);
  FormBuilderActions.useActionHandler('submit', submit);
  FormBuilderActions.useActionHandler('reset', reset);
  return null;
}

function FieldPreview({ field, value, error, onChange }: { field: FormField; value: string | boolean | undefined; error?: string; onChange: (value: string | boolean) => void }) {
  const common = { placeholder: field.placeholder, className: 'w-full rounded-md border border-slate-300 px-3 py-2 text-sm' };
  return <label className="block space-y-1">
    <span className="text-sm font-medium text-slate-700">{field.label}{field.required ? ' *' : ''}</span>
    {field.type === 'textarea' ? <Textarea {...common} value={String(value ?? '')} onChange={event => onChange(event.target.value)} />
      : field.type === 'checkbox' ? <span className="flex items-center gap-2"><input type="checkbox" checked={Boolean(value)} onChange={event => onChange(event.target.checked)} /> 동의합니다</span>
        : <Input {...common} type={field.type} value={String(value ?? '')} onChange={event => onChange(event.target.value)} />}
    {error ? <span className="text-xs text-red-600">{error}</span> : null}
  </label>;
}

function FormBuilderSurface() {
  const dispatch = FormBuilderActions.useActionDispatch();
  const form = useStoreValue(FormBuilderStores.useStore('form'));
  const schemaJson = useMemo(() => JSON.stringify(form.fields, null, 2), [form.fields]);
  return <>
    <FormBuilderHandlers />
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {(['text', 'email', 'number', 'textarea', 'checkbox'] as FieldType[]).map(type => <Button key={type} variant="outline" size="sm" onClick={() => dispatch('addField', { type })}>+ {type}</Button>)}
        <Button variant="outline" size="sm" onClick={() => dispatch('reset')}>초기화</Button>
        <Badge variant="outline">{form.fields.length} fields</Badge>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardContent className="space-y-4 p-5"><h4 className="font-semibold text-slate-900">필드 설정</h4>
          {form.fields.map(field => <div key={field.id} className="space-y-2 rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between gap-2"><strong className="text-sm">{field.type}</strong><Button variant="outline" size="sm" onClick={() => dispatch('removeField', { id: field.id })}>삭제</Button></div>
            <Input value={field.label} onChange={event => dispatch('updateField', { id: field.id, patch: { label: event.target.value } })} placeholder="라벨" />
            {field.type !== 'checkbox' && <Input value={field.placeholder} onChange={event => dispatch('updateField', { id: field.id, patch: { placeholder: event.target.value } })} placeholder="placeholder" />}
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={field.required} onChange={event => dispatch('updateField', { id: field.id, patch: { required: event.target.checked } })} /> 필수 필드</label>
          </div>)}
        </CardContent></Card>
        <Card><CardContent className="space-y-4 p-5"><div className="flex items-center justify-between"><h4 className="font-semibold text-slate-900">실시간 미리보기</h4><Badge variant="outline">{form.submitted ? 'valid' : 'draft'}</Badge></div>
          <form className="space-y-4" onSubmit={event => { event.preventDefault(); dispatch('submit'); }}>{form.fields.map(field => <FieldPreview key={field.id} field={field} value={form.values[field.id]} error={form.errors[field.id]} onChange={value => dispatch('updateValue', { id: field.id, value })} />)}<Button type="submit">검증 및 제출</Button></form>
          {form.submitted && <p className="rounded-md bg-green-50 p-3 text-sm text-green-700">모든 필드가 유효합니다.</p>}
        </CardContent></Card>
      </div>
      <details><summary className="cursor-pointer text-sm font-medium text-slate-700">폼 schema 보기</summary><pre className="mt-2 overflow-auto rounded-md bg-slate-950 p-4 text-xs text-slate-100">{schemaJson}</pre></details>
    </div>
  </>;
}

export function FormBuilderInteractiveDemo() {
  return <FormBuilderActions.Provider><FormBuilderStores.Provider><FormBuilderSurface /></FormBuilderStores.Provider></FormBuilderActions.Provider>;
}
