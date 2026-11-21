[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/lit-ui/src](../README.md) / LitQuantityStepper

# Class: LitQuantityStepper

Defined in: [packages/lit-ui/src/components/quantity-stepper.ts:35](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/components/quantity-stepper.ts#L35)

Reference Form-Associated Custom Element providing a numerical stepper control.

Features:
- Native <form> submission and `new FormData()` integration via `ElementInternals`.
- HTML5 constraint validation (`rangeUnderflow`, `rangeOverflow`, `stepMismatch`, `badInput`).
- Form reset lifecycle restoration via `onFormReset()`.
- Disabled and readonly state propagation.
- Increment / Decrement methods with step precision and boundary clamping.
- Standard CustomEvent dispatching (`change`, `input`, `quantity-change`) with `{ bubbles: true, composed: true }`.
- Fully encapsulated Shadow DOM styling with `::part(button)` and `::part(input)` styling hooks.

## Extends

- [`FormAssociatedLitElement`](FormAssociatedLitElement.md)

## Constructors

### Constructor

> **new LitQuantityStepper**(): `LitQuantityStepper`

Defined in: [packages/lit-ui/src/form-associated-element.ts:130](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/form-associated-element.ts#L130)

#### Returns

`LitQuantityStepper`

#### Inherited from

[`FormAssociatedLitElement`](FormAssociatedLitElement.md).[`constructor`](FormAssociatedLitElement.md#constructor)

## lifecycle

### connectedCallback()

> **connectedCallback**(): `void`

Defined in: [packages/lit-ui/src/components/quantity-stepper.ts:208](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/components/quantity-stepper.ts#L208)

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

[`FormAssociatedLitElement`](FormAssociatedLitElement.md).[`connectedCallback`](FormAssociatedLitElement.md#connectedcallback)

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

#### Inherited from

[`FormAssociatedLitElement`](FormAssociatedLitElement.md).[`disconnectedCallback`](FormAssociatedLitElement.md#disconnectedcallback)

## Other

### value

> **value**: `number` = `1`

Defined in: [packages/lit-ui/src/components/quantity-stepper.ts:168](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/components/quantity-stepper.ts#L168)

The current numerical value of the stepper.

***

### min

> **min**: `number` = `1`

Defined in: [packages/lit-ui/src/components/quantity-stepper.ts:174](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/components/quantity-stepper.ts#L174)

Minimum permissible value (inclusive).

***

### max

> **max**: `number` = `99`

Defined in: [packages/lit-ui/src/components/quantity-stepper.ts:180](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/components/quantity-stepper.ts#L180)

Maximum permissible value (inclusive).

***

### step

> **step**: `number` = `1`

Defined in: [packages/lit-ui/src/components/quantity-stepper.ts:186](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/components/quantity-stepper.ts#L186)

Step increment/decrement delta. Must be greater than 0.

***

### readonly

> **readonly**: `boolean` = `false`

Defined in: [packages/lit-ui/src/components/quantity-stepper.ts:192](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/components/quantity-stepper.ts#L192)

Whether the control prevents user modification while remaining form-submittable.

***

### defaultValue?

> `optional` **defaultValue?**: `number`

Defined in: [packages/lit-ui/src/components/quantity-stepper.ts:198](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/components/quantity-stepper.ts#L198)

Default value used to restore state when the enclosing form is reset.

***

### increment()

> **increment**(): `void`

Defined in: [packages/lit-ui/src/components/quantity-stepper.ts:348](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/components/quantity-stepper.ts#L348)

Increments the current value by the configured step.
If at or above max, or if disabled/readonly, this operation is a no-op.

#### Returns

`void`

***

### decrement()

> **decrement**(): `void`

Defined in: [packages/lit-ui/src/components/quantity-stepper.ts:368](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/components/quantity-stepper.ts#L368)

Decrements the current value by the configured step.
If at or below min, or if disabled/readonly, this operation is a no-op.

#### Returns

`void`

***

### setValue()

> **setValue**(`val`, `options?`): `void`

Defined in: [packages/lit-ui/src/components/quantity-stepper.ts:390](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/components/quantity-stepper.ts#L390)

Sets the value imperatively with optional event dispatching.

#### Parameters

##### val

`number`

New numerical value.

##### options?

###### dispatchEvents?

`boolean`

If true, emits `input` and `change` events.

#### Returns

`void`

***

### formAssociated

> `readonly` `static` **formAssociated**: `true` = `true`

Defined in: [packages/lit-ui/src/form-associated-element.ts:100](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/form-associated-element.ts#L100)

Identifies this custom element as form-associated according to the HTML specification.
Enables the browser engine to attach ElementInternals and include this element in form submission.

#### Inherited from

[`FormAssociatedLitElement`](FormAssociatedLitElement.md).[`formAssociated`](FormAssociatedLitElement.md#formassociated)

***

### internals?

> `readonly` `optional` **internals?**: `ElementInternals`

Defined in: [packages/lit-ui/src/form-associated-element.ts:106](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/form-associated-element.ts#L106)

The ElementInternals controller instance for this custom element.
Undefined in environments where attachInternals is unsupported.

#### Inherited from

[`FormAssociatedLitElement`](FormAssociatedLitElement.md).[`internals`](FormAssociatedLitElement.md#internals)

***

### name

> **name**: `string` = `''`

Defined in: [packages/lit-ui/src/form-associated-element.ts:110](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/form-associated-element.ts#L110)

#### Inherited from

[`FormAssociatedLitElement`](FormAssociatedLitElement.md).[`name`](FormAssociatedLitElement.md#name)

***

### type

> **type**: `string` = `'custom-field'`

Defined in: [packages/lit-ui/src/form-associated-element.ts:113](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/form-associated-element.ts#L113)

#### Inherited from

[`FormAssociatedLitElement`](FormAssociatedLitElement.md).[`type`](FormAssociatedLitElement.md#type)

***

### disabled

> **disabled**: `boolean` = `false`

Defined in: [packages/lit-ui/src/form-associated-element.ts:116](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/form-associated-element.ts#L116)

#### Inherited from

[`FormAssociatedLitElement`](FormAssociatedLitElement.md).[`disabled`](FormAssociatedLitElement.md#disabled)

***

### required

> **required**: `boolean` = `false`

Defined in: [packages/lit-ui/src/form-associated-element.ts:119](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/form-associated-element.ts#L119)

#### Inherited from

[`FormAssociatedLitElement`](FormAssociatedLitElement.md).[`required`](FormAssociatedLitElement.md#required)

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

#### Inherited from

[`FormAssociatedLitElement`](FormAssociatedLitElement.md).[`form`](FormAssociatedLitElement.md#form)

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

#### Inherited from

[`FormAssociatedLitElement`](FormAssociatedLitElement.md).[`setFormValue`](FormAssociatedLitElement.md#setformvalue)

***

### getFormValue()

> **getFormValue**(): `string` \| `File` \| `FormData` \| `null`

Defined in: [packages/lit-ui/src/form-associated-element.ts:210](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/form-associated-element.ts#L210)

Returns the current form submission value.

#### Returns

`string` \| `File` \| `FormData` \| `null`

#### Inherited from

[`FormAssociatedLitElement`](FormAssociatedLitElement.md).[`getFormValue`](FormAssociatedLitElement.md#getformvalue)

***

### formValue

#### Get Signature

> **get** **formValue**(): `string` \| `File` \| `FormData` \| `null`

Defined in: [packages/lit-ui/src/form-associated-element.ts:217](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/form-associated-element.ts#L217)

Getter alias for getFormValue() for uniform property access.

##### Returns

`string` \| `File` \| `FormData` \| `null`

#### Inherited from

[`FormAssociatedLitElement`](FormAssociatedLitElement.md).[`formValue`](FormAssociatedLitElement.md#formvalue)

***

### formState

#### Get Signature

> **get** **formState**(): `unknown`

Defined in: [packages/lit-ui/src/form-associated-element.ts:224](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/form-associated-element.ts#L224)

Returns the current state restoration object.

##### Returns

`unknown`

#### Inherited from

[`FormAssociatedLitElement`](FormAssociatedLitElement.md).[`formState`](FormAssociatedLitElement.md#formstate)

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

#### Inherited from

[`FormAssociatedLitElement`](FormAssociatedLitElement.md).[`setValidity`](FormAssociatedLitElement.md#setvalidity)

***

### validity

#### Get Signature

> **get** **validity**(): `ValidityState`

Defined in: [packages/lit-ui/src/form-associated-element.ts:261](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/form-associated-element.ts#L261)

Returns the current ValidityState object representing constraint validation status.

##### Returns

`ValidityState`

#### Inherited from

[`FormAssociatedLitElement`](FormAssociatedLitElement.md).[`validity`](FormAssociatedLitElement.md#validity)

***

### validationMessage

#### Get Signature

> **get** **validationMessage**(): `string`

Defined in: [packages/lit-ui/src/form-associated-element.ts:274](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/form-associated-element.ts#L274)

Returns the current validation error message, or an empty string if valid.

##### Returns

`string`

#### Inherited from

[`FormAssociatedLitElement`](FormAssociatedLitElement.md).[`validationMessage`](FormAssociatedLitElement.md#validationmessage)

***

### willValidate

#### Get Signature

> **get** **willValidate**(): `boolean`

Defined in: [packages/lit-ui/src/form-associated-element.ts:288](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/form-associated-element.ts#L288)

Returns true if the element participates in constraint validation and is not disabled.

##### Returns

`boolean`

#### Inherited from

[`FormAssociatedLitElement`](FormAssociatedLitElement.md).[`willValidate`](FormAssociatedLitElement.md#willvalidate)

***

### checkValidity()

> **checkValidity**(): `boolean`

Defined in: [packages/lit-ui/src/form-associated-element.ts:304](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/form-associated-element.ts#L304)

Checks whether the element satisfies all validation constraints.
If invalid, fires a cancelable 'invalid' event on the element and returns false.
If valid (or validation is disabled), returns true.

#### Returns

`boolean`

#### Inherited from

[`FormAssociatedLitElement`](FormAssociatedLitElement.md).[`checkValidity`](FormAssociatedLitElement.md#checkvalidity)

***

### reportValidity()

> **reportValidity**(): `boolean`

Defined in: [packages/lit-ui/src/form-associated-element.ts:327](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/form-associated-element.ts#L327)

Checks validity, reports errors to the user (e.g. browser popup), and returns validity status.

#### Returns

`boolean`

#### Inherited from

[`FormAssociatedLitElement`](FormAssociatedLitElement.md).[`reportValidity`](FormAssociatedLitElement.md#reportvalidity)

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

#### Inherited from

[`FormAssociatedLitElement`](FormAssociatedLitElement.md).[`setCustomValidity`](FormAssociatedLitElement.md#setcustomvalidity)

***

### formResetCallback()

> **formResetCallback**(): `void`

Defined in: [packages/lit-ui/src/form-associated-element.ts:358](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/form-associated-element.ts#L358)

Native FACE callback invoked by the browser engine when the associated form is reset.
Dispatches to the overridable onFormReset() hook.

#### Returns

`void`

#### Inherited from

[`FormAssociatedLitElement`](FormAssociatedLitElement.md).[`formResetCallback`](FormAssociatedLitElement.md#formresetcallback)

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

#### Inherited from

[`FormAssociatedLitElement`](FormAssociatedLitElement.md).[`formDisabledCallback`](FormAssociatedLitElement.md#formdisabledcallback)

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

#### Inherited from

[`FormAssociatedLitElement`](FormAssociatedLitElement.md).[`formStateRestoreCallback`](FormAssociatedLitElement.md#formstaterestorecallback)

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

#### Inherited from

[`FormAssociatedLitElement`](FormAssociatedLitElement.md).[`formAssociatedCallback`](FormAssociatedLitElement.md#formassociatedcallback)

## rendering

### render()

> **render**(): `TemplateResult`&lt;`1`&gt;

Defined in: [packages/lit-ui/src/components/quantity-stepper.ts:435](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/components/quantity-stepper.ts#L435)

Invoked on each update to perform rendering tasks. This method may return
any value renderable by lit-html's `ChildPart` - typically a
`TemplateResult`. Setting properties inside this method will *not* trigger
the element to update.

#### Returns

`TemplateResult`&lt;`1`&gt;

#### Overrides

`FormAssociatedLitElement.render`

## styles

### styles

> `static` **styles**: `CSSResult`

Defined in: [packages/lit-ui/src/components/quantity-stepper.ts:36](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/components/quantity-stepper.ts#L36)

Array of styles to apply to the element. The styles should be defined
using the css tag function, via constructible stylesheets, or
imported from native CSS module scripts.

Note on Content Security Policy:

Element styles are implemented with `<style>` tags when the browser doesn't
support adopted StyleSheets. To use such `<style>` tags with the style-src
CSP directive, the style-src value must either include 'unsafe-inline' or
`nonce-<base64-value>` with `<base64-value>` replaced be a server-generated
nonce.

To provide a nonce to use on generated `<style>` elements, set
`window.litNonce` to a server-generated nonce in your page's HTML, before
loading application code:

```html
<script>
  // Generated and unique per request:
  window.litNonce = 'a1b2c3d4';
</script>
```

#### Nocollapse

#### Overrides

`FormAssociatedLitElement.styles`

## updates

### updated()

> **updated**(`changedProperties`): `void`

Defined in: [packages/lit-ui/src/components/quantity-stepper.ts:214](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/components/quantity-stepper.ts#L214)

Invoked whenever the element is updated. Implement to perform
post-updating tasks via DOM APIs, for example, focusing an element.

Setting properties inside this method will trigger the element to update
again after this update cycle completes.

#### Parameters

##### changedProperties

`PropertyValueMap`&lt;`LitQuantityStepper`&gt;

#### Returns

`void`

#### Overrides

`FormAssociatedLitElement.updated`
