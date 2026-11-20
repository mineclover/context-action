/**
 * @fileoverview Markdown processing with Vue compatibility and display name formatting
 */

import type { ProcessorOptions } from '../types/index.js'

export class MarkdownProcessor {
  private displayNameMappings: Record<string, string>

  constructor(options: ProcessorOptions = {}) {
    this.displayNameMappings = options.displayNameMappings || this.getDefaultDisplayNameMappings()
  }

  /**
   * Transform outside fenced code blocks so TypeScript/markdown samples stay intact.
   */
  private transformOutsideCodeFences(
    content: string,
    transform: (segment: string) => string
  ): string {
    const lines = content.split('\n')
    const result: string[] = []
    let buffer: string[] = []
    let activeFence: string | null = null

    const flushBuffer = () => {
      if (buffer.length > 0) {
        result.push(transform(buffer.join('\n')))
        buffer = []
      }
    }

    for (const line of lines) {
      const trimmed = line.trimStart()
      const fenceMatch = trimmed.match(/^(```+|~~~+)/)

      if (fenceMatch?.[1]) {
        const marker = fenceMatch[1]
        if (!activeFence) {
          flushBuffer()
          activeFence = marker[0]!
          result.push(line)
          continue
        }
        if (marker[0] === activeFence && trimmed.slice(marker.length).trim() === '') {
          activeFence = null
          result.push(line)
          continue
        }
      }

      if (activeFence) {
        result.push(line)
      } else {
        buffer.push(line)
      }
    }

    flushBuffer()
    return result.join('\n')
  }

  private normalizePosixPath(inputPath: string): string {
    const posix = inputPath.replace(/\\/g, '/').replace(/\/+$/, '') || '.'
    const isAbsolute = posix.startsWith('/')
    const stack: string[] = []

    for (const segment of posix.split('/')) {
      if (!segment || segment === '.') continue
      if (segment === '..') {
        if (stack.length > 0 && stack[stack.length - 1] !== '..') {
          stack.pop()
        } else if (!isAbsolute) {
          stack.push('..')
        }
      } else {
        stack.push(segment)
      }
    }

    if (isAbsolute) {
      return `/${stack.join('/')}`
    }
    return stack.join('/') || '.'
  }

  private resolvePosixPath(baseDir: string, relativeTarget: string): string {
    if (relativeTarget.startsWith('/')) {
      return this.normalizePosixPath(relativeTarget)
    }
    const cleanBase = baseDir === '.' ? '' : baseDir.replace(/\/+$/, '')
    return this.normalizePosixPath(cleanBase ? `${cleanBase}/${relativeTarget}` : relativeTarget)
  }

  private relativePosixPath(fromDir: string, toPath: string): string {
    const normFrom = this.normalizePosixPath(fromDir)
    const normTo = this.normalizePosixPath(toPath)
    if (normFrom === normTo) {
      return '.'
    }

    const fromParts = normFrom === '/' || normFrom === '.' ? [] : normFrom.split('/')
    const toParts = normTo === '/' || normTo === '.' ? [] : normTo.split('/')

    let common = 0
    while (common < fromParts.length && common < toParts.length && fromParts[common] === toParts[common]) {
      common++
    }

    const upMoves = new Array<string>(fromParts.length - common).fill('..')
    const downMoves = toParts.slice(common)
    return [...upMoves, ...downMoves].join('/') || '.'
  }

  private dirnamePosix(filePath: string): string {
    const normalized = this.normalizePosixPath(filePath)
    const idx = normalized.lastIndexOf('/')
    if (idx < 0) return '.'
    if (idx === 0) return '/'
    return normalized.slice(0, idx)
  }

  /**
   * Rewrite relative TypeDoc links so flattened package directories under targetDir resolve cleanly.
   */
  rewriteFlattenedLinks(
    content: string,
    options: {
      sourcePath: string
      targetPath: string
      sourceDir: string
      targetDir: string
      packageMapping: Record<string, string>
    }
  ): string {
    const sourceRoot = this.normalizePosixPath(options.sourceDir)
    const targetRoot = this.normalizePosixPath(options.targetDir)
    const sourceFile = this.normalizePosixPath(options.sourcePath)
    const targetFile = this.normalizePosixPath(options.targetPath)
    const sourceFileDir = this.dirnamePosix(sourceFile)
    const targetFileDir = this.dirnamePosix(targetFile)

    const mappedPackages = Object.keys(options.packageMapping)
      .sort((a, b) => b.length - a.length)

    const resolveMappedTarget = (relFromSourceRoot: string): string | null => {
      const cleanRel = relFromSourceRoot === '.' ? '' : relFromSourceRoot
      if (cleanRel === '' || !cleanRel.startsWith('packages/')) {
        return cleanRel ? `${targetRoot}/${cleanRel}` : targetRoot
      }

      const afterPackages = cleanRel.slice('packages/'.length)
      for (const pkgKey of mappedPackages) {
        if (afterPackages === pkgKey || afterPackages.startsWith(`${pkgKey}/`)) {
          const targetPkg = options.packageMapping[pkgKey]!
          const suffix = afterPackages.slice(pkgKey.length)
          return this.resolvePosixPath(targetRoot, `${targetPkg}${suffix}`)
        }
      }

      return null
    }

    return this.transformOutsideCodeFences(content, (segment) =>
      segment.replace(/(`[^`\n]+`|!?\[[^\]\n]*\]\(([^)\n]+)\))/g, (fullMatch, _whole, rawTarget: string | undefined) => {
        if (!rawTarget || fullMatch.startsWith('`')) {
          return fullMatch
        }

        const trimmedTarget = rawTarget.trim()
        if (
          !trimmedTarget ||
          trimmedTarget.startsWith('#') ||
          trimmedTarget.startsWith('/') ||
          /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmedTarget)
        ) {
          return fullMatch
        }

        const suffixMatch = trimmedTarget.match(/^([^?#\s]+)([?#][^\s]*)?(\s+["'][^"']*["'])?$/)
        if (!suffixMatch?.[1]) {
          return fullMatch
        }

        const linkPath = suffixMatch[1]
        const queryOrHash = suffixMatch[2] || ''
        const titleSuffix = suffixMatch[3] || ''
        const hadTrailingSlash = linkPath.endsWith('/')

        const resolvedSourceTarget = this.resolvePosixPath(sourceFileDir, linkPath)
        const relFromRoot = this.relativePosixPath(sourceRoot, resolvedSourceTarget)
        if (relFromRoot === '..' || relFromRoot.startsWith('../')) {
          return fullMatch
        }

        const mappedTarget = resolveMappedTarget(relFromRoot)
        if (!mappedTarget) {
          return fullMatch
        }

        let rewrittenPath = this.relativePosixPath(targetFileDir, mappedTarget)
        if (hadTrailingSlash && !rewrittenPath.endsWith('/')) {
          rewrittenPath = `${rewrittenPath}/`
        }

        const rebuiltTarget = `${rewrittenPath}${queryOrHash}${titleSuffix}`
        const targetStart = fullMatch.lastIndexOf(`(${rawTarget})`)
        if (targetStart === -1) {
          return fullMatch
        }
        return `${fullMatch.slice(0, targetStart)}(${rebuiltTarget})`
      })
    )
  }

  /**
   * Post-process markdown content for Vue/VitePress compatibility
   */
  postProcessMarkdown(content: string): string {
    return this.transformOutsideCodeFences(content, (segment) =>
      segment
        // Escape Vue-incompatible generic syntax in markdown headers and body
        .replace(/\\<`([A-Z])`\\>/g, '&lt;`$1`&gt;')
        .replace(/\\<`([A-Z][A-Za-z0-9]*)`\\>/g, '&lt;`$1`&gt;')
        .replace(/\\<`([^`]+)`\\>/g, '&lt;`$1`&gt;')
        // Handle unescaped generic types
        .replace(/([A-Za-z]+)<([A-Z])>/g, '$1&lt;$2&gt;')
        // Convert standalone single-letter generic headings to safe text
        .replace(/^### ([A-Z])$/gm, '### Generic type $1')
        .replace(/Type parameter `([A-Z])`/g, 'Type parameter **$1**')
        // Narrow to single-letter type parameters (with optional constraint) so PascalCase type names stay untouched
        .replace(/^`([A-Z](?:\s+extends\s+[^`\n]+)?)`$/gm, 'Type parameter **$1**')
        .replace(/^Generic type parameter ([A-Z])$/gm, 'Type parameter **$1**')
    )
  }

  /**
   * Format filename to human-readable display name
   */
  formatDisplayName(filename: string): string {
    // Handle README files
    if (filename === 'README') {
      return 'Overview'
    }
    
    // Check custom mappings first
    if (this.displayNameMappings[filename]) {
      return this.displayNameMappings[filename]
    }
    
    // Convert camelCase to Title Case
    const displayName = filename
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
      .trim()
    
    return displayName
  }

  /**
   * Add custom display name mapping
   */
  addDisplayNameMapping(filename: string, displayName: string): void {
    this.displayNameMappings[filename] = displayName
  }

  /**
   * Set display name mappings
   */
  setDisplayNameMappings(mappings: Record<string, string>): void {
    this.displayNameMappings = { ...this.getDefaultDisplayNameMappings(), ...mappings }
  }

  /**
   * Get current display name mappings
   */
  getDisplayNameMappings(): Readonly<Record<string, string>> {
    return this.displayNameMappings
  }

  /**
   * Get default display name mappings
   */
  private getDefaultDisplayNameMappings(): Record<string, string> {
    return {
      // Core & Action API terms
      'ActionRegister': 'Action Register',
      'ActionDispatcher': 'Action Dispatcher',
      'ActionPayloadMap': 'Action Payload Map',
      'ActionRegisterConfig': 'Action Register Config',
      'HandlerConfig': 'Handler Config',
      'PipelineController': 'Pipeline Controller',
      'ActionHandler': 'Action Handler',
      'UnregisterFunction': 'Unregister Function',
      'ExecutionMode': 'Execution Mode',
      'ExecutionResult': 'Execution Result',
      'DispatchOptions': 'Dispatch Options',

      // Core functions
      'executeParallel': 'Execute Parallel',
      'executeRace': 'Execute Race',
      'executeSequential': 'Execute Sequential',
      'createActionContext': 'createActionContext',
      'createStoreContext': 'createStoreContext',
      'createRefContext': 'createRefContext',
      'createTimeTravelStoreContext': 'createTimeTravelStoreContext',
      'createTimeTravelStore': 'createTimeTravelStore',
      'createStore': 'createStore',

      // Store system
      'Store': 'Store',
      'IStore': 'IStore',
      'StoreConfig': 'Store Config',
      'StoreManager': 'Store Manager',
      'TimeTravelStore': 'Time Travel Store',
      'TimeTravelStoreManager': 'Time Travel Store Manager',

      // React integration & hooks
      'useStoreValue': 'useStoreValue',
      'useStoreSelector': 'useStoreSelector',
      'useStoreSelectorWithPaths': 'useStoreSelectorWithPaths',
      'useStorePath': 'useStorePath',
      'useStoreTransactionInspector': 'useStoreTransactionInspector',
      'useTimeTravelControls': 'useTimeTravelControls',
      'useTimeTravelPath': 'useTimeTravelPath',
      'useTimeTravelSelector': 'useTimeTravelSelector',

      // Interfaces & Type aliases
      'ActionContextConfig': 'Action Context Config',
      'ActionContextReturn': 'Action Context Return',
      'ActionContextType': 'Action Context Type',
      'Snapshot': 'Snapshot',
      'InitialStores': 'Initial Stores',
      'WithProviderConfig': 'With Provider Config'
    }
  }

  /**
   * Process content with custom transformations
   */
  processContent(content: string, transformations?: Array<(content: string) => string>): string {
    let processedContent = this.postProcessMarkdown(content)
    
    if (transformations) {
      for (const transform of transformations) {
        processedContent = transform(processedContent)
      }
    }
    
    return processedContent
  }

  /**
   * Extract and format code blocks
   */
  extractCodeBlocks(content: string): Array<{ language: string; code: string; line: number }> {
    const codeBlocks: Array<{ language: string; code: string; line: number }> = []
    const lines = content.split('\n')
    let inCodeBlock = false
    let currentBlock: { language: string; code: string[]; line: number } | null = null
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (!line) continue;
      
      if (line.startsWith('```')) {
        if (!inCodeBlock) {
          // Start of code block
          const language = line.substring(3).trim() || 'text'
          currentBlock = { language, code: [], line: i + 1 }
          inCodeBlock = true
        } else {
          // End of code block
          if (currentBlock) {
            codeBlocks.push({
              language: currentBlock.language,
              code: currentBlock.code.join('\n'),
              line: currentBlock.line
            })
          }
          currentBlock = null
          inCodeBlock = false
        }
      } else if (inCodeBlock && currentBlock) {
        currentBlock.code.push(line)
      }
    }
    
    return codeBlocks
  }

  /**
   * Validate markdown structure
   */
  validateStructure(content: string): Array<{ type: string; message: string; line?: number }> {
    const issues: Array<{ type: string; message: string; line?: number }> = []
    const lines = content.split('\n')
    
    // Check heading hierarchy
    let prevHeadingLevel = 0
    let hasTitle = false
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (!line) continue;
      
      // Check for title (H1)
      if (line.startsWith('# ')) {
        hasTitle = true
        prevHeadingLevel = 1
        continue
      }
      
      // Check heading hierarchy
      const headingMatch = line.match(/^(#{2,6}) /)
      if (headingMatch?.[1]) {
        const level = headingMatch[1].length
        if (level > prevHeadingLevel + 1) {
          issues.push({
            type: 'heading-hierarchy',
            message: `Heading level jumps from H${prevHeadingLevel} to H${level}`,
            line: i + 1
          })
        }
        prevHeadingLevel = level
      }
    }
    
    if (!hasTitle) {
      issues.push({
        type: 'missing-title',
        message: 'Document missing H1 title'
      })
    }
    
    return issues
  }
}