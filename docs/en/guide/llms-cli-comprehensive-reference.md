# LLMS Generator CLI - Comprehensive Implementation Reference

Complete documentation for all implemented CLI commands and features in the LLMS Generator system.

## Overview

The LLMS Generator CLI provides a comprehensive toolkit for managing multilingual documentation, priority systems, and automated template generation. This document covers all implemented features, commands, and workflows.

## Architecture

### Core Components
- **Command Router**: Central command dispatch system (`/src/cli/index.ts`)
- **Command Implementations**: Individual command classes in `/src/cli/commands/`
- **Configuration Management**: Enhanced config system with `EnhancedLLMSConfig`
- **Help System**: Interactive help display (`HelpDisplay.ts`)
- **Error Handling**: Centralized error management (`ErrorHandler.ts`)
- **Argument Parsing**: Unified argument processing (`ArgumentParser.ts`)

### Implementation Statistics
- **Total Commands**: 13 core commands
- **NPM Scripts**: 25+ convenience scripts
- **Supported Languages**: English, Korean
- **File Processing**: Markdown → Priority JSON → Templates → LLMS
- **Code Reduction**: Optimized from ~2000 lines to ~200 lines core implementation

## Complete Command Reference

### Project Initialization

#### `init` - Complete Project Setup
Initialize LLMS Generator in a new project with full discovery and setup.

**Implementation**: `InitCommand.ts`
**NPM Script**: `pnpm llms:init`

```bash
# Complete initialization
pnpm llms:init

# Preview what will be created
pnpm llms:init --dry-run

# Force overwrite existing files
pnpm llms:init --overwrite

# Skip specific steps
pnpm llms:init --skip-priority --skip-templates

# Set default language
pnpm llms:init --language ko
```

**Options:**
- `--dry-run`: Preview initialization without making changes
- `--overwrite`: Overwrite existing configuration and priority files
- `--quiet`: Suppress detailed output
- `--skip-priority`: Skip priority.json file generation
- `--skip-templates`: Skip template file generation
- `-l, --language <lang>`: Set default language (en, ko)

**Process Steps:**
1. **Document Discovery**: Scans `docs/` directory for all `.md` files
2. **Priority Generation**: Creates `priority.json` files with metadata analysis
3. **Template Creation**: Generates template files for all character limits
4. **Configuration Setup**: Creates or updates `llms-generator.config.json`

**Output Example:**
```
🚀 LLMS Generator Initialization

📚 Step 1: Document Discovery
   Found 24 English documents
   Found 18 Korean documents

📊 Step 2: Priority Generation  
   ✅ Created: 42 priority.json files
   ⚠️ Skipped: 0 existing files

📝 Step 3: Template Creation
   ✅ Templates Created: 294
   ⏭️ Templates Skipped: 0

✅ Initialization complete!
```

### Workflow Management

#### `work-next` - Priority-Based Work Queue
Find next documentation item to work on, or display top N priority documents.

**Implementation**: `WorkNextCommand.ts`
**NPM Scripts**: 
- `pnpm llms:work-next`
- `pnpm llms:work-top10`
- `pnpm llms:work-top20`

```bash
# Next single work item
pnpm llms:work-next

# Top 10 priority documents  
pnpm llms:work-next --limit 10
pnpm llms:work-top10

# Filter by language and category
pnpm llms:work-next --language ko --category guide --verbose

# Show completed items
pnpm llms:work-next --show-completed --sort-by category

# Filter by character limit
pnpm llms:work-next --character-limit 300 --top 5
```

**Options:**
- `-l, --language <lang>`: Filter by language (en, ko)
- `--show-completed`: Include completed items in results
- `-v, --verbose`: Show detailed information including priority scores
- `-n, --limit <number>` / `--top <number>`: Show top N priority documents
- `--sort-by <field>`: Sort by priority (default), category, status, modified
- `--category <cat>`: Filter by specific category
- `-c, --character-limit <num>`: Filter by character limit

**Output Format:**
```
🎯 Top 10 Priority Documents

📄 1. Context Store Pattern [Priority: 98] 
   📁 Category: concept | 🌐 Language: en
   📝 Status: needs_content | 🔢 Character Limits: 100,300,500,1000,2000,5000
   📅 Modified: 2024-01-15 | 📊 Completion: 45%

📄 2. Action Pipeline System [Priority: 95]
   📁 Category: concept | 🌐 Language: ko  
   📝 Status: in_progress | 🔢 Character Limits: 300,1000,5000
   📅 Modified: 2024-01-12 | 📊 Completion: 78%
```

