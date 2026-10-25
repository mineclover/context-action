import {
  ActionRegisterDestroyedError,
  ActionResultProcessingError,
  ActionTimeoutError,
  ActionValidationError,
  isActionRegisterDestroyedError,
  isActionResultProcessingError,
  isActionTimeoutError,
  isActionValidationError,
} from '../../src';

describe('Public error type guard contracts', () => {
  const cases = [
    { error: new ActionRegisterDestroyedError('public', 'destroyed'), guard: isActionRegisterDestroyedError },
    { error: new ActionResultProcessingError('invalid result'), guard: isActionResultProcessingError },
    { error: new ActionTimeoutError('save', 10), guard: isActionTimeoutError },
    { error: new ActionValidationError('save', { message: 'invalid', issues: [] }), guard: isActionValidationError },
  ];

  it.each(cases)('$error.name recognizes its own error, not another error or a forged name', ({ error, guard }) => {
    expect(guard(error)).toBe(true);
    for (const other of cases) {
      if (other.error !== error) expect(guard(other.error)).toBe(false);
    }
    for (const invalid of [null, undefined, 'error', new Error(error.message), { name: error.name }]) {
      expect(guard(invalid)).toBe(false);
    }
  });
});
