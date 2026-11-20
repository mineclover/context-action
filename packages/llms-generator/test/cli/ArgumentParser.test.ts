import { ArgumentParser } from '../../src/cli/utils/ArgumentParser.js';

describe('ArgumentParser', () => {
  const parser = new ArgumentParser();

  describe('extractFlag', () => {
    it('supports short, long, and equals syntax', () => {
      expect(parser.extractFlag(['-l', 'ko'], '-l', '--language')).toBe('ko');
      expect(parser.extractFlag(['--language', 'en'], '-l', '--language')).toBe('en');
      expect(parser.extractFlag(['--language=ko'], '-l', '--language')).toBe('ko');
      expect(parser.extractFlag(['--language="ko"'], '-l', '--language')).toBe('ko');
    });

    it('returns undefined when flag is missing or followed by another flag', () => {
      expect(parser.extractFlag(['--quiet'], '-l', '--language')).toBeUndefined();
      expect(parser.extractFlag(['--language', '--quiet'], '-l', '--language')).toBeUndefined();
      expect(parser.extractFlag(['--language'], '-l', '--language')).toBeUndefined();
    });
  });

  describe('extractListFlag', () => {
    it('parses comma-separated values and --flag=value syntax', () => {
      expect(
        parser.extractListFlag(['--changed-files', 'docs/en/a.md,docs/ko/a.md'], '--changed-files'),
      ).toEqual(['docs/en/a.md', 'docs/ko/a.md']);

      expect(
        parser.extractListFlag(
          ['--changed-files=docs/en/a.md,docs/ko/a.md', '--quiet'],
          '--changed-files',
        ),
      ).toEqual(['docs/en/a.md', 'docs/ko/a.md']);
    });

    it('parses space-separated tokens until the next flag', () => {
      expect(
        parser.extractListFlag(
          ['--changed-files', 'docs/en/a.md', 'docs/ko/a.md', '--quiet'],
          '--changed-files',
        ),
      ).toEqual(['docs/en/a.md', 'docs/ko/a.md']);
    });

    it('parses quoted whitespace values in a single argument or after =', () => {
      expect(
        parser.extractListFlag(['--changed-files', '"docs/en/a.md docs/ko/a.md"'], '--changed-files'),
      ).toEqual(['docs/en/a.md', 'docs/ko/a.md']);

      expect(
        parser.extractListFlag(['--changed-files="docs/en/a.md docs/ko/a.md"'], '--changed-files'),
      ).toEqual(['docs/en/a.md', 'docs/ko/a.md']);
    });

    it('merges repeated flags and deduplicates while preserving order', () => {
      expect(
        parser.extractListFlag(
          [
            '--changed-files',
            'docs/en/a.md',
            '--quiet',
            '--changed-files=docs/ko/a.md,docs/en/a.md',
            '--changed-files',
            'docs/en/b.md',
          ],
          '--changed-files',
        ),
      ).toEqual(['docs/en/a.md', 'docs/ko/a.md', 'docs/en/b.md']);
    });

    it('returns an empty array when the flag is absent or empty', () => {
      expect(parser.extractListFlag(['--quiet'], '--changed-files')).toEqual([]);
      expect(parser.extractListFlag(['--changed-files', '--quiet'], '--changed-files')).toEqual([]);
      expect(parser.extractListFlag(['--changed-files='], '--changed-files')).toEqual([]);
    });
  });
});
