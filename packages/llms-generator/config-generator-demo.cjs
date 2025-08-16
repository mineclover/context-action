#!/usr/bin/env node

/**
 * Demo script for Config-Based Generator with TXT templates
 * Complete integration test of the system
 */

const fs = require('fs');
const path = require('path');

async function runConfigBasedGeneratorDemo() {
  console.log('🚀 Config-Based Generator Demo');
  console.log('='.repeat(50));
  
  try {
    // Mock configuration for demo
    const config = {
      generation: {
        defaultCharacterLimits: [100, 200, 300, 500, 1000]
      }
    };
    
    const generationConfig = {
      languages: ['ko', 'en'],
      characterLimits: [100, 200, 300],
      categories: ['guide', 'api', 'tutorial'],
      outputDirectory: './generated-templates',
      templateDirectory: './templates',
      batchSize: 10,
      priorityUpdateMode: 'update-only'
    };
    
    console.log('📊 Generation Configuration:');
    console.log(`   Languages: ${generationConfig.languages.join(', ')}`);
    console.log(`   Character Limits: ${generationConfig.characterLimits.join(', ')}`);
    console.log(`   Categories: ${generationConfig.categories.join(', ')}`);
    console.log(`   Output Directory: ${generationConfig.outputDirectory}`);
    console.log('');
    
    // Step 1: Create sample documents (simulated discovery)
    console.log('📄 Step 1: Creating sample document templates...');
    
    const sampleDocs = [
      {
        documentId: 'guide-action-handlers',
        title: '액션 핸들러',
        category: 'guide',
        sourcePath: 'ko/guide/action-handlers.md',
        priority: { score: 90, tier: 'essential' }
      },
      {
        documentId: 'guide-store-integration',
        title: '스토어 통합',
        category: 'guide',
        sourcePath: 'ko/guide/store-integration.md',
        priority: { score: 85, tier: 'important' }
      },
      {
        documentId: 'api-action-context',
        title: '액션 컨텍스트 API',
        category: 'api',
        sourcePath: 'ko/api/action-context.md',
        priority: { score: 80, tier: 'useful' }
      }
    ];
    
    // Step 2: Generate TXT templates for all combinations
    console.log('🏭 Step 2: Generating TXT templates...');
    const generatedFiles = [];
    
    // Ensure output directory exists
    await fs.promises.mkdir(generationConfig.outputDirectory, { recursive: true });
    
    for (const lang of generationConfig.languages) {
      for (const doc of sampleDocs) {
        for (const charLimit of generationConfig.characterLimits) {
          const outputPath = path.join(
            generationConfig.outputDirectory,
            lang,
            doc.category,
            `${doc.documentId}-${charLimit}.txt`
          );
          
          // Ensure directory exists
          await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
          
          // Generate TXT template content
          const templateContent = generateTxtTemplate(doc, lang, charLimit);
          
          await fs.promises.writeFile(outputPath, templateContent, 'utf-8');
          generatedFiles.push(outputPath);
          
          console.log(`   ✅ Generated: ${path.relative('.', outputPath)}`);
        }
      }
    }
    
    console.log(`📊 Generated ${generatedFiles.length} TXT templates`);
    console.log('');
    
    // Step 3: Demonstrate priority updates
    console.log('🔄 Step 3: Demonstrating priority updates...');
    
    const priorityUpdates = {
      'guide-action-handlers': { score: 95, tier: 'critical' },
      'guide-store-integration': { score: 88, tier: 'essential' },
      'api-action-context': { score: 75, tier: 'useful' }
    };
    
    // Update priorities in generated files
    let updatedCount = 0;
    for (const filePath of generatedFiles) {
      const template = await parseTxtTemplate(filePath);
      if (!template) continue;
      
      const updateKey = template.document_id;
      if (priorityUpdates[updateKey]) {
        const update = priorityUpdates[updateKey];
        
        // Update priority values
        template.priority_score = update.score;
        template.priority_tier = update.tier;
        template.modified_date = new Date().toISOString();
        template.needs_update = false;
        
        // Rewrite the file
        const updatedContent = formatTxtTemplate(template);
        await fs.promises.writeFile(filePath, updatedContent, 'utf-8');
        updatedCount++;
        
        console.log(`   ✅ Updated priority for ${updateKey}: score=${update.score}, tier=${update.tier}`);
      }
    }
    
    console.log(`📊 Updated priorities in ${updatedCount} files`);
    console.log('');
    
    // Step 4: Demonstrate batch processing with priority filtering
    console.log('🔥 Step 4: Batch processing with priority filtering...');
    
    const processedDir = path.join(generationConfig.outputDirectory, 'processed');
    await fs.promises.mkdir(processedDir, { recursive: true });
    
    const minPriorityScore = 85;
    const processedFiles = [];
    
    for (const filePath of generatedFiles) {
      const template = await parseTxtTemplate(filePath);
      if (!template) continue;
      
      // Check priority threshold
      if (template.priority_score >= minPriorityScore) {
        const outputPath = path.join(
          processedDir,
          `${template.document_id}-${template.character_limit}-processed.txt`
        );
        
        // Process and save (simulated LLM processing)
        template.content = `[PROCESSED] ${template.content}`;
        template.modified_date = new Date().toISOString();
        template.needs_update = false;
        
        const processedContent = formatTxtTemplate(template);
        await fs.promises.writeFile(outputPath, processedContent, 'utf-8');
        processedFiles.push(outputPath);
        
        console.log(`   ✅ Processed ${template.document_id} (priority: ${template.priority_score})`);
      } else {
        console.log(`   ⏭️  Skipped ${template?.document_id} (priority: ${template?.priority_score} < ${minPriorityScore})`);
      }
    }
    
    console.log(`📊 Processed ${processedFiles.length} files based on priority`);
    console.log('');
    
    // Step 5: Summary
    console.log('📈 Step 5: Demo Summary');
    console.log(`   Generated: ${generatedFiles.length} TXT templates`);
    console.log(`   Updated: ${updatedCount} priority scores`);
    console.log(`   Processed: ${processedFiles.length} high-priority files`);
    console.log('');
    
    // Display sample file content
    if (processedFiles.length > 0) {
      console.log('📄 Sample Processed File:');
      console.log('='.repeat(50));
      const sampleContent = await fs.promises.readFile(processedFiles[0], 'utf-8');
      console.log(sampleContent);
      console.log('='.repeat(50));
    }
    
    console.log('');
    console.log('✅ Config-Based Generator Demo Completed!');
    console.log('💡 The system successfully demonstrated:');
    console.log('   • TXT template generation for multiple languages/character limits');
    console.log('   • Priority-based template updating');
    console.log('   • Batch processing with selective criteria');
    console.log('   • Complete workflow for config-based automatic generation');
    
  } catch (error) {
    console.error('❌ Demo failed:', error);
  }
}

