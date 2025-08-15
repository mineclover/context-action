/**
 * @fileoverview Quality validation system for generated documentation
 */

import fs from 'fs'
import path from 'path'
import type { 
  QualityConfig, 
  QualityStats, 
  QualityIssue,
  Logger 
} from '../types/index.js'

export class QualityValidator {
  private config: Required<QualityConfig>
  private issues: QualityIssue[] = []
  private logger?: Logger

  constructor(config: QualityConfig, logger?: Logger) {
    this.config = {
      validateLinks: true,
      validateMarkdown: true,
      checkAccessibility: true,
      ...config
    }
    this.logger = logger
  }

  /**
   * Validate a single file
   */
  async validateFile(filePath: string): Promise<QualityIssue | null> {
    const results: string[] = []

    try {
      if (this.config.validateMarkdown) {
        const markdownIssues = await this.validateMarkdown(filePath)
        results.push(...markdownIssues)
      }

      if (this.config.validateLinks) {
        const linkIssues = await this.validateLinks(filePath)
        results.push(...linkIssues)
      }

      if (this.config.checkAccessibility) {
        const accessibilityIssues = await this.checkAccessibility(filePath)
        results.push(...accessibilityIssues)
      }

      if (results.length > 0) {
        const issue: QualityIssue = {
          file: filePath,
          issues: results
        }
        this.issues.push(issue)
        this.logger?.warn(`Quality issues found in ${filePath}: ${results.length} issues`)
        return issue
      }
    } catch (error) {
      this.logger?.error(`Failed to validate ${filePath}:`, error)
    }

    return null
  }

