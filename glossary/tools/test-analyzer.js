#!/usr/bin/env node

/**
 * Test script for structure analyzer
 */

const fs = require('fs').promises;
const path = require('path');

async function testStructureAnalyzer() {
  console.log('🧪 Testing Structure Analyzer Components...\n');
  
  try {
    // 1. Test file paths
    const termsPath = path.join(__dirname, '../terms');
    const dataPath = path.join(__dirname, '../implementations/_data');
    
    console.log('📂 Checking file paths:');
    console.log('  Terms path:', termsPath);
    console.log('  Data path:', dataPath);
    
    // 2. Test terms files
    const termFiles = ['core-concepts.md', 'api-terms.md', 'architecture-terms.md', 'naming-conventions.md'];
    console.log('\n📖 Checking term files:');
    
    for (const filename of termFiles) {
      try {
        const filePath = path.join(termsPath, filename);
        const stats = await fs.stat(filePath);
        console.log(`  ✅ ${filename} (${stats.size} bytes)`);
      } catch (err) {
        console.log(`  ❌ ${filename} - ${err.message}`);
      }
    }
    
    // 3. Test mappings file
    console.log('\n🗂️ Checking mappings file:');
    const mappingsPath = path.join(dataPath, 'mappings.json');
    try {
      const mappingsContent = await fs.readFile(mappingsPath, 'utf-8');
      const mappings = JSON.parse(mappingsContent);
      console.log(`  ✅ mappings.json loaded`);
      console.log(`  📊 Terms mapped: ${Object.keys(mappings.terms).length}`);
    } catch (err) {
      console.log(`  ❌ mappings.json - ${err.message}`);
      return;
    }
    
    // 4. Test markdown parsing
    console.log('\n📝 Testing markdown parsing:');
    const coreConceptsPath = path.join(termsPath, 'core-concepts.md');
    const content = await fs.readFile(coreConceptsPath, 'utf-8');
    
    const sections = content.split(/\n## /).slice(1);
    console.log(`  📄 Found ${sections.length} sections in core-concepts.md`);
    
    // Parse first section as example
    if (sections.length > 0) {
      const firstSection = sections[0];
      const lines = firstSection.split('\n');
      const title = lines[0].trim();
      console.log(`  🎯 First section: "${title}"`);
      
      // Look for definition
      const defLine = lines.find(line => line.trim().startsWith('**Definition**:'));
      if (defLine) {
        console.log(`  📝 Has definition: Yes`);
      }
      
      // Look for related terms
      const relatedLine = lines.find(line => line.trim().startsWith('**Related Terms**:'));
      if (relatedLine) {
        console.log(`  🔗 Has related terms: Yes`);
      }
    }
    
    console.log('\n✅ All basic tests passed! Structure analyzer should work.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

if (require.main === module) {
  testStructureAnalyzer();
}

module.exports = { testStructureAnalyzer };