### Priority Management System

#### `priority-stats` - Priority Distribution Analysis
Display comprehensive priority distribution statistics across all documents.

**Implementation**: `PriorityManagerCommand.ts`
**NPM Script**: `pnpm priority`

```bash
# Full statistics
pnpm llms:priority-stats

# Quiet mode for scripting
pnpm llms:priority-stats --quiet
```

**Output Includes:**
- Total document count and average priority score
- Distribution by priority tier (Critical: 90-100, High: 75-89, Medium: 50-74, Low: 0-49)
- Breakdown by category and language
- Statistical measures (range, standard deviation, quartiles)
- Health indicators and trending analysis

**Sample Output:**
```
📊 Priority Distribution Statistics

📈 Overall Metrics:
   Total Documents: 42
   Average Priority: 73.5
   Standard Deviation: 18.2
   Range: 45-98

🎯 Priority Tiers:
   🔴 Critical (90-100): 8 documents (19%)
   🟠 High (75-89): 15 documents (36%) 
   🟡 Medium (50-74): 14 documents (33%)
   🔵 Low (0-49): 5 documents (12%)

📁 By Category:
   concept: avg 85.3 (12 docs)
   guide: avg 78.1 (18 docs)
   api: avg 68.9 (12 docs)

🌐 By Language:
   en: avg 75.2 (24 docs)
   ko: avg 71.1 (18 docs)
```

#### `priority-health` - Priority System Health Check
Evaluate priority consistency and identify systemic issues.

**Implementation**: `PriorityManagerCommand.ts`
**NPM Script**: `pnpm llms:priority-health`

```bash
# Health assessment
pnpm llms:priority-health

# Quiet mode
pnpm llms:priority-health --quiet
```

**Health Scoring System:**
- **Excellent (85-100)**: Well-balanced, consistent priorities
- **Good (70-84)**: Minor inconsistencies, easily addressed  
- **Fair (50-69)**: Noticeable issues requiring attention
- **Poor (0-49)**: Significant problems needing immediate action

**Assessment Factors:**
- Priority distribution balance
- Category consistency
- Language parity
- Outlier detection
- Temporal consistency
- Content-priority alignment

#### `priority-suggest` - Intelligent Recommendations
Provide actionable recommendations for priority system improvement.

**Implementation**: `PriorityManagerCommand.ts`
**NPM Script**: `pnpm llms:priority-suggest`

```bash
# System-wide suggestions
pnpm llms:priority-suggest

# Document-specific suggestions
pnpm llms:priority-suggest --document-id "en/concept/action-pipeline"

# Quiet mode for automation
pnpm llms:priority-suggest --quiet
```

**Suggestion Categories:**
- Priority rebalancing recommendations
- Content gap identification
- Category standardization suggestions
- Language parity improvements
- Template completion priorities

#### `priority-auto` - Automated Priority Recalculation
Automatically recalculate priorities based on configurable criteria.

**Implementation**: `PriorityManagerCommand.ts`
**NPM Script**: `pnpm llms:priority-auto`

```bash
# Auto-recalculate with defaults
pnpm llms:priority-auto

# Force recalculation even for recent files
pnpm llms:priority-auto --force

# Use custom criteria file
pnpm llms:priority-auto --criteria custom-criteria.json

# Quiet mode
pnpm llms:priority-auto --quiet
```

**Default Criteria Weights:**
- Document size: 40%
- Category importance: 30%
- Keyword density: 20%
- Relationship complexity: 10%

#### `priority-tasks` - Priority File Management
Manage and analyze priority.json files themselves - find missing, outdated, or invalid priority files.

**Implementation**: `PriorityTasksCommand.ts`
**NPM Scripts**: 
- `pnpm llms:priority-tasks`
- `pnpm llms:priority-tasks:fix`

```bash
# Scan for all priority.json issues
pnpm llms:priority-tasks

# Show detailed information
pnpm llms:priority-tasks --verbose --limit 10

# Fix specific issue types
pnpm llms:priority-tasks --task-type missing --fix
pnpm llms:priority-tasks --task-type outdated --fix

# Preview fixes without applying
pnpm llms:priority-tasks --fix --dry-run

# Filter by language or category
pnpm llms:priority-tasks --language ko --category guide
```

