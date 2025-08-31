import { promises as fs } from 'fs';
import path from 'path';
import { EnhancedLLMSConfig } from '../../types/config.js';

export interface CodeModeOptions {
  targets?: string[];       // 처리할 타겟 (패키지명 또는 경로)
  packages?: string[];      // 레거시 지원용 (deprecated)
  paths?: string[];         // 직접 지정할 경로들
  quiet?: boolean;          // 조용한 모드
  dryRun?: boolean;         // 미리보기 모드
  force?: boolean;          // 강제 업데이트
  excludeTests?: boolean;   // 테스트 파일 제외 (기본: true)
  stripComments?: boolean;  // 주석 제거 (기본: true)
  singleFile?: boolean;     // 단일 파일로 합치기 (기본: true)
  extensions?: string[];    // 포함할 확장자 (기본: ['.ts', '.tsx'])
}

interface CodeFile {
  path: string;
  content: string;
  package: string;
  isType: boolean;
  lines: number;
}

export class CodeModeCommand {
  private readonly packageBasePath = 'packages';
  private readonly outputBasePath = 'llmsData/code';
  
  constructor(private config: EnhancedLLMSConfig) {}

  async execute(options: CodeModeOptions): Promise<void> {
    try {
      if (!options.quiet) {
        console.log('🔧 Generating LLMS code documentation...');
      }

      // Determine targets to process
      const targets = this.determineTargets(options);
      const excludeTests = options.excludeTests !== false;
      const stripComments = options.stripComments !== false;
      const singleFile = options.singleFile !== false;
      const extensions = options.extensions || ['.ts', '.tsx'];

      for (const target of targets) {
        // Check if target is a package or a direct path
        if (await this.isPackage(target)) {
          await this.processPackage(target, {
            excludeTests,
            stripComments,
            singleFile,
            extensions,
            dryRun: options.dryRun,
            quiet: options.quiet,
            force: options.force
          });
        } else {
          await this.processPath(target, {
            excludeTests,
            stripComments,
            singleFile,
            extensions,
            dryRun: options.dryRun,
            quiet: options.quiet,
            force: options.force
          });
        }
      }

      if (!options.quiet) {
        console.log('✅ Code documentation generation completed');
      }
    } catch (error) {
      console.error('❌ Failed to generate code documentation:', error);
      throw error;
    }
  }

  private determineTargets(options: CodeModeOptions): string[] {
    // Priority: targets > paths > packages > default
    if (options.targets && options.targets.length > 0) {
      return options.targets;
    }
    if (options.paths && options.paths.length > 0) {
      return options.paths;
    }
    if (options.packages && options.packages.length > 0) {
      return options.packages;
    }
    // Default to core and react packages
    return ['core', 'react'];
  }

  private async isPackage(target: string): Promise<boolean> {
    // Check if it's a known package (exists in packages directory)
    const packagePath = path.join(this.packageBasePath, target);
    if (await this.exists(packagePath)) {
      return true;
    }
    // If it contains path separators or starts with ./ or ../, it's a path
    if (target.includes('/') || target.includes('\\') || target.startsWith('.')) {
      return false;
    }
    // Otherwise assume it's a package name
    return true;
  }

  private async processPath(
    targetPath: string,
    options: {
      excludeTests: boolean;
      stripComments: boolean;
      singleFile: boolean;
      extensions: string[];
      dryRun?: boolean;
      quiet?: boolean;
      force?: boolean;
    }
  ): Promise<void> {
    // Resolve the path
    const resolvedPath = path.resolve(targetPath);
    
    if (!await this.exists(resolvedPath)) {
      console.warn(`⚠️ Path not found: ${resolvedPath}`);
      return;
    }

    if (!options.quiet) {
      console.log(`📁 Processing path: ${targetPath}`);
    }

    // Check if it's a directory or file
    const stats = await fs.stat(resolvedPath);
    let files: string[] = [];
    
    if (stats.isDirectory()) {
      // If directory, collect all TypeScript files
      files = await this.collectFilesFromPath(resolvedPath, options.excludeTests, options.extensions);
    } else if (stats.isFile()) {
      // If single file, check if it matches extensions
      const ext = path.extname(resolvedPath);
      if (options.extensions.includes(ext)) {
        files = [resolvedPath];
      } else {
        console.warn(`⚠️ File ${resolvedPath} doesn't match extensions: ${options.extensions.join(', ')}`);
        return;
      }
    }

    // Process collected files
    await this.processFiles(
      path.basename(targetPath).replace(/[^a-zA-Z0-9-_]/g, '_'), // Safe name for output
      files,
      options
    );
  }

