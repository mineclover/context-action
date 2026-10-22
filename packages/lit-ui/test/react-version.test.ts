import { expect, it } from 'vitest';
import * as React from 'react';

it('uses the React version requested by the compatibility matrix', () => {
  const expected = process.env.CONTEXT_ACTION_LIT_REACT_COMPAT_VERSION;
  if (!expected) return;

  const expectedMajor = expected.split('.')[0];
  const actualMajor = React.version.split('.')[0];
  expect(actualMajor).toBe(expectedMajor);
  expect(React.version).toBe(expected);
});
