#!/usr/bin/env node

/**
 * Standalone configuration validation script
 */

const { readFile } = require('fs/promises');
const { existsSync } = require('fs');
const path = require('path');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

async function validateConfig() {
  try {
    // Paths
    const configPath = path.join(__dirname, '../../../llms-generator.config.json');
    const schemaPath = path.join(__dirname, '../data/config-schema.json');

    console.log('🔍 Configuration Validation');
    console.log('━'.repeat(50));
    console.log(`📋 Config: ${configPath}`);
    console.log(`📋 Schema: ${schemaPath}`);

    // Check files exist
    if (!existsSync(configPath)) {
      console.error(`❌ Configuration file not found: ${configPath}`);
      process.exit(1);
    }

    if (!existsSync(schemaPath)) {
      console.error(`❌ Schema file not found: ${schemaPath}`);
      process.exit(1);
    }

    // Load schema
    const schemaContent = await readFile(schemaPath, 'utf-8');
    const schema = JSON.parse(schemaContent);

    // Setup AJV
    const ajv = new Ajv({ allErrors: true, verbose: true, strict: false });
    addFormats(ajv);
    const validate = ajv.compile(schema);

    // Load config
    const configContent = await readFile(configPath, 'utf-8');
    const config = JSON.parse(configContent);

    // Remove $schema for validation
    const { $schema, ...configWithoutSchema } = config;

    // Validate
    const result = validate(configWithoutSchema);
    
    console.log('\n📊 Validation Results');
    console.log('━'.repeat(50));

    if (result) {
      console.log('✅ Configuration is VALID');
      console.log(`📋 Schema: ${$schema || 'not specified'}`);
      
      // Show config summary
      console.log('\n📋 Configuration Summary:');
      console.log(`  • Character Limits: ${config.characterLimits?.join(', ') || 'none'}`);
      console.log(`  • Languages: ${config.languages?.join(', ') || 'none'}`);
      console.log(`  • Categories: ${Object.keys(config.categories || {}).length}`);
      console.log(`  • Tags: ${Object.keys(config.tags || {}).length}`);
      
      if (config.composition?.strategies) {
        console.log(`  • Composition Strategies: ${Object.keys(config.composition.strategies).length}`);
      }
      
    } else {
      console.log('❌ Configuration is INVALID');
      console.log(`\n🚨 Errors (${validate.errors.length}):`);
      
      for (const error of validate.errors.slice(0, 10)) { // Show first 10 errors
        const path = error.instancePath || error.schemaPath || '';
        const message = error.message || 'validation error';
        console.log(`  • ${path}: ${message}`);
      }
      
      if (validate.errors.length > 10) {
        console.log(`  ... and ${validate.errors.length - 10} more errors`);
      }
      
      process.exit(1);
    }

  } catch (error) {
    console.error(`❌ Validation failed: ${error.message}`);
    process.exit(1);
  }
}

// Run validation
validateConfig().catch(console.error);