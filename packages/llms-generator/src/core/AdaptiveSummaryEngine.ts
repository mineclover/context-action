/**
 * Adaptive Summary Engine - Implements intelligent character-limited content generation
 * Based on the adaptive composition strategy from docs/llm-content/README.md
 */

import type { PriorityMetadata, DocumentContent, SortedPriorityCollection } from '../types/index.js';
import { DocumentProcessor } from './DocumentProcessor.js';

interface TierGroup {
  critical: Array<{ id: string; priority: PriorityMetadata }>;
  essential: Array<{ id: string; priority: PriorityMetadata }>;
  important: Array<{ id: string; priority: PriorityMetadata }>;
  reference: Array<{ id: string; priority: PriorityMetadata }>;
  supplementary: Array<{ id: string; priority: PriorityMetadata }>;
}

interface CompositionStrategy {
  baselineChars: number;
  remainingChars: number;
  distribution: {
    tier: keyof TierGroup;
    documents: number;
    charsPerDoc: number;
    totalChars: number;
  }[];
}

export class AdaptiveSummaryEngine {
  private documentProcessor: DocumentProcessor;

  constructor(docsDir: string) {
    this.documentProcessor = new DocumentProcessor(docsDir);
  }

  /**
   * Generate adaptive character-limited content using priority-based composition
   */
  async generateAdaptiveContent(
    targetChars: number,
    sortedPriorities: SortedPriorityCollection,
    language: string
  ): Promise<string> {
    console.log(`\n🎯 Adaptive composition for ${targetChars} characters...`);

    const tierGroups = this.groupDocumentsByTier(sortedPriorities.documents);
    const strategy = this.calculateCompositionStrategy(targetChars, tierGroups);
    
    console.log(`📊 Composition strategy:`, strategy);

    let content = this.generateAdaptiveHeader(targetChars, language);
    
    // Generate content following the adaptive strategy
    for (const distribution of strategy.distribution) {
      const tierDocs = tierGroups[distribution.tier];
      const selectedDocs = tierDocs.slice(0, distribution.documents);
      
      if (selectedDocs.length === 0) continue;

      content += `\n## ${this.capitalizeTier(distribution.tier)} (${selectedDocs.length}/${tierDocs.length} documents)\n\n`;
      
      for (const doc of selectedDocs) {
        const summary = await this.generateDocumentSummary(
          doc,
          distribution.charsPerDoc,
          language
        );
        content += summary + '\n\n';
      }
    }

    content += this.generateAdaptiveFooter(targetChars, strategy);
    
    // Validate final character count
    const finalChars = this.removeYAML(content).length;
    const deviation = Math.abs(finalChars - targetChars) / targetChars;
    
    if (deviation > 0.1) {
      console.warn(`⚠️  Character count deviation: ${Math.round(deviation * 100)}% (${finalChars}/${targetChars})`);
    } else {
      console.log(`✅ Character count within range: ${finalChars}/${targetChars} (${Math.round(deviation * 100)}% deviation)`);
    }

    return content;
  }