  private async processPackage(
    packageName: string,
    options: {
      excludeTests: boolean;
      stripComments: boolean;
      singleFile: boolean;
      extensions: string[];
      dryRun?: boolean;
      quiet?: boolean;
      force?: boolean;
    }
  ): Promise<void> {
    const packagePath = path.join(this.packageBasePath, packageName, 'src');
    
    if (!await this.exists(packagePath)) {
      console.warn(`⚠️ Package path not found: ${packagePath}`);
      return;
    }

    if (!options.quiet) {
      console.log(`📦 Processing package: ${packageName}`);
    }

    // Collect all TypeScript files
    const files = await this.collectFilesFromPath(packagePath, options.excludeTests, options.extensions);
    
    // Process collected files
    await this.processFiles(packageName, files, options);
  }

  private async processFiles(
    targetName: string,
    files: string[],
    options: {
      excludeTests: boolean;
      stripComments: boolean;
      singleFile: boolean;
      extensions: string[];
      dryRun?: boolean;
      quiet?: boolean;
      force?: boolean;
    }
  ): Promise<void> {
    // Separate types and code files
    const typeFiles: CodeFile[] = [];
    const codeFiles: CodeFile[] = [];
    
    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      const processedContent = options.stripComments 
        ? this.stripComments(content)
        : content;
      
      const isType = file.includes('types.ts') || file.includes('.types.');
      const codeFile: CodeFile = {
        path: file,
        content: processedContent,
        package: targetName,
        isType,
        lines: processedContent.split('\n').length
      };
      
      if (isType) {
        typeFiles.push(codeFile);
      } else {
        codeFiles.push(codeFile);
      }
    }

    // Sort files: types first, then by path
    typeFiles.sort((a, b) => a.path.localeCompare(b.path));
    codeFiles.sort((a, b) => a.path.localeCompare(b.path));

