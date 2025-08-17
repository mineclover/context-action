/**
 * Schema Generator - generates schema files and TypeScript types from JSON schemas
 */

import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import type { LLMSConfig } from '../types/index.js';

export interface SchemaGenerationOptions {
  outputDir?: string;
  generateTypes?: boolean;
  generateValidators?: boolean;
  language?: 'typescript' | 'javascript';
  format?: 'esm' | 'cjs';
  overwrite?: boolean;
}

export interface SchemaGenerationResult {
  success: boolean;
  generated: string[];
  errors: string[];
  summary: {
    typesGenerated: boolean;
    validatorsGenerated: boolean;
    schemasCopied: number;
  };
}

export interface JSONSchemaProperty {
  type?: string | string[];
  properties?: Record<string, JSONSchemaProperty>;
  items?: JSONSchemaProperty;
  enum?: string[];
  required?: string[];
  description?: string;
  minimum?: number;
  maximum?: number;
  minItems?: number;
  maxItems?: number;
  pattern?: string;
  format?: string;
  $ref?: string;
}

export interface JSONSchema {
  $schema?: string;
  $id?: string;
  title?: string;
  description?: string;
  type?: string;
  properties?: Record<string, JSONSchemaProperty>;
  required?: string[];
  definitions?: Record<string, JSONSchemaProperty>;
  additionalProperties?: boolean;
}

export class SchemaGenerator {
  private config: LLMSConfig;
  private schemaPath: string;

  constructor(config: LLMSConfig) {
    this.config = config;
    this.schemaPath = path.join(config.paths.llmContentDir, 'priority-schema-enhanced.json');
  }

  /**
   * Generate schema files and TypeScript types
   */
  async generateSchemaFiles(options: SchemaGenerationOptions = {}): Promise<SchemaGenerationResult> {
    const result: SchemaGenerationResult = {
      success: true,
      generated: [],
      errors: [],
      summary: {
        typesGenerated: false,
        validatorsGenerated: false,
        schemasCopied: 0
      }
    };

    const outputDir = options.outputDir || path.join(this.config.paths.llmContentDir, 'generated');
    const generateTypes = options.generateTypes !== false;
    const generateValidators = options.generateValidators !== false;
    const language = options.language || 'typescript';
    const format = options.format || 'esm';

    try {
      // Ensure output directory exists
      if (!existsSync(outputDir)) {
        await mkdir(outputDir, { recursive: true });
      }

      // Load the schema
      const schema = await this.loadSchema();

      // Generate TypeScript types
      if (generateTypes && language === 'typescript') {
        const typesPath = await this.generateTypeScriptTypes(schema, outputDir, format, options.overwrite);
        if (typesPath) {
          result.generated.push(typesPath);
          result.summary.typesGenerated = true;
        }
      }

      // Generate validators
      if (generateValidators) {
        const validatorPath = await this.generateValidators(schema, outputDir, language, format, options.overwrite);
        if (validatorPath) {
          result.generated.push(validatorPath);
          result.summary.validatorsGenerated = true;
        }
      }

      // Copy schema file
      const schemaOutputPath = path.join(outputDir, 'priority-schema-enhanced.json');
      if (!existsSync(schemaOutputPath) || options.overwrite) {
        const schemaContent = JSON.stringify(schema, null, 2);
        await writeFile(schemaOutputPath, schemaContent, 'utf-8');
        result.generated.push(schemaOutputPath);
        result.summary.schemasCopied = 1;
      }

    } catch (error) {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : String(error));
    }