  /**
   * Calculate adaptive composition strategy based on target characters and tier distribution
   */
  private calculateCompositionStrategy(targetChars: number, tierGroups: TierGroup): CompositionStrategy {
    const totalDocs = Object.values(tierGroups).flat().length;
    const baseChars = 100; // Base character allocation per document
    const baselineChars = totalDocs * baseChars;
    const remainingChars = Math.max(0, targetChars - baselineChars);

    console.log(`📏 Strategy calculation: ${totalDocs} docs, ${baselineChars} baseline, ${remainingChars} remaining`);

    const distribution: CompositionStrategy['distribution'] = [];

    if (targetChars <= 3000) {
      // Small target: Focus on critical and essential only
      distribution.push({
        tier: 'critical',
        documents: Math.min(tierGroups.critical.length, Math.floor(targetChars * 0.4 / 200)),
        charsPerDoc: 200,
        totalChars: 0
      });
      
      const criticalChars = distribution[0].documents * distribution[0].charsPerDoc;
      const essentialBudget = targetChars - criticalChars;
      
      distribution.push({
        tier: 'essential',
        documents: Math.min(tierGroups.essential.length, Math.floor(essentialBudget / 150)),
        charsPerDoc: 150,
        totalChars: 0
      });
    } else if (targetChars <= 10000) {
      // Medium target: Use 4-step adaptive procedure
      // Step 1: Base allocation (100 chars each)
      const step1Chars = Math.min(baselineChars, targetChars * 0.6);
      const step1Remaining = targetChars - step1Chars;

      // Step 2: Critical expansion
      const criticalExpansion = Math.min(
        tierGroups.critical.length * 900, // 100->1000 expansion
        step1Remaining * 0.7
      );
      
      distribution.push({
        tier: 'critical',
        documents: tierGroups.critical.length,
        charsPerDoc: criticalExpansion > 0 ? 100 + (criticalExpansion / tierGroups.critical.length) : 100,
        totalChars: 0
      });

      // Step 3: Essential expansion
      const step3Remaining = step1Remaining - criticalExpansion;
      const essentialExpansion = Math.min(
        tierGroups.essential.length * 200, // 100->300 expansion
        step3Remaining
      );

      distribution.push({
        tier: 'essential',
        documents: tierGroups.essential.length,
        charsPerDoc: essentialExpansion > 0 ? 100 + (essentialExpansion / tierGroups.essential.length) : 100,
        totalChars: 0
      });

      // Step 4: Include important/reference with base allocation
      distribution.push({
        tier: 'important',
        documents: tierGroups.important.length,
        charsPerDoc: 100,
        totalChars: 0
      });

      distribution.push({
        tier: 'reference',
        documents: tierGroups.reference.length,
        charsPerDoc: 100,
        totalChars: 0
      });
    } else {
      // Large target: Comprehensive expansion
      distribution.push({
        tier: 'critical',
        documents: tierGroups.critical.length,
        charsPerDoc: Math.min(1500, Math.floor(targetChars * 0.3 / tierGroups.critical.length)),
        totalChars: 0
      });

      distribution.push({
        tier: 'essential',
        documents: tierGroups.essential.length,
        charsPerDoc: Math.min(800, Math.floor(targetChars * 0.4 / tierGroups.essential.length)),
        totalChars: 0
      });

      distribution.push({
        tier: 'important',
        documents: tierGroups.important.length,
        charsPerDoc: Math.min(400, Math.floor(targetChars * 0.2 / Math.max(tierGroups.important.length, 1))),
        totalChars: 0
      });

      distribution.push({
        tier: 'reference',
        documents: tierGroups.reference.length,
        charsPerDoc: Math.min(300, Math.floor(targetChars * 0.1 / Math.max(tierGroups.reference.length, 1))),
        totalChars: 0
      });
    }

    // Calculate total chars for each distribution
    distribution.forEach(dist => {
      dist.totalChars = dist.documents * dist.charsPerDoc;
    });

    return {
      baselineChars,
      remainingChars,
      distribution: distribution.filter(d => d.documents > 0)
    };
  }

  /**
   * Generate summary for a single document based on its priority metadata
   */
  private async generateDocumentSummary(
    docItem: { id: string; priority: PriorityMetadata },
    targetChars: number,
    language: string
  ): Promise<string> {
    const { priority } = docItem;
    const doc = priority.document;
    
    let summary = `### ${doc.title}\n\n`;
    
    // Add priority and category info
    summary += `**Priority**: ${priority.priority.score}/100 (${priority.priority.tier})  \n`;
    summary += `**Category**: ${doc.category}  \n`;
    if (doc.subcategory) {
      summary += `**Subcategory**: ${doc.subcategory}  \n`;
    }
    summary += `**Source**: \`${doc.source_path}\`\n\n`;

    // Calculate remaining characters for content
    const metadataChars = summary.length;
    const contentChars = Math.max(50, targetChars - metadataChars - 20); // 20 chars buffer

    // Generate content based on extraction strategy
    const content = await this.generateContentByStrategy(
      priority,
      contentChars,
      language
    );
    
    summary += content;

    // Add keywords if space allows
    if (priority.keywords.primary.length > 0 && summary.length < targetChars - 50) {
      summary += `\n\n**Key concepts**: ${priority.keywords.primary.slice(0, 3).join(', ')}`;
    }

    return summary;
  }

