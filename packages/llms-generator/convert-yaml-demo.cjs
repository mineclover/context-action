#!/usr/bin/env node

/**
 * Demo script to convert YAML to TXT format
 */

const fs = require('fs');
const path = require('path');
const YAML = require('yaml');

// Read the existing YAML file
const yamlPath = './data/ko/guide-action-handlers/guide-action-handlers-100.yaml';

async function convertYamlToTxt() {
  try {
    console.log('📄 Reading YAML file...');
    const yamlContent = fs.readFileSync(yamlPath, 'utf-8');
    const yamlData = YAML.parse(yamlContent);
    
    console.log('🔄 Converting to TXT format...');
    
    // Format as TXT
    const lines = [];
    
    // Document metadata
    lines.push('# Document Information');
    lines.push(`Document Path: ${yamlData.document.path}`);
    lines.push(`Title: ${yamlData.document.title}`);
    lines.push(`Document ID: ${yamlData.document.id}`);
    lines.push(`Category: ${yamlData.document.category}`);
    lines.push('');
    
    // Priority information
    lines.push('# Priority');
    lines.push(`Score: ${yamlData.priority.score}`);
    lines.push(`Tier: ${yamlData.priority.tier}`);
    lines.push('');
    
    // Summary configuration
    lines.push('# Summary Configuration');
    lines.push(`Character Limit: ${yamlData.summary.character_limit}`);
    lines.push(`Focus: ${yamlData.summary.focus}`);
    lines.push(`Strategy: ${yamlData.summary.strategy}`);
    lines.push(`Language: ${yamlData.summary.language}`);
    lines.push('');
    
    // Content
    lines.push('# Content');
    lines.push(yamlData.content.trim());
    lines.push('');
    
    // Work status
    lines.push('# Work Status');
    lines.push(`Created: ${yamlData.work_status.created}`);
    lines.push(`Modified: ${yamlData.work_status.modified}`);
    lines.push(`Edited: ${yamlData.work_status.edited ? 'Yes' : 'No'}`);
    lines.push(`Needs Update: ${yamlData.work_status.needs_update ? 'Yes' : 'No'}`);
    
    const txtContent = lines.join('\n');
    
    // Write TXT file
    const txtPath = './guide-action-handlers-100.txt';
    fs.writeFileSync(txtPath, txtContent, 'utf-8');
    
    console.log('✅ Conversion completed!');
    console.log(`📁 Output: ${txtPath}`);
    console.log('\n📄 TXT Content:');
    console.log('='.repeat(80));
    console.log(txtContent);
    console.log('='.repeat(80));
    
    console.log('\n💡 This TXT format can now be used for config-based automatic generation');
    console.log('   instead of YAML templates. Priority updates can be applied directly');
    console.log('   to the TXT files for batch processing.');
    
  } catch (error) {
    console.error('❌ Conversion failed:', error);
  }
}

convertYamlToTxt();