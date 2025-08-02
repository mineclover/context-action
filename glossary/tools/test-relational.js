#!/usr/bin/env node

/**
 * Test script for relational model
 */

const fs = require('fs').promises;
const path = require('path');

// Simple test without requiring the full module
async function testRelationalModel() {
  console.log('🧪 Testing Relational Model Data...\n');
  
  try {
    const dataPath = path.join(__dirname, '../implementations/_data');
    
    // 1. Test structural analysis data
    console.log('📊 Checking structural analysis:');
    const analysisPath = path.join(dataPath, 'structural-analysis.json');
    const analysis = JSON.parse(await fs.readFile(analysisPath, 'utf-8'));
    
    console.log(`  ✅ Analysis loaded`);
    console.log(`  📈 Total terms: ${analysis.metadata.totalTerms}`);
    console.log(`  ⚙️ Total implementations: ${analysis.metadata.totalImplementations}`);
    console.log(`  🔗 Total relationships: ${analysis.metadata.totalRelationships}`);
    
    // 2. Test mappings data
    console.log('\n🗂️ Checking mappings:');
    const mappingsPath = path.join(dataPath, 'mappings.json');
    const mappings = JSON.parse(await fs.readFile(mappingsPath, 'utf-8'));
    
    console.log(`  ✅ Mappings loaded`);
    console.log(`  📝 Mapped terms: ${Object.keys(mappings.terms).length}`);
    
    // 3. Test relational structure simulation
    console.log('\n🏗️ Simulating relational model construction:');
    
    // Entity tables simulation
    const entityCounts = {
      terms: Object.keys(mappings.terms).length,
      categories: Object.keys(analysis.categories).length,
      implementations: 0,
      files: new Set()
    };
    
    // Count implementations and files
    Object.entries(mappings.terms).forEach(([termId, implementations]) => {
      entityCounts.implementations += implementations.length;
      implementations.forEach(impl => {
        entityCounts.files.add(impl.file);
      });
    });
    
    entityCounts.files = entityCounts.files.size;
    
    console.log(`  📖 Terms table: ${entityCounts.terms} records`);
    console.log(`  🏷️ Categories table: ${entityCounts.categories} records`);
    console.log(`  ⚙️ Implementations table: ${entityCounts.implementations} records`);
    console.log(`  📁 Files table: ${entityCounts.files} records`);
    
    // Relationship tables simulation
    const relationshipCounts = {
      term_relationships: analysis.relationships.semanticReferences + analysis.relationships.coImplementations,
      term_implementations: entityCounts.implementations,
      term_categories: entityCounts.terms,
      implementation_files: entityCounts.implementations
    };
    
    console.log('\n🔗 Relationship tables:');
    console.log(`  🕸️ Term relationships: ${relationshipCounts.term_relationships} records`);
    console.log(`  ⚙️ Term-implementation: ${relationshipCounts.term_implementations} records`);
    console.log(`  🏷️ Term-category: ${relationshipCounts.term_categories} records`);
    console.log(`  📁 Implementation-file: ${relationshipCounts.implementation_files} records`);
    
    // 4. Test query scenarios
    console.log('\n🎯 Testing query scenarios:');
    
    // Find terms with multiple implementations
    const multipleImplTerms = Object.entries(mappings.terms)
      .filter(([termId, impls]) => impls.length > 1)
      .map(([termId, impls]) => ({ termId, count: impls.length }))
      .sort((a, b) => b.count - a.count);
    
    console.log(`  🏆 Terms with multiple implementations: ${multipleImplTerms.length}`);
    if (multipleImplTerms.length > 0) {
      console.log(`     Top: ${multipleImplTerms[0].termId} (${multipleImplTerms[0].count} implementations)`);
    }
    
    // Find most connected terms
    const stronglyConnected = analysis.relationships.stronglyConnected;
    console.log(`  🌐 Strongly connected terms: ${stronglyConnected.length}`);
    if (stronglyConnected.length > 0) {
      console.log(`     Top: ${stronglyConnected[0].id} (${stronglyConnected[0].connections} connections)`);
    }
    
    // Category analysis
    console.log('\n📊 Category analysis:');
    Object.entries(analysis.categories).forEach(([categoryId, categoryData]) => {
      console.log(`  ${categoryData.name}: ${categoryData.termCount} terms, ${categoryData.implementationCount} implementations`);
    });
    
    console.log('\n✅ Relational model test completed successfully!');
    console.log('\n🎉 Ready to implement hierarchical navigation system!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

if (require.main === module) {
  testRelationalModel();
}

module.exports = { testRelationalModel };