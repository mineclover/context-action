import { stripVTControlCharacters } from 'node:util';

export function isWellFormedText(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const unit = value.charCodeAt(index);
    if (unit >= 0xd800 && unit <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) return false;
      index += 1;
    } else if (unit >= 0xdc00 && unit <= 0xdfff) {
      return false;
    }
  }
  return true;
}

export function toWellFormedText(value: string): string {
  let result = '';
  for (let index = 0; index < value.length; index += 1) {
    const unit = value.charCodeAt(index);
    if (unit >= 0xd800 && unit <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        result += value[index] ?? '';
        result += value[index + 1] ?? '';
        index += 1;
      } else {
        result += '\ufffd';
      }
    } else if (unit >= 0xdc00 && unit <= 0xdfff) {
      result += '\ufffd';
    } else {
      result += value[index] ?? '';
    }
  }
  return result;
}

export function truncateWellFormedText(value: string, maxCodeUnits: number): string {
  if (value.length <= maxCodeUnits) return value;
  let end = maxCodeUnits;
  const last = value.charCodeAt(end - 1);
  const next = value.charCodeAt(end);
  if (last >= 0xd800 && last <= 0xdbff && next >= 0xdc00 && next <= 0xdfff) {
    end -= 1;
  }
  return `${value.slice(0, end)}…`;
}

export function compactText(value: string): string {
  return stripVTControlCharacters(toWellFormedText(value))
    .replace(/\s+/gu, ' ')
    .replace(/[\p{Cc}\p{Cf}]/gu, '')
    .trim();
}

export function hasVisibleText(value: string): boolean {
  return isWellFormedText(value) && compactText(value).length > 0;
}
