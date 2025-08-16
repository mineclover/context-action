# Configuration Examples - LLMS Generator

This document provides examples of different configuration setups for the @context-action/llms-generator package.

## Quick Start

### 1. Initialize Configuration

Initialize with a preset configuration:

```bash
npx @context-action/llms-generator config-init standard
```

Available presets:
- `minimal`: 100, 500 character limits
- `standard`: 100, 300, 1000, 2000 character limits (default)
- `extended`: 50, 100, 300, 500, 1000, 2000, 4000 character limits
- `blog`: 200, 500, 1500 character limits (SEO-optimized)
- `documentation`: 150, 400, 1000 character limits (API-focused)

### 2. View Current Configuration

```bash
npx @context-action/llms-generator config-show
```

### 3. Validate Configuration

```bash
npx @context-action/llms-generator config-validate
```

### 4. View Character Limits

```bash
# Show enabled limits only
npx @context-action/llms-generator config-limits

# Show all limits including disabled
npx @context-action/llms-generator config-limits --all
```

## Configuration Examples

### Basic Configuration (llms-generator.config.json)

```json
{
  "name": "My Project",
  "version": "1.0.0",
  "extraction": {
    "characterLimits": [
      {
        "limit": 100,
        "description": "Tweet-length summary",
        "focus": "Core concept only",
        "enabled": true
      },
      {
        "limit": 500,
        "description": "Brief overview",
        "focus": "Key points with context",
        "enabled": true
      }
    ],
    "languages": ["en", "ko"],
    "defaultStrategy": "concept-first"
  },
  "composition": {
    "defaultCharacterLimit": 5000,
    "defaultPriorityThreshold": 0,
    "includeTableOfContents": true,
    "targetUtilization": 0.95
  },
  "paths": {
    "docsDir": "./docs",
    "dataDir": "./packages/llms-generator/data",
    "outputDir": "./docs/llms"
  }
}
```

### Blog-Optimized Configuration

```json
{
  "name": "Blog Content Generator",
  "extraction": {
    "characterLimits": [
      {
        "limit": 160,
        "description": "Meta description",
        "focus": "SEO-friendly summary for search results",
        "enabled": true
      },
      {
        "limit": 300,
        "description": "Social media teaser",
        "focus": "Engaging hook for social sharing",
        "enabled": true
      },
      {
        "limit": 800,
        "description": "Article preview",
        "focus": "Complete overview for article listing",
        "enabled": true
      }
    ],
    "languages": ["en"],
    "defaultStrategy": "general"
  },
  "composition": {
    "defaultCharacterLimit": 3000,
    "defaultPriorityThreshold": 50,
    "includeTableOfContents": false,
    "targetUtilization": 0.90
  }
}
```

### API Documentation Configuration

```json
{
  "name": "API Documentation",
  "extraction": {
    "characterLimits": [
      {
        "limit": 120,
        "description": "Quick reference",
        "focus": "Function signature and purpose",
        "enabled": true
      },
      {
        "limit": 400,
        "description": "Usage guide",
        "focus": "How to use with basic example",
        "enabled": true
      },
      {
        "limit": 1000,
        "description": "Complete reference",
        "focus": "Full documentation with all parameters",
        "enabled": true
      }
    ],
    "languages": ["en"],
    "defaultStrategy": "api-first"
  },
  "composition": {
    "defaultCharacterLimit": 2000,
    "defaultPriorityThreshold": 0,
    "includeTableOfContents": true,
    "targetUtilization": 0.98
  }
}
```

### Multilingual Configuration

```json
{
  "name": "Multilingual Project",
  "extraction": {
    "characterLimits": [
      {
        "limit": 100,
        "description": "Ultra-short (universal)",
        "focus": "Core concept in any language",
        "enabled": true
      },
      {
        "limit": 250,
        "description": "Short (CJK optimized)",
        "focus": "Main points optimized for Chinese/Japanese/Korean",
        "enabled": true
      },
      {
        "limit": 500,
        "description": "Medium (Latin optimized)",
        "focus": "Detailed points for European languages",
        "enabled": true
      }
    ],
    "languages": ["en", "ko", "ja", "zh", "es", "fr", "de"],
    "defaultStrategy": "concept-first"
  }
}
```

### Conditional Configuration (package.json field)

You can also define configuration in package.json:

```json
{
  "name": "my-project",
  "version": "1.0.0",
  "llms-generator": {
    "extraction": {
      "characterLimits": [
        {"limit": 100, "enabled": true},
        {"limit": 300, "enabled": true}
      ],
      "languages": ["en"]
    }
  }
}
```

### JavaScript Configuration (llms-generator.config.js)

```javascript
export default {
  name: "Dynamic Configuration",
  extraction: {
    characterLimits: [
      {
        limit: 100,
        description: "Tweet length",
        enabled: process.env.NODE_ENV === "production"
      },
      {
        limit: 500,
        description: "Development summary",
        enabled: process.env.NODE_ENV === "development"
      }
    ],
    languages: process.env.LANGUAGES?.split(',') || ["en"]
  }
};
```

## Using Config-Driven Commands

Once configured, all commands will use your configuration defaults:

```bash
# Uses config languages and character limits
npx @context-action/llms-generator batch

# Uses config default language
npx @context-action/llms-generator extract

# Uses config default character limit for composition
npx @context-action/llms-generator compose

# Uses config limits ≥1000 for batch composition
npx @context-action/llms-generator compose-batch
```

You can still override config values with command-line arguments:

```bash
# Override languages
npx @context-action/llms-generator batch --lang=en,fr

# Override character limits
npx @context-action/llms-generator extract --chars=200,400,800

# Override specific settings
npx @context-action/llms-generator compose en 3000 --priority=80
```

## Configuration Discovery

The system searches for configuration files in this order:

1. `llms-generator.config.json`
2. `llms-generator.config.js`
3. `.llms-generator.json`
4. `.llmsgeneratorrc.json`
5. `.llmsgeneratorrc`
6. `llms-generator` field in `package.json`
7. Default configuration

## Validation Rules

- At least one character limit must be defined and enabled
- Character limits must be between 1 and 10,000 characters
- No duplicate character limits allowed
- At least one language must be specified
- Target utilization must be between 0.1 and 1.0
- Priority threshold must be 0 or positive

## Workflow Presets

Configuration can include workflow presets for common task sequences:

```json
{
  "workflows": {
    "presets": {
      "daily-update": {
        "name": "Daily content update",
        "description": "Update all content and check status",
        "commands": [
          {
            "command": "priority-generate",
            "args": {"language": "en", "overwrite": true}
          },
          {
            "command": "extract-all", 
            "args": {"languages": ["en"], "overwrite": true}
          },
          {
            "command": "work-status",
            "args": {"language": "en"}
          }
        ]
      }
    }
  }
}
```

This enables future workflow automation features where you can execute entire preset workflows with a single command.