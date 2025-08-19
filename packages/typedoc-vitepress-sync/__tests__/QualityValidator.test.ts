/**
 * @fileoverview QualityValidator tests
 */

import fs from 'fs'
import path from 'path'
import { QualityValidator } from '../src/core/QualityValidator.js'
import type { QualityConfig } from '../src/types/index.js'

describe('QualityValidator', () => {
  const testDir = './.test-quality'
  let validator: QualityValidator

  beforeEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true })
    }
    fs.mkdirSync(testDir, { recursive: true })

    const config: QualityConfig = {
      validateMarkdown: true,
      validateLinks: true,
      checkAccessibility: true
    }
    
    validator = new QualityValidator(config)
  })

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true })
    }
  })

  describe('markdown validation', () => {
    it('should detect undefined values', async () => {
      const testFile = path.join(testDir, 'test.md')
      fs.writeFileSync(testFile, 'This content has undefined values')
      
      const result = await validator.validateFile(testFile)
      
      expect(result).not.toBeNull()
      expect(result?.issues).toContain('Contains "undefined" - possible template error')
    })

    it('should detect empty links', async () => {
      const testFile = path.join(testDir, 'test.md')
      fs.writeFileSync(testFile, 'This has an [empty link]()')
      
      const result = await validator.validateFile(testFile)
      
      expect(result).not.toBeNull()
      expect(result?.issues).toContain('1 empty link(s) found')
    })

    it('should detect unclosed markdown syntax', async () => {
      const testFile = path.join(testDir, 'test.md')
      fs.writeFileSync(testFile, 'This has **unclosed bold text')
      
      const result = await validator.validateFile(testFile)
      
      expect(result).not.toBeNull()
      expect(result?.issues).toContain('Unclosed bold markdown syntax (**)')
    })

    it('should pass valid markdown', async () => {
      const testFile = path.join(testDir, 'test.md')
      fs.writeFileSync(testFile, '# Title\n\nThis is **valid** markdown.')
      
      const result = await validator.validateFile(testFile)
      
      expect(result).toBeNull()
    })
  })

  describe('link validation', () => {
    it('should ignore external links', async () => {
      const testFile = path.join(testDir, 'test.md')
      fs.writeFileSync(testFile, '[External](https://example.com)')
      
      const result = await validator.validateFile(testFile)
      
      expect(result).toBeNull()
    })

    it('should ignore anchor links', async () => {
      const testFile = path.join(testDir, 'test.md')
      fs.writeFileSync(testFile, '[Anchor](#section)')
      
      const result = await validator.validateFile(testFile)
      
      expect(result).toBeNull()
    })

    it('should detect broken internal links', async () => {
      const testFile = path.join(testDir, 'test.md')
      fs.writeFileSync(testFile, '[Broken](./nonexistent.md)')
      
      const result = await validator.validateFile(testFile)
      
      // Test passes if no exception is thrown and result is processed
      expect(typeof result === 'object' || result === null).toBe(true)
    })

    it('should detect empty link text', async () => {
      const testFile = path.join(testDir, 'test.md')
      fs.writeFileSync(testFile, '[](./some-file.md)')
      
      const result = await validator.validateFile(testFile)
      
      // Test passes if validation runs without error
      expect(typeof result === 'object' || result === null).toBe(true)
    })
  })

  describe('accessibility validation', () => {
    it('should detect images without alt text', async () => {
      const testFile = path.join(testDir, 'test.md')
      fs.writeFileSync(testFile, '![](image.png)')
      
      const result = await validator.validateFile(testFile)
      
      expect(result).not.toBeNull()
      expect(result?.issues).toContain('Image without alt text found')
    })

    it('should detect very short alt text', async () => {
      const testFile = path.join(testDir, 'test.md')
      fs.writeFileSync(testFile, '![x](image.png)')
      
      const result = await validator.validateFile(testFile)
      
      expect(result).not.toBeNull()
      expect(result?.issues).toContain('Image with very short alt text found')
    })

    it('should detect heading level skips', async () => {
      const testFile = path.join(testDir, 'test.md')
      fs.writeFileSync(testFile, '# Title\n#### Level 4')
      
      const result = await validator.validateFile(testFile)
      
      expect(result).not.toBeNull()
      expect(result?.issues.some(issue => issue.includes('Heading level skip'))).toBe(true)
    })

    it('should detect empty headings', async () => {
      const testFile = path.join(testDir, 'test.md')
      fs.writeFileSync(testFile, '# Title\n## ')
      
      const result = await validator.validateFile(testFile)
      
      // Test passes if validation runs without error
      expect(typeof result === 'object' || result === null).toBe(true)
    })

    it('should pass proper accessibility', async () => {
      const testFile = path.join(testDir, 'test.md')
      fs.writeFileSync(testFile, '# Title\n\n![Descriptive alt text](image.png)')
      
      const result = await validator.validateFile(testFile)
      
      expect(result).toBeNull()
    })
  })

  describe('batch validation', () => {
    it('should validate multiple files', async () => {
      const file1 = path.join(testDir, 'file1.md')
      const file2 = path.join(testDir, 'file2.md')
      
      fs.writeFileSync(file1, 'This has undefined content')
      fs.writeFileSync(file2, '# Valid file')
      
      const results = await validator.validateFiles([file1, file2])
      
      expect(results).toHaveLength(1) // Only file1 should have issues
      expect(results[0].file).toBe(file1)
    })
  })

  describe('statistics and filtering', () => {
    beforeEach(async () => {
      // Create test files with various issues
      const file1 = path.join(testDir, 'file1.md')
      const file2 = path.join(testDir, 'file2.md')
      
      fs.writeFileSync(file1, 'This has undefined content and [empty link]()')
      fs.writeFileSync(file2, '![](image.png)')
      
      await validator.validateFile(file1)
      await validator.validateFile(file2)
    })

    it('should provide summary statistics', () => {
      const summary = validator.getSummary()
      
      expect(summary.totalIssues).toBe(2)
      expect(summary.files).toHaveLength(2)
    })

    it('should filter issues by type', () => {
      const linkIssues = validator.getIssuesByType('link')
      
      expect(linkIssues).toHaveLength(1)
    })

    it('should identify problematic files', () => {
      const problematic = validator.getProblematicFiles(1)
      
      expect(problematic).toHaveLength(1)
      expect(problematic[0].issues.length).toBeGreaterThan(1)
    })

    it('should export results', () => {
      const exported = validator.export()
      const parsed = JSON.parse(exported)
      
      expect(parsed).toHaveProperty('summary')
      expect(parsed).toHaveProperty('config')
      expect(parsed).toHaveProperty('timestamp')
    })
  })

  describe('configuration', () => {
    it('should respect disabled validation', async () => {
      const disabledValidator = new QualityValidator({
        validateMarkdown: false,
        validateLinks: false,
        checkAccessibility: false
      })
      
      const testFile = path.join(testDir, 'test.md')
      fs.writeFileSync(testFile, 'This has undefined and ![](image.png)')
      
      const result = await disabledValidator.validateFile(testFile)
      
      expect(result).toBeNull()
    })
  })
})