function generateTxtTemplate(doc, language, characterLimit) {
  const lines = [];
  
  lines.push('# Document Information');
  lines.push(`Document Path: ${doc.sourcePath}`);
  lines.push(`Title: ${doc.title}`);
  lines.push(`Document ID: ${doc.documentId}`);
  lines.push(`Category: ${doc.category}`);
  lines.push('');
  
  lines.push('# Priority');
  lines.push(`Score: ${doc.priority.score}`);
  lines.push(`Tier: ${doc.priority.tier}`);
  lines.push('');
  
  lines.push('# Summary Configuration');
  lines.push(`Character Limit: ${characterLimit}`);
  lines.push(`Focus: 기본 개념`);
  lines.push(`Strategy: concept-first`);
  lines.push(`Language: ${language}`);
  lines.push('');
  
  lines.push('# Content');
  lines.push(`${doc.title}에 대한 ${characterLimit}자 요약입니다. 이 내용은 자동으로 생성된 템플릿입니다.`);
  lines.push('');
  
  lines.push('# Work Status');
  lines.push(`Created: ${new Date().toISOString()}`);
  lines.push(`Modified: ${new Date().toISOString()}`);
  lines.push(`Edited: No`);
  lines.push(`Needs Update: Yes`);
  
  return lines.join('\n');
}

async function parseTxtTemplate(txtFilePath) {
  try {
    const content = await fs.promises.readFile(txtFilePath, 'utf-8');
    const lines = content.split('\n');
    
    const data = {};
    let currentSection = '';
    let contentLines = [];
    let inContentSection = false;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('# ')) {
        currentSection = trimmed.substring(2);
        inContentSection = currentSection === 'Content';
        continue;
      }
      
      if (inContentSection && currentSection === 'Content') {
        if (!trimmed.startsWith('#') && trimmed) {
          contentLines.push(line);
        }
      } else if (trimmed.includes(': ')) {
        const [key, value] = trimmed.split(': ', 2);
        
        switch (key) {
          case 'Document Path':
            data.document_path = value;
            break;
          case 'Title':
            data.title = value;
            break;
          case 'Document ID':
            data.document_id = value;
            break;
          case 'Category':
            data.category = value;
            break;
          case 'Score':
            data.priority_score = parseInt(value);
            break;
          case 'Tier':
            data.priority_tier = value;
            break;
          case 'Character Limit':
            data.character_limit = parseInt(value);
            break;
          case 'Focus':
            data.focus = value;
            break;
          case 'Strategy':
            data.strategy = value;
            break;
          case 'Language':
            data.language = value;
            break;
          case 'Created':
            data.created_date = value;
            break;
          case 'Modified':
            data.modified_date = value;
            break;
          case 'Edited':
            data.is_edited = value.toLowerCase() === 'yes';
            break;
          case 'Needs Update':
            data.needs_update = value.toLowerCase() === 'yes';
            break;
        }
      }
    }
    
    data.content = contentLines.join('\n').trim();
    return data;
    
  } catch (error) {
    console.error(`❌ Failed to parse TXT template ${txtFilePath}:`, error);
    return null;
  }
}

function formatTxtTemplate(data) {
  const lines = [];
  
  lines.push('# Document Information');
  lines.push(`Document Path: ${data.document_path}`);
  lines.push(`Title: ${data.title}`);
  lines.push(`Document ID: ${data.document_id}`);
  lines.push(`Category: ${data.category}`);
  lines.push('');
  
  lines.push('# Priority');
  lines.push(`Score: ${data.priority_score}`);
  lines.push(`Tier: ${data.priority_tier}`);
  lines.push('');
  
  lines.push('# Summary Configuration');
  lines.push(`Character Limit: ${data.character_limit}`);
  lines.push(`Focus: ${data.focus}`);
  lines.push(`Strategy: ${data.strategy}`);
  lines.push(`Language: ${data.language}`);
  lines.push('');
  
  lines.push('# Content');
  lines.push(data.content);
  lines.push('');
  
  lines.push('# Work Status');
  lines.push(`Created: ${data.created_date}`);
  lines.push(`Modified: ${data.modified_date}`);
  lines.push(`Edited: ${data.is_edited ? 'Yes' : 'No'}`);
  lines.push(`Needs Update: ${data.needs_update ? 'Yes' : 'No'}`);
  
  return lines.join('\n');
}

runConfigBasedGeneratorDemo();