    return result;
  }

  /**
   * Load schema from file
   */
  private async loadSchema(): Promise<JSONSchema> {
    if (!existsSync(this.schemaPath)) {
      throw new Error(`Schema file not found: ${this.schemaPath}`);
    }

    const schemaContent = await readFile(this.schemaPath, 'utf-8');
    return JSON.parse(schemaContent);
  }

  /**
   * Generate TypeScript type definitions from JSON schema
   */
  private async generateTypeScriptTypes(
    schema: JSONSchema,
    outputDir: string,
    format: string,
    overwrite?: boolean
  ): Promise<string | null> {
    const typesPath = path.join(outputDir, 'priority-types.ts');

    if (existsSync(typesPath) && !overwrite) {
      console.log(`⏭️  Skipping types generation (already exists): ${typesPath}`);
      return null;
    }

    const typeContent = this.generateTypeScriptContent(schema, format);
    await writeFile(typesPath, typeContent, 'utf-8');

    return typesPath;
  }

  /**
   * Generate TypeScript content from schema
   */
  private generateTypeScriptContent(schema: JSONSchema, format: string): string {
    const imports = format === 'esm' ? '' : ''; // No special imports needed for now
    
    let content = `/**
 * TypeScript types generated from priority-schema-enhanced.json
 * Generated on: ${new Date().toISOString()}
 * 
 * @fileoverview Priority metadata types for Context-Action framework
 */

${imports}

`;

    // Generate main interfaces
    content += this.generateInterfaceFromSchema('PriorityMetadata', schema);

    // Generate nested interfaces from properties
    if (schema.properties) {
      for (const [propName, propSchema] of Object.entries(schema.properties)) {
        if (propSchema.type === 'object' && propSchema.properties) {
          const interfaceName = this.toPascalCase(propName);
          content += this.generateInterfaceFromProperty(interfaceName, propSchema);
        }
      }
    }

    // Generate interfaces from definitions
    if (schema.definitions) {
      for (const [defName, defSchema] of Object.entries(schema.definitions)) {
        const interfaceName = this.toPascalCase(defName);
        content += this.generateInterfaceFromProperty(interfaceName, defSchema);
      }
    }

    // Generate utility types
    content += this.generateUtilityTypes(schema);

    // Export statement for ESM
    if (format === 'esm') {
      content += `\n// Re-export all types for convenience\nexport type * from './priority-types';\n`;
    }

    return content;
  }

  /**
   * Generate interface from schema root
   */
  private generateInterfaceFromSchema(interfaceName: string, schema: JSONSchema): string {
    const properties = schema.properties || {};
    const required = schema.required || [];
    
    let interfaceContent = `export interface ${interfaceName} {\n`;

    for (const [propName, propSchema] of Object.entries(properties)) {
      const isOptional = !required.includes(propName);
      const propType = this.getTypeScriptType(propSchema);
      const description = propSchema.description ? `  /** ${propSchema.description} */\n` : '';
      
      interfaceContent += description;
      interfaceContent += `  ${propName}${isOptional ? '?' : ''}: ${propType};\n`;
    }

    interfaceContent += '}\n\n';
    return interfaceContent;
  }

  /**
   * Generate interface from property schema
   */
  private generateInterfaceFromProperty(interfaceName: string, propSchema: JSONSchemaProperty): string {
    const properties = propSchema.properties || {};
    const required = propSchema.required || [];
    
    let interfaceContent = `export interface ${interfaceName} {\n`;

    for (const [propName, nestedPropSchema] of Object.entries(properties)) {
      const isOptional = !required.includes(propName);
      const propType = this.getTypeScriptType(nestedPropSchema);
      const description = nestedPropSchema.description ? `  /** ${nestedPropSchema.description} */\n` : '';
      
      interfaceContent += description;
      interfaceContent += `  ${propName}${isOptional ? '?' : ''}: ${propType};\n`;
    }

    interfaceContent += '}\n\n';
    return interfaceContent;
  }

  /**
   * Generate utility types
   */
  private generateUtilityTypes(schema: JSONSchema): string {
    let content = `// Utility types\n`;

    // Extract enum types
    const enumTypes = this.extractEnumTypes(schema);
    for (const [enumName, enumValues] of Object.entries(enumTypes)) {
      content += `export type ${enumName} = ${enumValues.map(v => `'${v}'`).join(' | ')};\n`;
    }

    content += `\n// Character limit keys\n`;
    content += `export type CharacterLimit = '100' | '300' | '500' | '1000' | '2000' | '3000' | '4000' | 'minimum' | 'origin';\n\n`;

    // Generation result types
    content += `// Generation and validation types\n`;
    content += `export interface ValidationResult {\n`;
    content += `  valid: boolean;\n`;
    content += `  errors: string[];\n`;
    content += `}\n\n`;

    content += `export interface PriorityGenerationOptions {\n`;
    content += `  documentId?: string;\n`;
    content += `  sourcePath?: string;\n`;
    content += `  language: string;\n`;
    content += `  category?: DocumentCategory;\n`;
    content += `  priorityScore?: number;\n`;
    content += `  priorityTier?: PriorityTier;\n`;
    content += `  strategy?: ExtractionStrategy;\n`;
    content += `  overwrite?: boolean;\n`;
    content += `}\n\n`;

    return content;
  }

  /**
   * Extract enum types from schema
   */
  private extractEnumTypes(schema: JSONSchema): Record<string, string[]> {
    const enumTypes: Record<string, string[]> = {};

    const extractEnums = (obj: any, prefix: string = '') => {
      if (obj && typeof obj === 'object') {
        if (obj.enum && Array.isArray(obj.enum)) {
          const enumName = prefix || 'UnknownEnum';
          enumTypes[enumName] = obj.enum;
        }

        if (obj.properties) {
          for (const [key, value] of Object.entries(obj.properties)) {
            const enumName = this.toPascalCase(key);
            if (typeof value === 'object' && value) {
              extractEnums(value, enumName);
            }
          }
        }

        if (obj.definitions) {
          for (const [key, value] of Object.entries(obj.definitions)) {
            const enumName = this.toPascalCase(key);
            extractEnums(value, enumName);
          }
        }
      }
    };

    // Extract specific known enums
    if (schema.properties?.document?.properties?.category?.enum) {
      enumTypes['DocumentCategory'] = schema.properties.document.properties.category.enum;
    }

    if (schema.properties?.priority?.properties?.tier?.enum) {
      enumTypes['PriorityTier'] = schema.properties.priority.properties.tier.enum;
    }

    if (schema.properties?.extraction?.properties?.strategy?.enum) {
      enumTypes['ExtractionStrategy'] = schema.properties.extraction.properties.strategy.enum;
    }

    if (schema.properties?.purpose?.properties?.target_audience?.items?.enum) {
      enumTypes['TargetAudience'] = schema.properties.purpose.properties.target_audience.items.enum;
    }

    return enumTypes;
  }

  /**
   * Get TypeScript type from JSON schema property
   */
  private getTypeScriptType(propSchema: JSONSchemaProperty): string {
    if (propSchema.$ref) {
      // Handle references
      const refName = propSchema.$ref.split('/').pop();
      return refName ? this.toPascalCase(refName) : 'any';
    }

    if (propSchema.enum) {
      // Handle enums
      return propSchema.enum.map(v => `'${v}'`).join(' | ');
    }

    if (Array.isArray(propSchema.type)) {
      // Handle union types
      return propSchema.type.map(t => this.mapJsonTypeToTs(t)).join(' | ');
    }

    const type = propSchema.type;

    switch (type) {
      case 'string':
        if (propSchema.format === 'date') return 'string'; // Date strings
        return 'string';
      
      case 'number':
      case 'integer':
        return 'number';
      
      case 'boolean':
        return 'boolean';
      
      case 'array':
        if (propSchema.items) {
          const itemType = this.getTypeScriptType(propSchema.items);
          return `${itemType}[]`;
        }
        return 'any[]';
      
      case 'object':
        if (propSchema.properties) {
          // Generate inline interface
          const properties = propSchema.properties;
          const required = propSchema.required || [];
          let objectType = '{\n';
          
          for (const [propName, nestedPropSchema] of Object.entries(properties)) {
            const isOptional = !required.includes(propName);
            const propType = this.getTypeScriptType(nestedPropSchema);
            const description = nestedPropSchema.description ? `    /** ${nestedPropSchema.description} */\n` : '';
            
            objectType += description;
            objectType += `    ${propName}${isOptional ? '?' : ''}: ${propType};\n`;
          }
          
          objectType += '  }';
          return objectType;
        }
        return 'Record<string, any>';
      
      default:
        return 'any';
    }
  }

  /**
   * Map JSON schema type to TypeScript type
   */
  private mapJsonTypeToTs(type: string): string {
    switch (type) {
      case 'string': return 'string';
      case 'number': case 'integer': return 'number';
      case 'boolean': return 'boolean';
      case 'array': return 'any[]';
      case 'object': return 'Record<string, any>';
      case 'null': return 'null';
      default: return 'any';
    }
  }

  /**
   * Generate validators using ajv
   */
  private async generateValidators(
    schema: JSONSchema,
    outputDir: string,
    language: string,
    format: string,
    overwrite?: boolean
  ): Promise<string | null> {
    const ext = language === 'typescript' ? '.ts' : '.js';
    const validatorPath = path.join(outputDir, `priority-validator${ext}`);

    if (existsSync(validatorPath) && !overwrite) {
      console.log(`⏭️  Skipping validator generation (already exists): ${validatorPath}`);
      return null;
    }

    const validatorContent = this.generateValidatorContent(schema, language, format);
    await writeFile(validatorPath, validatorContent, 'utf-8');

    return validatorPath;
  }

  /**
   * Generate validator content
   */
  private generateValidatorContent(schema: JSONSchema, language: string, format: string): string {
    const isTS = language === 'typescript';
    const imports = format === 'esm' 
      ? `import Ajv from 'ajv';\nimport addFormats from 'ajv-formats';`
      : `const Ajv = require('ajv');\nconst addFormats = require('ajv-formats');`;

    const typeImports = isTS ? `${format === 'esm' ? "import type { PriorityMetadata, ValidationResult } from './priority-types.js';" : "import { PriorityMetadata, ValidationResult } from './priority-types';"}\n` : '';

    return `/**
 * Priority validator generated from priority-schema-enhanced.json
 * Generated on: ${new Date().toISOString()}
 */

${imports}
${typeImports}

const schema = ${JSON.stringify(schema, null, 2)};

// Initialize Ajv
const ajv = new Ajv({
  allErrors: true,
  verbose: true,
  strict: false
});

// Add format support
addFormats(ajv);

// Compile schema
const validate = ajv.compile(schema);

${isTS ? `
export function validatePriority(data: any): ValidationResult {
  const valid = validate(data);
  
  return {
    valid,
    errors: validate.errors ? validate.errors.map(err => \`\${err.instancePath} \${err.message}\`) : []
  };
}

export function validatePrioritySync(data: any): data is PriorityMetadata {
  return validate(data);
}
` : `
function validatePriority(data) {
  const valid = validate(data);
  
  return {
    valid,
    errors: validate.errors ? validate.errors.map(err => \`\${err.instancePath} \${err.message}\`) : []
  };
}

function validatePrioritySync(data) {
  return validate(data);
}
`}

${format === 'esm' ? `
export { schema, ajv, validate };
export default validatePriority;
` : `
module.exports = {
  validatePriority,
  validatePrioritySync,
  schema,
  ajv,
  validate
};
`}
`;
  }

  /**
   * Convert string to PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .split(/[-_\s]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  /**
   * Get schema information
   */
  async getSchemaInfo(): Promise<{
    exists: boolean;
    path: string;
    title?: string;
    description?: string;
    version?: string;
    properties: string[];
    definitions: string[];
  }> {
    const info = {
      exists: existsSync(this.schemaPath),
      path: this.schemaPath,
      properties: [] as string[],
      definitions: [] as string[]
    };

    if (info.exists) {
      try {
        const schema = await this.loadSchema();
        return {
          ...info,
          title: schema.title,
          description: schema.description,
          version: schema.$id,
          properties: Object.keys(schema.properties || {}),
          definitions: Object.keys(schema.definitions || {})
        };
      } catch (error) {
        // Schema file exists but is invalid
      }
    }

    return info;
  }
}