  /**
   * Generate content based on extraction strategy from priority metadata
   */
  private async generateContentByStrategy(
    priority: PriorityMetadata,
    targetChars: number,
    language: string
  ): Promise<string> {
    const strategy = priority.extraction.strategy;
    const mustInclude = priority.extraction.emphasis.must_include;
    
    // Try to read actual document content
    let documentContent: DocumentContent | null = null;
    
    try {
      documentContent = await this.documentProcessor.readSourceDocument(priority.document.source_path, language, priority.document.id);
    } catch (error) {
      console.warn(`⚠️  Could not read document: ${priority.document.source_path}`);
    }

    let content = '';

    if (documentContent) {
      // Extract content based on strategy
      content = await this.extractContentByStrategy(documentContent, strategy, targetChars, mustInclude);
    } else {
      // Fallback: Generate from metadata
      content = this.generateFallbackContent(priority, targetChars);
    }

    return content;
  }

  /**
   * Extract content from document based on strategy
   */
  private async extractContentByStrategy(
    doc: DocumentContent,
    strategy: string,
    targetChars: number,
    mustInclude: string[]
  ): Promise<string> {
    const cleanContent = this.documentProcessor.removeYAMLFrontmatter(doc.cleanContent);
    
    if (cleanContent.length <= targetChars) {
      return cleanContent;
    }

    // Apply strategy-specific extraction
    switch (strategy) {
      case 'concept-first':
        return this.extractConceptFirst(cleanContent, targetChars, mustInclude);
      case 'example-first':
        return this.extractExampleFirst(cleanContent, targetChars, mustInclude);
      case 'api-first':
        return this.extractApiFirst(cleanContent, targetChars, mustInclude);
      default:
        return this.extractGeneral(cleanContent, targetChars, mustInclude);
    }
  }

  /**
   * Extract content focusing on concepts first
   */
  private extractConceptFirst(content: string, targetChars: number, mustInclude: string[]): string {
    const sections = content.split('\n## ');
    let result = '';
    
    // Find concept sections first
    const conceptSections = sections.filter(section => 
      /concept|principle|overview|introduction/i.test(section)
    );
    
    // Add concept sections first
    for (const section of conceptSections) {
      const sectionContent = section.startsWith('#') ? section : '## ' + section;
      if (result.length + sectionContent.length <= targetChars) {
        result += sectionContent + '\n\n';
      }
    }
    
    // Fill remaining space with other important content
    const remainingChars = targetChars - result.length;
    if (remainingChars > 100) {
      const otherSections = sections.filter(section => !conceptSections.includes(section));
      for (const section of otherSections) {
        const sectionContent = section.startsWith('#') ? section : '## ' + section;
        if (result.length + sectionContent.length <= targetChars) {
          result += sectionContent + '\n\n';
        }
      }
    }
    
    return result.trim();
  }

  /**
   * Extract content focusing on examples first
   */
  private extractExampleFirst(content: string, targetChars: number, mustInclude: string[]): string {
    const sections = content.split('\n## ');
    let result = '';
    
    // Find example sections first
    const exampleSections = sections.filter(section => 
      /example|usage|how.*to|tutorial/i.test(section)
    );
    
    // Add example sections first
    for (const section of exampleSections) {
      const sectionContent = section.startsWith('#') ? section : '## ' + section;
      if (result.length + sectionContent.length <= targetChars) {
        result += sectionContent + '\n\n';
      }
    }
    
    // Fill remaining with concepts and API
    const remainingChars = targetChars - result.length;
    if (remainingChars > 100) {
      const otherSections = sections.filter(section => !exampleSections.includes(section));
      for (const section of otherSections) {
        const sectionContent = section.startsWith('#') ? section : '## ' + section;
        if (result.length + sectionContent.length <= targetChars) {
          result += sectionContent + '\n\n';
        }
      }
    }
    
    return result.trim();
  }