  /**
   * Validate markdown syntax and content
   */
  private async validateMarkdown(filePath: string): Promise<string[]> {
    const issues: string[] = []

    try {
      const content = fs.readFileSync(filePath, 'utf8')

      // Check for undefined values (template errors)
      if (content.includes('undefined')) {
        issues.push('Contains "undefined" - possible template error')
      }

      // Check for empty links
      const emptyLinks = content.match(/\[.*?\]\(\s*\)/g)
      if (emptyLinks) {
        issues.push(`${emptyLinks.length} empty link(s) found`)
      }

      // Check for incomplete code blocks
      const codeBlocks = content.match(/```[\s\S]*?```/g) || []
      for (const block of codeBlocks) {
        if (block.trim() === '``````' || block.replace(/```\w*\n?/g, '').trim() === '') {
          issues.push('Empty or incomplete code block found')
        }
      }

      // Check for broken markdown syntax
      const unclosedBold = (content.match(/\*\*/g) || []).length % 2 !== 0
      if (unclosedBold) {
        issues.push('Unclosed bold markdown syntax (**)') 
      }

      const unclosedItalic = (content.match(/(?<!\*)\*(?!\*)/g) || []).length % 2 !== 0
      if (unclosedItalic) {
        issues.push('Unclosed italic markdown syntax (*)')
      }

      // Check for malformed tables
      const tableRows = content.split('\n').filter(line => line.includes('|'))
      if (tableRows.length > 0) {
        const firstRowCols = (tableRows[0].match(/\|/g) || []).length
        for (let i = 1; i < tableRows.length; i++) {
          const currentRowCols = (tableRows[i].match(/\|/g) || []).length
          if (currentRowCols !== firstRowCols) {
            issues.push(`Inconsistent table column count at line ${i + 1}`)
            break
          }
        }
      }

      // Check for very long lines (readability)
      const lines = content.split('\n')
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].length > 200 && !lines[i].startsWith('```')) {
          issues.push(`Very long line (${lines[i].length} chars) at line ${i + 1}`)
          break // Only report first occurrence
        }
      }

    } catch (error) {
      issues.push(`Failed to read file: ${error}`)
    }

    return issues
  }

  /**
   * Validate internal links
   */
  private async validateLinks(filePath: string): Promise<string[]> {
    const issues: string[] = []

    try {
      const content = fs.readFileSync(filePath, 'utf8')
      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
      let match

      while ((match = linkRegex.exec(content)) !== null) {
        const linkText = match[1]
        const linkPath = match[2]
        
        // Skip external links
        if (linkPath.startsWith('http://') || linkPath.startsWith('https://')) {
          continue
        }

        // Skip anchor links within the same document
        if (linkPath.startsWith('#')) {
          continue
        }

        // Check internal links
        if (linkPath.startsWith('/') || linkPath.startsWith('./') || linkPath.startsWith('../')) {
          let absolutePath: string

          if (linkPath.startsWith('/')) {
            // Absolute path from project root
            absolutePath = path.join(process.cwd(), linkPath.substring(1))
          } else {
            // Relative path
            absolutePath = path.resolve(path.dirname(filePath), linkPath)
          }

          // Remove anchor part if present
          const cleanPath = absolutePath.split('#')[0]

          if (!fs.existsSync(cleanPath)) {
            // Try with .md extension if not present
            if (!cleanPath.endsWith('.md') && !fs.existsSync(cleanPath + '.md')) {
              issues.push(`Broken link: "${linkPath}" -> ${cleanPath}`)
            }
          }
        }

        // Check for empty link text
        if (!linkText.trim()) {
          issues.push(`Empty link text for: ${linkPath}`)
        }
      }

    } catch (error) {
      issues.push(`Failed to validate links: ${error}`)
    }

    return issues
  }

  /**
   * Check accessibility compliance
   */
  private async checkAccessibility(filePath: string): Promise<string[]> {
    const issues: string[] = []

    try {
      const content = fs.readFileSync(filePath, 'utf8')

      // Check images for alt text
      const imgRegex = /!\[([^\]]*)\]/g
      let match

      while ((match = imgRegex.exec(content)) !== null) {
        const altText = match[1]
        if (!altText || altText.trim() === '') {
          issues.push('Image without alt text found')
        } else if (altText.length < 3) {
          issues.push('Image with very short alt text found')
        }
      }

      // Check heading hierarchy
      const headings = content.match(/^#{1,6} .+$/gm) || []
      let prevLevel = 0

      for (let i = 0; i < headings.length; i++) {
        const heading = headings[i]
        const level = heading.match(/^#+/)?.[0]?.length || 0
        
        if (level > prevLevel + 1 && prevLevel !== 0) {
          issues.push(`Heading level skip: H${prevLevel} to H${level} (${heading.trim()})`)
        }
        
        // Check for empty headings
        const headingText = heading.replace(/^#+\s*/, '').trim()
        if (!headingText) {
          issues.push('Empty heading found')
        }
        
        prevLevel = level
      }

      // Check for proper list formatting
      const listItems = content.match(/^[\s]*[-*+]\s/gm) || []
      const numberedItems = content.match(/^[\s]*\d+\.\s/gm) || []
      
      if (listItems.length > 0 || numberedItems.length > 0) {
        const lines = content.split('\n')
        let inList = false
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]
          const isListItem = /^[\s]*[-*+]\s/.test(line) || /^[\s]*\d+\.\s/.test(line)
          
          if (isListItem) {
            inList = true
            // Check for very short list items
            const itemText = line.replace(/^[\s]*(?:[-*+]|\d+\.)\s*/, '').trim()
            if (itemText.length < 2) {
              issues.push(`Very short list item at line ${i + 1}`)
            }
          } else if (inList && line.trim() === '') {
            // Empty line in list is okay
            continue
          } else if (inList && line.trim() !== '' && !line.startsWith(' ')) {
            inList = false
          }
        }
      }

      // Check for proper table headers
      const tables = content.match(/\|.*\|\s*\n\s*\|[-\s:|]+\|/g) || []
      for (const table of tables) {
        const headerRow = table.split('\n')[0]
        if (!headerRow.includes('|') || headerRow.split('|').length < 3) {
          issues.push('Table with insufficient header structure found')
        }
      }

    } catch (error) {
      issues.push(`Failed to check accessibility: ${error}`)
    }

    return issues
  }

  /**
   * Validate multiple files in parallel
   */
  async validateFiles(filePaths: string[]): Promise<QualityIssue[]> {
    const results = await Promise.allSettled(
      filePaths.map(filePath => this.validateFile(filePath))
    )

    const issues: QualityIssue[] = []
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        issues.push(result.value)
      }
    }

    return issues
  }

  /**
   * Get quality validation summary
   */
  getSummary(): QualityStats {
    return {
      totalIssues: this.issues.length,
      files: this.issues
    }
  }

  /**
   * Clear all validation results
   */
  clear(): void {
    this.issues = []
  }

  /**
   * Get issues by severity
   */
  getIssuesByType(type: string): QualityIssue[] {
    return this.issues.filter(issue => 
      issue.issues.some(issueText => issueText.toLowerCase().includes(type.toLowerCase()))
    )
  }

  /**
   * Get files with most issues
   */
  getProblematicFiles(limit: number = 10): QualityIssue[] {
    return this.issues
      .sort((a, b) => b.issues.length - a.issues.length)
      .slice(0, limit)
  }

  /**
   * Export validation results
   */
  export(): string {
    return JSON.stringify({
      summary: this.getSummary(),
      config: this.config,
      timestamp: new Date().toISOString()
    }, null, 2)
  }
}