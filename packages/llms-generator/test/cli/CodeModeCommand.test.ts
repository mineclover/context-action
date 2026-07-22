import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { CodeModeCommand } from '../../src/cli/commands/CodeModeCommand.js';

describe('CodeModeCommand', () => {
  it('generates type-first code documentation while excluding test files', async () => {
    const previousCwd = process.cwd();
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'llms-code-mode-'));

    try {
      await fs.mkdir(path.join(root, 'packages', 'sample', 'src', '__tests__'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(root, 'packages', 'sample', 'src', 'types.ts'),
        '// type comment\nexport interface SampleConfig { enabled: boolean; }\n',
      );
      await fs.writeFile(
        path.join(root, 'packages', 'sample', 'src', 'index.ts'),
        '/* implementation comment */\nexport const run = () => true;\n',
      );
      await fs.writeFile(
        path.join(root, 'packages', 'sample', 'src', 'index.test.ts'),
        'export const shouldNotBeIncluded = true;\n',
      );
      await fs.writeFile(
        path.join(root, 'packages', 'sample', 'src', '__tests__', 'sample.ts'),
        'export const shouldAlsoBeExcluded = true;\n',
      );
      await fs.writeFile(
        path.join(root, 'packages', 'sample', 'src', 'notes.js'),
        'export const ignoredExtension = true;\n',
      );

      process.chdir(root);
      await new CodeModeCommand().execute({ targets: ['sample'], quiet: true });

      const outputPath = path.join(root, 'llmsData', 'code', 'sample-complete.md');
      const metadataPath = path.join(root, 'llmsData', 'code', 'sample-metadata.json');
      const output = await fs.readFile(outputPath, 'utf8');
      const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8')) as {
        statistics: { totalFiles: number; typeFiles: number; codeFiles: number };
        files: Array<{ path: string }>;
      };

      expect(metadata.statistics).toMatchObject({
        totalFiles: 2,
        typeFiles: 1,
        codeFiles: 1,
      });
      expect(metadata.files.map(({ path: filePath }) => filePath)).toEqual([
        'types.ts',
        'index.ts',
      ]);
      expect(output.indexOf('## Type Definitions')).toBeLessThan(
        output.indexOf('## Implementation Code'),
      );
      expect(output).toContain('SampleConfig');
      expect(output).toContain('export const run');
      expect(output).not.toContain('implementation comment');
      expect(output).not.toContain('shouldNotBeIncluded');
      expect(output).not.toContain('shouldAlsoBeExcluded');
    } finally {
      process.chdir(previousCwd);
      await fs.rm(root, { recursive: true, force: true });
    }
  });

  it('keeps dry-run generation side-effect free and reports the planned output', async () => {
    const previousCwd = process.cwd();
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'llms-code-mode-dry-'));
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    try {
      const sourceRoot = path.join(root, 'source');
      await fs.mkdir(sourceRoot, { recursive: true });
      await fs.writeFile(
        path.join(sourceRoot, 'index.ts'),
        'export const preview = true;\n',
      );

      process.chdir(root);
      await new CodeModeCommand().execute({
        paths: [sourceRoot],
        dryRun: true,
        quiet: true,
      });

      expect(logSpy.mock.calls.flat().join('\n')).toContain(
        '[DRY RUN] Would create:',
      );
      await expect(fs.access(path.join(root, 'llmsData', 'code'))).rejects.toThrow();
    } finally {
      logSpy.mockRestore();
      process.chdir(previousCwd);
      await fs.rm(root, { recursive: true, force: true });
    }
  });
});