    if (options.singleFile) {
      await this.generateSingleFile(
        targetName,
        [...typeFiles, ...codeFiles],
        options
      );
    } else {
      await this.generateMultipleFiles(
        targetName,
        [...typeFiles, ...codeFiles],
        options
      );
    }
  }

  private async collectFilesFromPath(
    dir: string,
    excludeTests: boolean,
    extensions: string[]
  ): Promise<string[]> {
    const files: string[] = [];
    
    const collectRecursive = async (currentDir: string) => {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        
        if (entry.isDirectory()) {
          // Skip test directories if excludeTests is true
          if (excludeTests && (entry.name === '__tests__' || entry.name === '__test__')) {
            continue;
          }
          await collectRecursive(fullPath);
        } else if (entry.isFile()) {
          // Check if file has matching extension
          const ext = path.extname(entry.name);
          if (extensions.includes(ext)) {
            // Skip test files if excludeTests is true
            if (excludeTests && (
              entry.name.includes('.test.') ||
              entry.name.includes('.spec.') ||
              entry.name.includes('.mock.')
            )) {
              continue;
            }
            files.push(fullPath);
          }
        }
      }
    };
    
    await collectRecursive(dir);
    return files;
  }

  private stripComments(content: string): string {
    // Remove single-line comments
    let stripped = content.replace(/\/\/.*$/gm, '');
    
    // Remove multi-line comments
    stripped = stripped.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // Remove JSDoc comments
    stripped = stripped.replace(/\/\*\*[\s\S]*?\*\//g, '');
    
    // Remove empty lines created by comment removal
    stripped = stripped.split('\n')
      .filter(line => line.trim() !== '')
      .join('\n');
    
    return stripped;
  }

  private async generateSingleFile(
    packageName: string,
    files: CodeFile[],
    options: {
      dryRun?: boolean;
      quiet?: boolean;
      force?: boolean;
    }
  ): Promise<void> {
    const outputDir = path.join(this.outputBasePath);
    const outputFile = path.join(outputDir, `${packageName}-complete.md`);
    
    // Calculate total lines
    const totalLines = files.reduce((sum, file) => sum + file.lines, 0);
    
    // Generate combined content
    const sections: string[] = [];
    
    // Add header
    sections.push(`# Context-Action ${packageName.charAt(0).toUpperCase() + packageName.slice(1)} Package - Complete Code\n`);
    sections.push(`Total Files: ${files.length}`);
    sections.push(`Total Lines: ${totalLines}\n`);
    
    // Add types section first
    const typeFiles = files.filter(f => f.isType);
    if (typeFiles.length > 0) {
      sections.push('## Type Definitions\n');
      for (const file of typeFiles) {
        const relativePath = path.relative(path.join(this.packageBasePath, packageName, 'src'), file.path);
        sections.push(`### ${relativePath}\n`);
        sections.push('```typescript');
        sections.push(file.content);
        sections.push('```\n');
      }
    }
    
    // Add code section
    const codeFiles = files.filter(f => !f.isType);
    if (codeFiles.length > 0) {
      sections.push('## Implementation Code\n');
      for (const file of codeFiles) {
        const relativePath = path.relative(path.join(this.packageBasePath, packageName, 'src'), file.path);
        sections.push(`### ${relativePath}\n`);
        sections.push('```typescript');
        sections.push(file.content);
        sections.push('```\n');
      }
    }
    
    const finalContent = sections.join('\n');
    
    if (options.dryRun) {
      console.log(`[DRY RUN] Would create: ${outputFile}`);
      console.log(`[DRY RUN] Content size: ${finalContent.length} characters`);
      return;
    }
    
    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });
    
    // Check if file exists and force flag
    if (await this.exists(outputFile) && !options.force) {
      console.log(`⚠️ File already exists: ${outputFile} (use --force to overwrite)`);
      return;
    }
    
    // Write the file
    await fs.writeFile(outputFile, finalContent, 'utf-8');
    
    if (!options.quiet) {
      console.log(`✅ Generated: ${outputFile} (${totalLines} lines, ${finalContent.length} chars)`);
    }
    
    // Also generate metadata JSON
    await this.generateMetadata(packageName, files, options);
  }

  private async generateMultipleFiles(
    _packageName: string,
    _files: CodeFile[],
    _options: {
      dryRun?: boolean;
      quiet?: boolean;
      force?: boolean;
    }
  ): Promise<void> {
    // Implementation for multiple file generation if needed
    console.log('Multiple file generation not implemented yet');
  }

  private async generateMetadata(
    packageName: string,
    files: CodeFile[],
    options: {
      dryRun?: boolean;
      quiet?: boolean;
    }
  ): Promise<void> {
    const outputDir = path.join(this.outputBasePath);
    const metadataFile = path.join(outputDir, `${packageName}-metadata.json`);
    
    const metadata = {
      package: packageName,
      generatedAt: new Date().toISOString(),
      statistics: {
        totalFiles: files.length,
        typeFiles: files.filter(f => f.isType).length,
        codeFiles: files.filter(f => !f.isType).length,
        totalLines: files.reduce((sum, f) => sum + f.lines, 0),
        typeLines: files.filter(f => f.isType).reduce((sum, f) => sum + f.lines, 0),
        codeLines: files.filter(f => !f.isType).reduce((sum, f) => sum + f.lines, 0)
      },
      files: files.map(f => ({
        path: path.relative(path.join(this.packageBasePath, packageName, 'src'), f.path),
        isType: f.isType,
        lines: f.lines
      }))
    };
    
    if (options.dryRun) {
      console.log(`[DRY RUN] Would create metadata: ${metadataFile}`);
      return;
    }
    
    await fs.writeFile(metadataFile, JSON.stringify(metadata, null, 2), 'utf-8');
    
    if (!options.quiet) {
      console.log(`📊 Generated metadata: ${metadataFile}`);
    }
  }

  private async exists(path: string): Promise<boolean> {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }
}