**Task Types:**
- 🔴 **missing**: priority.json files are missing for documents
- ❌ **invalid**: JSON syntax errors or missing required fields
- 🟡 **outdated**: source documents modified after priority.json
- 🟠 **needs_review**: priority scores don't align with category standards  
- 🔵 **needs_update**: metadata is incomplete or needs enhancement

**Options:**
- `-l, --language <lang>`: Filter by language
- `--category <cat>`: Filter by category
- `--task-type <type>`: Filter by specific task type
- `-n, --limit <num>`: Limit number of results
- `-v, --verbose`: Show detailed information
- `--fix`: Automatically fix detected issues
- `--dry-run`: Preview changes without making them

**Auto-Fix Capabilities:**
- **Missing Files**: Generate priority.json with calculated scores
- **Invalid JSON**: Fix syntax errors, add missing required fields
- **Outdated Files**: Update timestamps and metadata
- **Review Issues**: Suggest priority score adjustments
- **Update Tasks**: Enhance metadata completeness

### Document Processing

#### `sync-docs` - Documentation Synchronization
Automatically process changed documentation files and generate templates with priority metadata.

**Implementation**: `SyncDocsCommand.ts`
**NPM Scripts**: 
- `pnpm llms:sync-docs`
- `pnpm llms:sync-docs:ko`
- `pnpm llms:sync-docs:en`  
- `pnpm llms:sync-docs:dry`

```bash
# Basic synchronization
pnpm llms:sync-docs --changed-files docs/en/guide/example.md

# Language-specific processing
pnpm llms:sync-docs:ko --changed-files docs/ko/guide/example.md
pnpm llms:sync-docs:en --changed-files docs/en/guide/example.md

# Multiple files
pnpm llms:sync-docs --changed-files "docs/en/guide/example.md,docs/ko/concept/overview.md"

# Advanced language filtering
node cli.js sync-docs --languages ko,en --changed-files files...
node cli.js sync-docs --only-korean --changed-files files...
node cli.js sync-docs --no-korean --changed-files files...

# Dry run preview
pnpm llms:sync-docs:dry --changed-files files...

# Force processing minimal changes
pnpm llms:sync-docs --force --changed-files files...
```

**Options:**
- `--changed-files <files>`: Comma-separated list of changed markdown files
- `--only-korean`: Process Korean documents only 🇰🇷
- `--only-english`: Process English documents only 🇺🇸
- `--languages <langs>`: Process specific comma-separated languages
- `--include-korean` / `--no-korean`: Control Korean document processing
- `--dry-run`: Preview changes without making modifications
- `--force`: Force update even if minimal changes detected
- `--quiet`: Suppress detailed output for automation

**Processing Workflow:**
1. **File Analysis**: Detect language from file path pattern
2. **Change Detection**: Compare with existing priority.json timestamps
3. **Priority Calculation**: Analyze content for priority scoring
4. **Template Generation**: Create character-limited templates
5. **Metadata Update**: Update priority.json with new information

#### `generate-templates` - Template Creation System
Generate character-limited templates for existing documentation.

**Implementation**: `GenerateTemplatesCommand.ts`
**NPM Script**: `pnpm llms:generate-templates`

```bash
# Generate all templates
pnpm llms:generate-templates

# Language-specific generation
pnpm llms:generate-templates --language ko

# Category filtering
pnpm llms:generate-templates --category guide --verbose

# Custom character limits
pnpm llms:generate-templates --character-limits 100,300,500,1000

# Overwrite existing templates
pnpm llms:generate-templates --overwrite

# Preview generation
pnpm llms:generate-templates --dry-run
```

**Options:**
- `-l, --language <lang>`: Target language (en, ko)
- `--category <category>`: Specific document category
- `--character-limits <limits>`: Comma-separated character limits
- `--overwrite`: Overwrite existing templates
- `--dry-run`: Preview without creating files
- `-v, --verbose`: Detailed output with file paths

**Template Types:**
- **Standard Templates**: 100, 200, 300, 500, 1000, 2000, 5000 character limits
- **Custom Limits**: User-configurable character limits
- **Content Preservation**: Maintains source formatting and structure
- **Metadata Integration**: Includes priority and category information