  /**
   * Extract content focusing on API documentation first
   */
  private extractApiFirst(content: string, targetChars: number, mustInclude: string[]): string {
    const sections = content.split('\n## ');
    let result = '';
    
    // Find API sections first
    const apiSections = sections.filter(section => 
      /api|interface|method|function|parameter|return/i.test(section)
    );
    
    // Add API sections first
    for (const section of apiSections) {
      const sectionContent = section.startsWith('#') ? section : '## ' + section;
      if (result.length + sectionContent.length <= targetChars) {
        result += sectionContent + '\n\n';
      }
    }
    
    // Fill remaining with usage examples
    const remainingChars = targetChars - result.length;
    if (remainingChars > 100) {
      const otherSections = sections.filter(section => !apiSections.includes(section));
      for (const section of otherSections) {
        const sectionContent = section.startsWith('#') ? section : '## ' + section;
        if (result.length + sectionContent.length <= targetChars) {
          result += sectionContent + '\n\n';
        }
      }
    }
    
    return result.trim();
  }

  /**
   * General content extraction when no specific strategy applies
   */
  private extractGeneral(content: string, targetChars: number, mustInclude: string[]): string {
    // Simple truncation with sentence boundary awareness
    if (content.length <= targetChars) {
      return content;
    }
    
    const truncated = content.substring(0, targetChars);
    const lastSentence = truncated.lastIndexOf('.');
    
    if (lastSentence > targetChars * 0.8) {
      return truncated.substring(0, lastSentence + 1);
    }
    
    return truncated + '...';
  }

  /**
   * Generate fallback content when document cannot be read
   */
  private generateFallbackContent(priority: PriorityMetadata, targetChars: number): string {
    let content = `${priority.purpose.primary_goal}\n\n`;
    
    if (priority.purpose.use_cases.length > 0) {
      content += `**Use cases**:\n`;
      content += priority.purpose.use_cases.slice(0, 3).map(uc => `- ${uc}`).join('\n');
      content += '\n\n';
    }
    
    if (priority.keywords.primary.length > 0) {
      content += `**Key concepts**: ${priority.keywords.primary.join(', ')}\n\n`;
    }
    
    if (content.length > targetChars) {
      content = content.substring(0, targetChars - 3) + '...';
    }
    
    return content;
  }

  /**
   * Group documents by tier
   */
  private groupDocumentsByTier(documents: Array<{ id: string; priority: PriorityMetadata }>): TierGroup {
    return {
      critical: documents.filter(d => d.priority.priority.tier === 'critical'),
      essential: documents.filter(d => d.priority.priority.tier === 'essential'),
      important: documents.filter(d => d.priority.priority.tier === 'important'),
      reference: documents.filter(d => d.priority.priority.tier === 'reference'),
      supplementary: documents.filter(d => d.priority.priority.tier === 'supplementary')
    };
  }

  /**
   * Remove YAML frontmatter from content for character counting
   */
  private removeYAML(content: string): string {
    return content.replace(/^---\n[\s\S]*?\n---\n/, '').trim();
  }

  /**
   * Capitalize tier name
   */
  private capitalizeTier(tier: string): string {
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  }

  /**
   * Generate adaptive content header
   */
  private generateAdaptiveHeader(targetChars: number, language: string): string {
    return `# Context-Action Framework - ${targetChars} Character Summary

Generated: ${new Date().toISOString().split('T')[0]}
Type: Adaptive Character-Limited
Language: ${language.toUpperCase()}
Target Characters: ${targetChars}

This document provides an intelligently composed summary of the Context-Action framework documentation, optimized for ${targetChars} characters using priority-based adaptive composition.

`;
  }

  /**
   * Generate adaptive content footer
   */
  private generateAdaptiveFooter(targetChars: number, strategy: CompositionStrategy): string {
    const totalGenerated = strategy.distribution.reduce((sum, dist) => sum + dist.totalChars, 0);
    
    return `

---

## Composition Summary

**Target Characters**: ${targetChars}  
**Generated Characters**: ${totalGenerated}  
**Composition Strategy**: Adaptive Priority-Based  

**Distribution**:
${strategy.distribution.map(dist => 
  `- **${this.capitalizeTier(dist.tier)}**: ${dist.documents} docs × ${dist.charsPerDoc} chars = ${dist.totalChars} chars`
).join('\n')}

**Total Documents**: ${strategy.distribution.reduce((sum, dist) => sum + dist.documents, 0)}  
**Adaptation Algorithm**: 4-step adaptive procedure with priority-based expansion  

*Generated automatically using @context-action/llms-generator*`;
  }
}