/**
 * @fileoverview SidebarGenerator tests
 */

import fs from 'fs'
import path from 'path'
import { SidebarGenerator } from '../src/processors/SidebarGenerator.js'
import type { ApiStructure, SidebarSection } from '../src/types/index.js'

describe('SidebarGenerator', () => {
  const testDir = './.test-sidebar'
  const outputFile = path.join(testDir, 'sidebar-config.ts')
  
  let generator: SidebarGenerator

  beforeEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true })
    }
    fs.mkdirSync(testDir, { recursive: true })

    generator = new SidebarGenerator()
  })

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true })
    }
  })

  const createTestApiStructure = (): ApiStructure => ({
    'core': {
      text: 'Core',
      items: [
        { text: 'Action Register', path: '/api/core/ActionRegister' },
        { text: 'Action Handler', path: '/api/core/ActionHandler' },
        { text: 'Pipeline Controller', path: '/api/core/PipelineController' }
      ]
    },
    'react': {
      text: 'React',
      items: [
        { text: 'Action Provider', path: '/api/react/ActionProvider' },
        { text: 'useActionDispatch', path: '/api/react/useActionDispatch' },
        { text: 'useStoreValue', path: '/api/react/useStoreValue' }
      ]
    }
  })

  describe('API structure generation', () => {
    it('should parse API structure from target directory', () => {
      // Create test markdown files
      const coreDir = path.join(testDir, 'core', 'src')
      const reactDir = path.join(testDir, 'react', 'src')
      
      fs.mkdirSync(coreDir, { recursive: true })
      fs.mkdirSync(reactDir, { recursive: true })
      
      // Core package files
      fs.writeFileSync(path.join(coreDir, 'ActionRegister.md'), '# ActionRegister\n\nCore class')
      fs.writeFileSync(path.join(coreDir, 'ActionHandler.md'), '# ActionHandler\n\nHandler interface')
      fs.writeFileSync(path.join(coreDir, 'index.md'), '# Core Package\n\nOverview')
      
      // React package files
      fs.writeFileSync(path.join(reactDir, 'ActionProvider.md'), '# ActionProvider\n\nReact component')
      fs.writeFileSync(path.join(reactDir, 'useActionDispatch.md'), '# useActionDispatch\n\nReact hook')

      const packageMapping = {
        'core': 'core',
        'react': 'react'
      }

      const structure = generator.parseApiStructure(testDir, packageMapping)

      expect(structure).toHaveProperty('core')
      expect(structure).toHaveProperty('react')
      expect(structure.core.items.length).toBeGreaterThan(0)
      expect(structure.react.items.length).toBeGreaterThan(0)
    })

    it('should handle empty directories gracefully', () => {
      const emptyDir = path.join(testDir, 'empty')
      fs.mkdirSync(emptyDir, { recursive: true })

      const structure = generator.parseApiStructure(testDir, { 'empty': 'empty' })

      expect(structure).toHaveProperty('empty')
      expect(structure.empty.items).toHaveLength(0)
    })

    it('should create structure for existing directories', () => {
      const coreDir = path.join(testDir, 'core', 'src')
      fs.mkdirSync(coreDir, { recursive: true })
      fs.writeFileSync(path.join(coreDir, 'test.md'), '# Test\n\nTest file')

      const structure = generator.parseApiStructure(testDir, { 'core': 'core' })

      expect(structure.core).toBeDefined()
      expect(structure.core.text).toBe('Core API')
      expect(structure.core.items.length).toBeGreaterThan(0)
    })
  })

  describe('sidebar configuration generation', () => {
    it('should generate sidebar sections from API structure', () => {
      const apiStructure = createTestApiStructure()
      const sections = generator.generateSidebarSections(apiStructure)

      expect(Array.isArray(sections)).toBe(true)
      expect(sections.length).toBeGreaterThan(0)

      // Test that sections are created
      const hasCoreSection = sections.some(section => section.text.includes('Core'))
      expect(hasCoreSection).toBe(true)
    })

    it('should create sections for different packages', () => {
      const apiStructure: ApiStructure = {
        'utils': {
          text: 'Utils',
          items: [{ text: 'Helper', path: '/api/utils/Helper' }]
        },
        'core': {
          text: 'Core',
          items: [{ text: 'Main', path: '/api/core/Main' }]
        }
      }

      const sections = generator.generateSidebarSections(apiStructure)
      
      expect(sections.length).toBeGreaterThanOrEqual(2)
    })

    it('should handle sections with items', () => {
      const apiStructure: ApiStructure = {
        'core': {
          text: 'Core',
          items: [
            { text: 'Overview', path: '/api/core/README' },
            { text: 'Action Register', path: '/api/core/ActionRegister' }
          ]
        }
      }

      const sections = generator.generateSidebarSections(apiStructure)
      
      expect(sections.length).toBeGreaterThan(0)
      const coreSection = sections.find(s => s.text.includes('Core'))
      expect(coreSection).toBeDefined()
    })
  })

  describe('TypeScript file generation', () => {
    it('should generate TypeScript sidebar configuration file', () => {
      const apiStructure = createTestApiStructure()
      
      generator.generateConfigFile(outputFile, apiStructure)

      expect(fs.existsSync(outputFile)).toBe(true)
      
      const content = fs.readFileSync(outputFile, 'utf8')
      
      // Check that it contains TypeScript export
      expect(content).toContain('export')
      expect(content.length).toBeGreaterThan(0)
    })

    it('should generate valid TypeScript syntax', () => {
      const apiStructure = createTestApiStructure()
      
      generator.generateConfigFile(outputFile, apiStructure)
      
      const content = fs.readFileSync(outputFile, 'utf8')
      
      // Check for valid TypeScript patterns
      expect(content).toContain('export')
      expect(content).toMatch(/text:/)
      expect(content).toMatch(/items:/)
    })

    it('should handle special characters in paths and names', () => {
      const specialStructure: ApiStructure = {
        'core': {
          text: 'Core',
          items: [
            { text: 'Action & Handler', path: '/api/core/Action&Handler' },
            { text: 'Test Item', path: '/api/core/TestItem' }
          ]
        }
      }

      generator.generateConfigFile(outputFile, specialStructure)
      
      const content = fs.readFileSync(outputFile, 'utf8')
      
      // Should contain the content
      expect(content.length).toBeGreaterThan(0)
      expect(content).toContain('Action & Handler')
    })
  })

  describe('configuration generation', () => {
    it('should create basic configuration', () => {
      const apiStructure = createTestApiStructure()
      
      expect(() => {
        generator.generateConfigFile(outputFile, apiStructure)
      }).not.toThrow()
      
      expect(fs.existsSync(outputFile)).toBe(true)
    })
  })


  describe('error handling', () => {
    it('should handle missing directories gracefully', () => {
      const structure = generator.parseApiStructure('./nonexistent', { 'test': 'test' })
      
      expect(structure).toEqual({})
    })

    it('should handle empty structures', () => {
      const emptyStructure: ApiStructure = {}
      
      expect(() => {
        generator.generateConfigFile(outputFile, emptyStructure)
      }).not.toThrow()
    })
  })
})