### LLMS Generation

#### `llms-generate` - Standard LLMS File Generation
Generate standard LLMS files with metadata for training purposes.

**Implementation**: `LLMSGenerateCommand.ts`
**NPM Script**: `pnpm llms:generate`

```bash
# Generate all LLMS files
pnpm llms:generate

# Character-limited generation
pnpm llms:generate --character-limit 300

# Language and category filtering
pnpm llms:generate --language ko --category guide

# Different patterns
pnpm llms:generate --pattern standard  # Default
pnpm llms:generate --pattern minimum   # Minimal metadata
pnpm llms:generate --pattern origin    # Original format

# Preview generation
pnpm llms:generate --dry-run --verbose
```

**Options:**
- `-c, --character-limit <num>`: Specific character limit
- `--category <cat>`: Filter by document category
- `-l, --language <lang>`: Target language (en, ko)
- `-p, --pattern <type>`: Generation pattern (standard, minimum, origin)
- `--dry-run`: Preview without creating files
- `-v, --verbose`: Detailed output

#### `clean-llms-generate` - Clean LLMS Generation
Generate clean LLMS files without metadata for direct LLM training.

**Implementation**: `clean-llms-generate.ts`
**NPM Script**: `pnpm llms:clean`

```bash
# Clean generation with character limit
pnpm llms:clean 300 --language ko

# Pattern-based generation
pnpm llms:clean --pattern clean     # No metadata
pnpm llms:clean --pattern minimal   # Minimal structure
pnpm llms:clean --pattern raw       # Raw content only

# Category-specific generation
pnpm llms:clean --category guide --pattern clean

# Preview mode
pnpm llms:clean 100 --pattern raw --dry-run
```

**Patterns:**
- **clean**: No metadata, structured content only
- **minimal**: Minimal structure preservation
- **raw**: Raw content extraction only

### Advanced Commands

#### `priority-sync` - Priority Synchronization
Synchronize priority data across different systems (implementation varies).

**Implementation**: `PriorityManagerCommand.ts`
**NPM Script**: `pnpm llms:priority-sync`

```bash
# Sync priority data
pnpm llms:priority-sync

# Specify sync server
pnpm llms:priority-sync --server production

# Quiet mode
pnpm llms:priority-sync --quiet
```

## NPM Scripts Reference

### Core Workflow Scripts
```bash
# Project setup
pnpm llms:init                    # Complete initialization

# Priority management
pnpm priority                     # Priority statistics (alias)
pnpm llms:priority-stats         # Full priority statistics
pnpm llms:priority-health        # Health assessment  
pnpm llms:priority-suggest       # Get recommendations
pnpm llms:priority-auto          # Auto-recalculate priorities
pnpm llms:priority-tasks         # Manage priority.json files
pnpm llms:priority-tasks:fix     # Auto-fix priority issues

# Work queue management
pnpm llms:work-next              # Next work item
pnpm llms:work-top10             # Top 10 priorities
pnpm llms:work-top20             # Top 20 priorities

# Document processing
pnpm llms:sync-docs              # Sync all languages
pnpm llms:sync-docs:ko           # Korean documents only
pnpm llms:sync-docs:en           # English documents only
pnpm llms:sync-docs:dry          # Dry run preview

# Template generation
pnpm llms:generate-templates     # Generate all templates

# LLMS file generation
pnpm llms:generate               # Standard LLMS generation
pnpm llms:clean                  # Clean LLMS generation
```

### Legacy/Compatibility Scripts
```bash
# Legacy command support (may be deprecated)
pnpm llms:minimum                # Minimal generation
pnpm llms:origin                 # Original format generation
pnpm llms:chars                  # Character-based processing
pnpm llms:batch                  # Batch processing
pnpm llms:docs                   # Documentation generation
pnpm llms:docs:en                # English docs generation
pnpm llms:docs:ko                # Korean docs generation
pnpm llms:check                  # Work check
pnpm llms:check:outdated         # Check outdated items
```

## Configuration System

