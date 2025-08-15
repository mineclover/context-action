/**
 * @fileoverview MarkdownProcessor tests
 */

import { MarkdownProcessor } from '../src/processors/MarkdownProcessor.js'

describe('MarkdownProcessor', () => {
  let processor: MarkdownProcessor

  beforeEach(() => {
    processor = new MarkdownProcessor()
  })

  describe('Vue compatibility processing', () => {
    it('should escape generic types for Vue compatibility', () => {
      const input = 'Function\\<`T`\\> takes a parameter'
      const output = processor.postProcessMarkdown(input)
      
      expect(output).toContain('&lt;`T`&gt;')
      expect(output).not.toContain('\\<`T`\\>')
    })

    it('should handle complex generic types', () => {
      const input = 'Map\\<`K, V`\\> interface'
      const output = processor.postProcessMarkdown(input)
      
      expect(output).toContain('&lt;`K, V`&gt;')
    })

    it('should convert single type parameters to safe format', () => {
      const input = '`T`'
      const output = processor.postProcessMarkdown(input)
      
      expect(output).toBe('Type parameter **T**')
    })

    it('should handle heading-level type parameters', () => {
      const input = '### T'
      const output = processor.postProcessMarkdown(input)
      
      expect(output).toBe('### Generic type T')
    })
  })

  describe('display name formatting', () => {
    it('should handle README files', () => {
      const result = processor.formatDisplayName('README')
      expect(result).toBe('Overview')
    })

    it('should format camelCase names', () => {
      const result = processor.formatDisplayName('ActionRegister')
      expect(result).toBe('Action Register')
    })

    it('should use custom mappings', () => {
      const result = processor.formatDisplayName('createActionContext')
      expect(result).toBe('createActionContext')
    })

    it('should handle unknown names', () => {
      const result = processor.formatDisplayName('SomeUnknownName')
      expect(result).toBe('Some Unknown Name')
    })
  })

  describe('custom transformations', () => {
    it('should apply custom transformations', () => {
      const input = 'Hello World'
      const transforms = [
        (content: string) => content.toLowerCase(),
        (content: string) => content.replace(' ', '_')
      ]
      
      const result = processor.processContent(input, transforms)
      expect(result).toBe('hello_world')
    })
  })

  describe('code block extraction', () => {
    it('should extract code blocks', () => {
      const input = `Some text
\`\`\`typescript
function test() {
  return 'hello'
}
\`\`\`
More text`

      const blocks = processor.extractCodeBlocks(input)
      
      expect(blocks).toHaveLength(1)
      expect(blocks[0].language).toBe('typescript')
      expect(blocks[0].code).toContain('function test()')
      expect(blocks[0].line).toBe(2)
    })

    it('should handle multiple code blocks', () => {
      const input = `\`\`\`js
console.log('first')
\`\`\`

\`\`\`python
print('second')
\`\`\``

      const blocks = processor.extractCodeBlocks(input)
      
      expect(blocks).toHaveLength(2)
      expect(blocks[0].language).toBe('js')
      expect(blocks[1].language).toBe('python')
    })
  })

  describe('structure validation', () => {
    it('should detect missing title', () => {
      const input = `## Second Level
Some content`

      const issues = processor.validateStructure(input)
      
      expect(issues).toContainEqual({
        type: 'missing-title',
        message: 'Document missing H1 title'
      })
    })

    it('should detect heading hierarchy issues', () => {
      const input = `# Title
#### Fourth Level`

      const issues = processor.validateStructure(input)
      
      expect(issues).toContainEqual({
        type: 'heading-hierarchy',
        message: 'Heading level jumps from H1 to H4',
        line: 2
      })
    })

    it('should pass valid structure', () => {
      const input = `# Title
## Section
### Subsection`

      const issues = processor.validateStructure(input)
      
      expect(issues).toHaveLength(0)
    })
  })

  describe('display name mappings', () => {
    it('should allow custom mappings', () => {
      processor.addDisplayNameMapping('customFunction', 'Custom Function Display')
      
      const result = processor.formatDisplayName('customFunction')
      expect(result).toBe('Custom Function Display')
    })

    it('should return current mappings', () => {
      const mappings = processor.getDisplayNameMappings()
      
      expect(mappings).toHaveProperty('ActionRegister')
      expect(mappings['ActionRegister']).toBe('Action Register')
    })

    it('should set new mappings', () => {
      const newMappings = { 'test': 'Test Display' }
      processor.setDisplayNameMappings(newMappings)
      
      const result = processor.formatDisplayName('test')
      expect(result).toBe('Test Display')
    })
  })
})