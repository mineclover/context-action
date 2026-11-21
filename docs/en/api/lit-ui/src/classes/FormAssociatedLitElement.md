[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/lit-ui/src](../README.md) / FormAssociatedLitElement

# Class: FormAssociatedLitElement

Defined in: [packages/lit-ui/src/form-associated-element.ts:95](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/form-associated-element.ts#L95)

Abstract Form-Associated Custom Element (FACE) base class extending LitElement.

Provides:
- Native form participation via `ElementInternals` and `static formAssociated = true`
- Defensive fallbacks for server-side rendering (SSR) and headless test environments (JSDOM)
- Complete Form value management (`setFormValue`, `getFormValue`, `formValue`)
- Constraint validation APIs (`setValidity`, `validity`, `validationMessage`, `checkValidity`, `reportValidity`, `setCustomValidity`)
- Lifecycle callbacks (`formResetCallback`, `formDisabledCallback`, `formStateRestoreCallback`, `formAssociatedCallback`)
- Standard overridable hooks (`onFormReset`, `onFormDisabled`, `onFormStateRestore`, `onFormAssociated`)
- Automatic form reset event synchronization and leak-free unbinding on disconnect

## Extends

- `LitElement`

## Extended by

- [`LitQuantityStepper`](LitQuantityStepper.md)

## Constructors

### Constructor

> **new FormAssociatedLitElement**(): `FormAssociatedLitElement`

Defined in: [packages/lit-ui/src/form-associated-element.ts:130](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/form-associated-element.ts#L130)

#### Returns

`FormAssociatedLitElement`

#### Overrides

`LitElement.constructor`

## lifecycle

### connectedCallback()

> **connectedCallback**(): `void`

Defined in: [packages/lit-ui/src/form-associated-element.ts:448](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/form-associated-element.ts#L448)

Invoked when the component is added to the document's DOM.

In `connectedCallback()` you should setup tasks that should only occur when
the element is connected to the document. The most common of these is
adding event listeners to nodes external to the element, like a keydown
event handler added to the window.

```ts
connectedCallback() {
  super.connectedCallback();
  addEventListener('keydown', this._handleKeydown);
}
```

Typically, anything done in `connectedCallback()` should be undone when the
element is disconnected, in `disconnectedCallback()`.

#### Returns

`void`

#### Overrides

`LitElement.connectedCallback`

***

### disconnectedCallback()

> **disconnectedCallback**(): `void`

Defined in: [packages/lit-ui/src/form-associated-element.ts:453](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/form-associated-element.ts#L453)

Invoked when the component is removed from the document's DOM.

This callback is the main signal to the element that it may no longer be
used. `disconnectedCallback()` should ensure that nothing is holding a
reference to the element (such as event listeners added to nodes external
to the element), so that it is free to be garbage collected.

```ts
disconnectedCallback() {
  super.disconnectedCallback();
  window.removeEventListener('keydown', this._handleKeydown);
}
```

An element may be re-connected after being disconnected.

#### Returns

`void`

#### Overrides

`LitElement.disconnectedCallback`

## Other

### formAssociated

> `readonly` `static` **formAssociated**: `true` = `true`

Defined in: [packages/lit-ui/src/form-associated-element.ts:100](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/form-associated-element.ts#L100)

Identifies this custom element as form-associated according to the HTML specification.
Enables the browser engine to attach ElementInternals and include this element in form submission.

***

### internals?

> `readonly` `optional` **internals?**: `ElementInternals`

Defined in: [packages/lit-ui/src/form-associated-element.ts:106](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/form-associated-element.ts#L106)

The ElementInternals controller instance for this custom element.
Undefined in environments where attachInternals is unsupported.

***

### name

> **name**: `string` = `''`

Defined in: [packages/lit-ui/src/form-associated-element.ts:110](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/form-associated-element.ts#L110)

***

### type

> **type**: `string` = `'custom-field'`

Defined in: [packages/lit-ui/src/form-associated-element.ts:113](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/form-associated-element.ts#L113)

***

### disabled

> **disabled**: `boolean` = `false`

Defined in: [packages/lit-ui/src/form-associated-element.ts:116](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/form-associated-element.ts#L116)

***

### required

> **required**: `boolean` = `false`

Defined in: [packages/lit-ui/src/form-associated-element.ts:119](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/form-associated-element.ts#L119)

***

### form

#### Get Signature

> **get** **form**(): `HTMLFormElement` \| `null`

Defined in: [packages/lit-ui/src/form-associated-element.ts:166](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/form-associated-element.ts#L166)

The associated HTMLFormElement, if any.
Resolves first via ElementInternals.form, then checks the 'form' attribute by ID,
and finally falls back to the closest ancestor <form>.

##### Returns

`HTMLFormElement` \| `null`

***

### setFormValue()

> **setFormValue**(`value`, `state?`): `void`

Defined in: [packages/lit-ui/src/form-associated-element.ts:190](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/form-associated-element.ts#L190)

Sets the element's form submission value and optional state restoration value.

#### Parameters

##### value

`string` \| `File` \| `FormData` \| `null`

The value to submit with the form: string, File, FormData, or null (clears submission).

##### state?

`string` \| `File` \| `FormData` \| `null`

Optional state object used for session restoration / autocomplete.

#### Returns

`void`

***

### getFormValue()

> **getFormValue**(): `string` \| `File` \| `FormData` \| `null`

Defined in: [packages/lit-ui/src/form-associated-element.ts:210](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/form-associated-element.ts#L210)

Returns the current form submission value.

#### Returns

`string` \| `File` \| `FormData` \| `null`

***

### formValue

#### Get Signature

> **get** **formValue**(): `string` \| `File` \| `FormData` \| `null`

Defined in: [packages/lit-ui/src/form-associated-element.ts:217](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/form-associated-element.ts#L217)

Getter alias for getFormValue() for uniform property access.

##### Returns

`string` \| `File` \| `FormData` \| `null`

***

### formState

#### Get Signature

> **get** **formState**(): `unknown`

Defined in: [packages/lit-ui/src/form-associated-element.ts:224](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/form-associated-element.ts#L224)

Returns the current state restoration object.

##### Returns

`unknown`

***

### setValidity()

> **setValidity**(`flags?`, `message?`, `anchor?`): `void`

Defined in: [packages/lit-ui/src/form-associated-element.ts:239](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/form-associated-element.ts#L239)

Sets the validity flags, validation error message, and optional anchor element.

#### Parameters

##### flags?

[`ValidityStateFlags`](../interfaces/ValidityStateFlags.md) = `{}`

A map of ValidityStateFlags indicating constraint violations.

##### message?

`string`

A human-readable validation error message (required if any flag is true).

##### anchor?

`HTMLElement`

An optional HTMLElement inside the element's ShadowRoot used to anchor browser tooltips.

#### Returns

`void`

***

### validity

#### Get Signature

> **get** **validity**(): `ValidityState`

Defined in: [packages/lit-ui/src/form-associated-element.ts:261](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/form-associated-element.ts#L261)

Returns the current ValidityState object representing constraint validation status.

##### Returns

`ValidityState`

***

### validationMessage

#### Get Signature

> **get** **validationMessage**(): `string`

Defined in: [packages/lit-ui/src/form-associated-element.ts:274](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/form-associated-element.ts#L274)

Returns the current validation error message, or an empty string if valid.

##### Returns

`string`

***

### willValidate

#### Get Signature

> **get** **willValidate**(): `boolean`

Defined in: [packages/lit-ui/src/form-associated-element.ts:288](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/form-associated-element.ts#L288)

Returns true if the element participates in constraint validation and is not disabled.

##### Returns

`boolean`

***

### checkValidity()

> **checkValidity**(): `boolean`

Defined in: [packages/lit-ui/src/form-associated-element.ts:304](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/form-associated-element.ts#L304)

Checks whether the element satisfies all validation constraints.
If invalid, fires a cancelable 'invalid' event on the element and returns false.
If valid (or validation is disabled), returns true.

#### Returns

`boolean`

***

### reportValidity()

> **reportValidity**(): `boolean`

Defined in: [packages/lit-ui/src/form-associated-element.ts:327](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/form-associated-element.ts#L327)

Checks validity, reports errors to the user (e.g. browser popup), and returns validity status.

#### Returns

`boolean`

***

### setCustomValidity()

> **setCustomValidity**(`message`): `void`

Defined in: [packages/lit-ui/src/form-associated-element.ts:342](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/form-associated-element.ts#L342)

Sets a custom validation error message. If message is non-empty, sets customError to true.
If message is empty, clears custom validity errors.

#### Parameters

##### message

`string`

#### Returns

`void`

***

### formResetCallback()

> **formResetCallback**(): `void`

Defined in: [packages/lit-ui/src/form-associated-element.ts:358](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/form-associated-element.ts#L358)

Native FACE callback invoked by the browser engine when the associated form is reset.
Dispatches to the overridable onFormReset() hook.

#### Returns

`void`

***

### formDisabledCallback()

> **formDisabledCallback**(`disabled`): `void`

Defined in: [packages/lit-ui/src/form-associated-element.ts:379](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/form-associated-element.ts#L379)

Native FACE callback invoked when the element or parent fieldset is disabled/enabled.

#### Parameters

##### disabled

`boolean`

#### Returns

`void`

***

### formStateRestoreCallback()

> **formStateRestoreCallback**(`state`, `mode`): `void`

Defined in: [packages/lit-ui/src/form-associated-element.ts:393](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/form-associated-element.ts#L393)

Native FACE callback invoked when the browser restores form state (history navigation / autofill).

#### Parameters

##### state

`unknown`

##### mode

`"restore"` \| `"autocomplete"`

#### Returns

`void`

***

### formAssociatedCallback()

> **formAssociatedCallback**(`form`): `void`

Defined in: [packages/lit-ui/src/form-associated-element.ts:406](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/form-associated-element.ts#L406)

Native FACE callback invoked when the element is associated or disassociated with a form.

#### Parameters

##### form

`HTMLFormElement` \| `null`

#### Returns

`void`