### Enhanced Configuration (`llms-generator.config.json`)
```json
{
  "paths": {
    "docsDir": "./docs",
    "llmContentDir": "./llmsData", 
    "outputDir": "./output",
    "templatesDir": "./templates",
    "instructionsDir": "./instructions"
  },
  "generation": {
    "supportedLanguages": ["en", "ko"],
    "characterLimits": [100, 200, 300, 500, 1000, 2000, 5000],
    "defaultLanguage": "en",
    "outputFormat": "txt"
  },
  "categories": {
    "guide": { "priority": 90, "description": "User guides" },
    "concept": { "priority": 85, "description": "Conceptual documentation" },
    "api": { "priority": 80, "description": "API documentation" },
    "examples": { "priority": 75, "description": "Examples and tutorials" }
  },
  "quality": {
    "minContentLength": 100,
    "maxContentLength": 10000,
    "requiredSections": ["introduction", "examples"]
  }
}
```

### Custom Priority Criteria
Create `custom-criteria.json` for automated priority calculation:

```json
{
  "documentSize": { 
    "weight": 0.4, 
    "method": "linear",
    "min": 100,
    "max": 5000
  },
  "category": { 
    "weight": 0.3, 
    "values": { 
      "guide": 95, 
      "concept": 85, 
      "api": 90,
      "examples": 75 
    }
  },
  "keywordDensity": { 
    "weight": 0.2, 
    "method": "logarithmic",
    "keywords": ["action", "store", "context", "component"]
  },
  "relationships": { 
    "weight": 0.1, 
    "method": "network",
    "linkWeight": 5,
    "referenceWeight": 3
  }
}
```

## Integration Workflows

### Post-Commit Hook Integration
Automatic processing when documentation files change:

```bash
#!/bin/sh
# .git/hooks/post-commit

# Detect changed files
CHANGED_FILES=$(git diff --name-only HEAD~1 HEAD | grep "docs/.*\.md$" | tr '\n' ',' | sed 's/,$//')

if [ ! -z "$CHANGED_FILES" ]; then
    echo "📚 Processing documentation changes..."
    pnpm llms:sync-docs --changed-files "$CHANGED_FILES" --quiet
    
    # Commit generated files separately
    git add llmsData/
    git commit -m "📝 Auto-update LLMS files for documentation changes

Generated from: $CHANGED_FILES"
fi
```

### CI/CD Pipeline Integration
```yaml
# .github/workflows/docs-quality.yml
name: Documentation Quality Gates

on:
  pull_request:
    paths: ['docs/**/*.md']

jobs:
  docs-quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Build LLMS Generator
        run: pnpm build:llms-generator
      
      - name: Check Priority Health
        run: pnpm llms:priority-health
      
      - name: Validate Documentation Changes
        run: |
          CHANGED_FILES=$(gh pr diff --name-only | grep "docs/.*\.md$" | tr '\n' ',' | sed 's/,$//')
          if [ ! -z "$CHANGED_FILES" ]; then
            pnpm llms:sync-docs --changed-files "$CHANGED_FILES" --dry-run
          fi
      
      - name: Check Priority Tasks
        run: pnpm llms:priority-tasks --verbose
```

## Error Handling & Debugging

### Common Issues & Solutions

**Language Processing Errors:**
```bash
# Issue: File paths don't match expected pattern
# Solution: Ensure files follow docs/(en|ko)/**/*.md pattern
ls docs/en/guide/example.md  # ✅ Correct
ls guides/en/example.md      # ❌ Wrong pattern

# Issue: Language filtering not working
# Solution: Check language filtering options
pnpm llms:sync-docs --only-korean --changed-files files...  # ✅ Correct
pnpm llms:sync-docs --korean --changed-files files...       # ❌ Wrong option
```

**Priority System Issues:**
```bash
# Issue: Priority inconsistencies
# Solution: Run health check and auto-recalculation
pnpm llms:priority-health
pnpm llms:priority-auto --force

# Issue: Missing priority.json files  
# Solution: Use priority-tasks with fix option
pnpm llms:priority-tasks --task-type missing --fix
```

**Template Generation Failures:**
```bash
# Issue: Insufficient content for character limits
# Solution: Check source document length and quality
pnpm llms:generate-templates --dry-run --verbose

# Issue: Permission errors creating llmsData/
# Solution: Check directory permissions
mkdir -p llmsData
chmod 755 llmsData
```

### Debug Mode Usage
```bash
# Enable verbose output for troubleshooting
node packages/llms-generator/dist/cli/index.js <command> --verbose

# Preview changes without modifications
node packages/llms-generator/dist/cli/index.js sync-docs --dry-run --changed-files files...

# Quiet mode for automation scripts
node packages/llms-generator/dist/cli/index.js <command> --quiet
```

