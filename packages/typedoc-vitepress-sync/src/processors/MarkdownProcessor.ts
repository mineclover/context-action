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
   * Post-process markdown content for Vue/VitePress compatibility
   */
  postProcessMarkdown(content: string): string {
    return content
      // Vue 컴파일러가 HTML 태그로 인식하는 패턴들을 완전히 제거
      // 제네릭 타입 파라미터 \<T\> -> &lt;T&gt;
      .replace(/\\<`([A-Z])`\\>/g, '&lt;`$1`&gt;')
      // 다른 제네릭 패턴들도 처리
      .replace(/\\<`([A-Z][A-Za-z0-9]*)`\\>/g, '&lt;`$1`&gt;')
      // 복잡한 제네릭 타입도 처리 (예: \<T, K\>)
      .replace(/\\<`([^`]+)`\\>/g, '&lt;`$1`&gt;')
      // Vue가 문제를 일으키는 일반적인 제네릭 타입 패턴들 처리
      .replace(/([A-Za-z]+)<([A-Z])>/g, '$1&lt;$2&gt;')
      // Vue가 문제를 일으키는 단일 타입 파라미터 헤더들을 안전한 형태로 변경
      .replace(/^### ([A-Z])$/gm, '### Generic type $1')
      // 백틱이 있는 단일 대문자를 완전히 안전한 형태로 변경
      .replace(/Type parameter `([A-Z])`/g, 'Type parameter **$1**')
      // 단일 줄에 단일 대문자만 있는 경우 (예: `T`)
      .replace(/^`([A-Z])`$/gm, 'Type parameter **$1**')
      // 단일 줄에 제네릭 타입만 있는 경우 (예: `T extends Something`)
      .replace(/^`([A-Z][A-Za-z0-9 =<>\[\]]*)`$/gm, 'Type parameter **$1**')
      // 타입 파라미터 설명 라인들을 안전하게 처리
      .replace(/^Generic type parameter ([A-Z])$/gm, 'Type parameter **$1**')
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
    let displayName = filename
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
      // Core API terms
      'ActionRegister': 'Action Register',
      'ActionDispatcher': 'Action Dispatcher',
      'ActionMetrics': 'Action Metrics',
      'ActionPayloadMap': 'Action Payload Map',
      'ActionRegisterConfig': 'Action Register Config',
      'ActionRegisterEvents': 'Action Register Events',
      'EventEmitter': 'Event Emitter',
      'HandlerConfig': 'Handler Config',
      'HandlerRegistration': 'Handler Registration',
      'PipelineController': 'Pipeline Controller',
      'PipelineContext': 'Pipeline Context',
      'ActionHandler': 'Action Handler',
      'EventHandler': 'Event Handler',
      'UnregisterFunction': 'Unregister Function',
      'ExecutionMode': 'Execution Mode',
      'ExecutionResult': 'Execution Result',
      'DispatchOptions': 'Dispatch Options',
      
      // Function names
      'executeParallel': 'Execute Parallel',
      'executeRace': 'Execute Race',
      'executeSequential': 'Execute Sequential',
      'createActionContext': 'createActionContext',
      'createDeclarativeStorePattern': 'Create Declarative Store Pattern',
      'createComputedStore': 'createComputedStore',
      'createLogger': 'createLogger',
      'createRegistrySync': 'createRegistrySync',
      'createStore': 'createStore',
      'createStoreContext': 'createStoreContext',
      
      // Store and Event System
      'ConsoleLogger': 'Console Logger',
      'EventBus': 'Event Bus',
      'NumericStore': 'Numeric Store',
      'RegistryUtils': 'Registry Utils',
      'ScopedEventBus': 'Scoped Event Bus',
      'Store': 'Store',
      'StoreRegistry': 'Store Registry',
      'StoreUtils': 'Store Utils',
      'LogLevel': 'Log Level',
      
      // React Integration
      'ActionProvider': 'Action Provider',
      'StoreProvider': 'Store Provider',
      'useActionDispatch': 'useActionDispatch',
      'useActionRegister': 'useActionRegister',
      'useActionWithStores': 'useActionWithStores',
      'useBatchStoreSync': 'useBatchStoreSync',
      'useComputedStore': 'useComputedStore',
      'useComputedValue': 'useComputedValue',
      'useDynamicStore': 'useDynamicStore',
      'useLocalState': 'useLocalState',
      'useLocalStore': 'useLocalStore',
      'useMVVMStore': 'useMVVMStore',
      'useMultiMVVMStore': 'useMultiMVVMStore',
      'useMultiStoreAction': 'useMultiStoreAction',
      'usePersistedStore': 'usePersistedStore',
      'useRegistry': 'useRegistry',
      'useRegistryStore': 'useRegistryStore',
      'useStore': 'useStore',
      'useStoreActions': 'useStoreActions',
      'useStoreQuery': 'useStoreQuery',
      'useStoreRegistry': 'useStoreRegistry',
      'useStoreSync': 'useStoreSync',
      'useStoreValue': 'useStoreValue',
      'useStoreValues': 'useStoreValues',
      'useTransactionAction': 'useTransactionAction',
      
      // Interface and Type names
      'ActionContextConfig': 'Action Context Config',
      'ActionContextReturn': 'Action Context Return',
      'ActionContextType': 'Action Context Type',
      'ActionProviderProps': 'Action Provider Props',
      'DynamicStoreOptions': 'Dynamic Store Options',
      'HookOptions': 'Hook Options',
      'IEventBus': 'IEventBus',
      'IStore': 'IStore',
      'IStoreRegistry': 'IStoreRegistry',
      'RegistryStoreMap': 'Registry Store Map',
      'StoreContextReturn': 'Store Context Return',
      'StoreContextType': 'Store Context Type',
      'StoreProviderContextType': 'Store Provider Context Type',
      'StoreProviderProps': 'Store Provider Props',
      'StoreSyncConfig': 'Store Sync Config',
      
      // Utility functions
      'assertStoreValue': 'Assert Store Value',
      'compareValues': 'Compare Values',
      'deepClone': 'Deep Clone',
      'deepEqual': 'Deep Equal',
      'defaultEqualityFn': 'Default Equality Fn',
      'getGlobalComparisonOptions': 'Get Global Comparison Options',
      'getGlobalImmutabilityOptions': 'Get Global Immutability Options',
      'performantSafeGet': 'Performant Safe Get',
      'safeGet': 'Safe Get',
      'safeSet': 'Safe Set',
      'setGlobalComparisonOptions': 'Set Global Comparison Options',
      'shallowEqual': 'Shallow Equal',
      'useAsyncComputedStore': 'Use Async Computed Store',
      'useComputedStoreInstance': 'Use Computed Store Instance',
      'useMultiComputedStore': 'Use Multi Computed Store',
      'useMultiStoreSelector': 'Use Multi Store Selector',
      'useStorePathSelector': 'Use Store Path Selector',
      'useStoreSelector': 'Use Store Selector',
      
      // Type aliases
      'Listener': 'Listener',
      'Subscribe': 'Subscribe',
      'Unsubscribe': 'Unsubscribe',
      'ComparisonOptions': 'Comparison Options',
      'Snapshot': 'Snapshot',
      'StoreConfig': 'Store Config',
      'StoreEventHandler': 'Store Event Handler',
      'WithProviderConfig': 'With Provider Config',
      'ComparisonStrategy': 'Comparison Strategy',
      'CustomComparator': 'Custom Comparator',
      'InferInitialStores': 'Infer Initial Stores',
      'InferStoreTypes': 'Infer Store Types',
      'InitialStores': 'Initial Stores',
      'StoreDefinitions': 'Store Definitions',
      'StoreValues': 'Store Values',
      
      // Additional utility functions
      'useDynamicStoreSnapshot': 'useDynamicStoreSnapshot',
      'useDynamicStoreWithDefault': 'useDynamicStoreWithDefault',
      'useDynamicStores': 'useDynamicStores',
      'useStoreContext': 'useStoreContext',
      'createAtomContext': 'createAtomContext',
      'AtomContextConfig': 'Atom Context Config',
      'NoopLogger': 'Noop Logger',
      'getDebugFromEnv': 'getDebugFromEnv',
      'getLoggerNameFromEnv': 'getLoggerNameFromEnv'
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
      
      // Check for title (H1)
      if (line.startsWith('# ')) {
        hasTitle = true
        prevHeadingLevel = 1
        continue
      }
      
      // Check heading hierarchy
      const headingMatch = line.match(/^(#{2,6}) /)
      if (headingMatch) {
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