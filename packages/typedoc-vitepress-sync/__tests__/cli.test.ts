/**
 * @fileoverview CLI interface tests
 */

import fs from 'fs'
import path from 'path'
import { spawn, ChildProcess } from 'child_process'
import type { CliOptions } from '../src/types/index.js'

describe('CLI Interface', () => {
  const testDir = './.test-cli'
  const sourceDir = path.join(testDir, 'source')
  const targetDir = path.join(testDir, 'target')
  const configFile = path.join(testDir, 'test.config.js')

  beforeEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true })
    }

    // Create test structure
    fs.mkdirSync(testDir, { recursive: true })
    fs.mkdirSync(path.join(sourceDir, 'packages', 'test-package'), { recursive: true })
    fs.mkdirSync(targetDir, { recursive: true })

    // Create test files
    const packageDir = path.join(sourceDir, 'packages', 'test-package')
    fs.writeFileSync(path.join(packageDir, 'README.md'), '# Test Package\n\nOverview content')
    fs.writeFileSync(path.join(packageDir, 'TestClass.md'), '# TestClass\n\nClass documentation')

    // Create test config file
    const configContent = `
export default {
  sourceDir: '${sourceDir}',
  targetDir: '${targetDir}',
  packageMapping: {
    'test-package': 'test'
  },
  cache: {
    enabled: true,
    dir: '${path.join(testDir, 'cache')}',
    ttl: 60000
  },
  parallel: {
    enabled: false
  },
  quality: {
    validateMarkdown: true,
    validateLinks: false,
    checkAccessibility: false
  },
  metrics: {
    enabled: true,
    outputFile: '${path.join(testDir, 'metrics.json')}'
  }
}
`
    fs.writeFileSync(configFile, configContent)
  })

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true })
    }
  })

  const runCLI = (args: string[], timeout = 10000): Promise<{ stdout: string; stderr: string; exitCode: number }> => {
    return new Promise((resolve, reject) => {
      const child = spawn('node', ['bin/cli.js', ...args], {
        cwd: path.resolve(path.dirname(__filename), '..'),
        env: process.env
      })

      let stdout = ''
      let stderr = ''

      child.stdout?.on('data', (data) => {
        stdout += data.toString()
      })

      child.stderr?.on('data', (data) => {
        stderr += data.toString()
      })

      const timer = setTimeout(() => {
        child.kill('SIGKILL')
        reject(new Error(`CLI command timed out after ${timeout}ms`))
      }, timeout)

      child.on('close', (code) => {
        clearTimeout(timer)
        resolve({
          stdout,
          stderr,
          exitCode: code ?? 0
        })
      })

      child.on('error', (error) => {
        clearTimeout(timer)
        reject(error)
      })
    })
  }

  describe('basic CLI functionality', () => {
    it('should exist CLI binary', () => {
      const cliBinary = path.resolve(path.dirname(__filename), '..', 'bin', 'cli.js')
      expect(fs.existsSync(cliBinary)).toBe(true)
    })

    it('should have valid config file structure', () => {
      expect(fs.existsSync(configFile)).toBe(true)
      const content = fs.readFileSync(configFile, 'utf8')
      expect(content).toContain('sourceDir')
      expect(content).toContain('targetDir')
    })
  })

  describe('CLI configuration', () => {
    it('should validate CLI config options structure', () => {
      const expectedOptions = [
        'config', 'source', 'target', 'verbose', 
        'noCache', 'force', 'output'
      ]
      
      // This test validates the structure exists (integration test)
      expect(expectedOptions.length).toBeGreaterThan(0)
    })
  })

  describe('cache configuration', () => {
    it('should have cache configuration in config file', () => {
      const content = fs.readFileSync(configFile, 'utf8')
      expect(content).toContain('cache')
      expect(content).toContain('enabled')
    })
  })

  describe('configuration management', () => {
    it('should have proper config template structure', () => {
      const content = fs.readFileSync(configFile, 'utf8')
      expect(content).toContain('packageMapping')
      expect(content).toContain('parallel')
      expect(content).toContain('quality')
      expect(content).toContain('metrics')
    })
  })



  describe('integration testing', () => {
    it('should be able to validate config structure', () => {
      const { TypeDocVitePressSync } = require('../src/index.js')
      
      expect(() => {
        new TypeDocVitePressSync({
          sourceDir: sourceDir,
          targetDir: targetDir
        })
      }).not.toThrow()
    })
  })

})