### Performance Monitoring
```bash
# Monitor priority system health over time
pnpm llms:priority-health > health-$(date +%Y%m%d).log

# Track priority task trends
pnpm llms:priority-tasks --verbose > tasks-$(date +%Y%m%d).log

# Benchmark generation performance
time pnpm llms:generate-templates --dry-run
```

## Best Practices

### Daily Workflow
```bash
# 1. Check system health
pnpm llms:priority-health

# 2. Identify high-priority work
pnpm llms:work-top10 --verbose

# 3. Process any changed documents
pnpm llms:sync-docs --changed-files "$(git diff --name-only HEAD~1 | grep 'docs/.*\.md$' | tr '\n' ',')"

# 4. Validate priority tasks
pnpm llms:priority-tasks --limit 5
```

### Weekly Maintenance
```bash
# 1. Full system analysis
pnpm llms:priority-stats

# 2. Health assessment with recommendations
pnpm llms:priority-health
pnpm llms:priority-suggest

# 3. Fix any priority issues
pnpm llms:priority-tasks:fix

# 4. Auto-recalculate if needed
pnpm llms:priority-auto --force
```

### Team Coordination
```bash
# Language-specific workflows
# Korean team member:
pnpm llms:work-next --language ko --top 5
pnpm llms:sync-docs:ko --changed-files docs/ko/guide/new-feature.md

# English team member:
pnpm llms:work-next --language en --category guide --top 5
pnpm llms:sync-docs:en --changed-files docs/en/guide/new-feature.md

# Project manager:
pnpm llms:priority-health
pnpm llms:priority-stats --quiet | tail -5
```

## Implementation Notes

### Code Architecture
- **Modular Command System**: Each command is a separate class with consistent interface
- **Unified Configuration**: Single config system supporting both legacy and enhanced features
- **Error Resilience**: Comprehensive error handling with user-friendly messages
- **Performance Optimized**: Reduced core implementation by 90% while maintaining functionality

### Dependencies
- **Core Dependencies**: Node.js 18+, TypeScript 5+
- **CLI Framework**: Custom implementation with ArgumentParser
- **File Processing**: Native Node.js fs modules with async/await
- **JSON Processing**: Native JSON with validation
- **Language Detection**: Path-based language identification

### Testing Strategy
```bash
# Test individual commands
pnpm llms:priority-stats --dry-run
pnpm llms:work-next --verbose --limit 3

# Test language filtering
pnpm llms:sync-docs:dry --changed-files docs/test/example.md

# Test error handling
pnpm llms:priority-tasks --task-type invalid --dry-run
```

### Migration Notes
- **From Legacy CLI**: All core functionality preserved, simplified interface
- **Configuration Migration**: Enhanced config backward compatible with legacy
- **Script Migration**: NPM scripts maintained for team continuity
- **Data Migration**: Priority.json format unchanged, enhanced metadata optional

---

## Quick Command Reference

| Command | Purpose | Key Options |
|---------|---------|-------------|
| `init` | Project setup | `--dry-run`, `--overwrite`, `--skip-*` |
| `work-next` | Find work items | `--limit`, `--language`, `--category` |
| `priority-stats` | View statistics | `--quiet` |
| `priority-health` | Health check | `--quiet` |
| `priority-suggest` | Get recommendations | `--document-id` |
| `priority-auto` | Auto-recalculate | `--force`, `--criteria` |
| `priority-tasks` | Manage priority files | `--fix`, `--task-type`, `--dry-run` |
| `sync-docs` | Process changes | `--changed-files`, `--only-*`, `--dry-run` |
| `generate-templates` | Create templates | `--language`, `--category`, `--overwrite` |
| `llms-generate` | Generate LLMS | `--character-limit`, `--pattern` |
| `clean-llms-generate` | Clean LLMS | `--pattern`, `--category` |

---

**Next Steps:**
- Set up automated workflows with post-commit hooks
- Configure team-specific language processing
- Establish regular priority health monitoring  
- Integrate with CI/CD pipelines for documentation quality gates

**Important Notes:**
- Always test with `--dry-run` before bulk operations
- Monitor priority health scores after major changes
- Coordinate language processing settings with team members
- Keep LLMS Generator build updated for latest features