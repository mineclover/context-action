# LLMS Generator CLI Command Reference

Complete command reference for the LLMS Generator CLI system with multilingual document processing capabilities.

## 🎯 Quick Overview (30 seconds)

**What is LLMS Generator?** A system that automatically summarizes long documents into 7 different lengths (100-5000 characters)

**How it works:**
```
docs/en/concept/pattern-guide.md (source)
        ↓ auto-convert ↓
llmsData/en/concept--pattern-guide/
├── priority.json                          # metadata
├── concept--pattern-guide-100.md          # 100 char summary
├── concept--pattern-guide-500.md          # 500 char summary
└── concept--pattern-guide-2000.md         # 2000 char summary
```

**Most used commands:**
```bash
# 1. Process documents after changes
pnpm llms:sync-docs --changed-files docs/en/guide/mydoc.md

# 2. Find next work document  
pnpm llms:work-next

# 3. Check system health
pnpm llms:priority-health
```

---

## Core Commands

### Document Processing

#### `sync-docs`

Automatically processes changed document files and generates templates with priority metadata.

```bash
# Basic usage
pnpm llms:sync-docs --changed-files docs/en/guide/example.md

# Language-specific processing
pnpm llms:sync-docs:ko --changed-files docs/ko/guide/example.md
pnpm llms:sync-docs:en --changed-files docs/en/guide/example.md

# Advanced language filtering
node cli.js sync-docs --languages ko,en --changed-files files...
node cli.js sync-docs --only-korean --changed-files files...
node cli.js sync-docs --no-korean --changed-files files...

# Preview mode
pnpm llms:sync-docs:dry --changed-files files...
```

**Options:**
- `--changed-files <files>`: Comma-separated list of changed markdown files
- `--only-korean`: Process only Korean documents 🇰🇷
- `--only-english`: Process only English documents 🇺🇸
- `--languages <langs>`: Comma-separated specific languages to process
- `--include-korean` / `--no-korean`: Control Korean document processing
- `--dry-run`: Preview changes without modification
- `--force`: Force update even with minimal changes
- `--quiet`: Suppress detailed output

#### `generate-templates`

Generate character-limited templates for existing documents.

```bash
pnpm llms:generate-templates [options]
```

**Options:**
- `-l, --language <lang>`: Target language (en, ko)
- `--category <category>`: Specific document category
- `--character-limits <limits>`: Comma-separated character limits
- `--overwrite`: Overwrite existing templates
- `--dry-run`: Preview without creating files
- `-v, --verbose`: Detailed output

### Priority Management

#### `priority-stats`

Display comprehensive priority distribution statistics.

```bash
pnpm llms:priority-stats [--quiet]
```

**Output includes:**
- Total document count and average priority score
- Distribution by priority tiers (high, medium, low)
- Category-wise priority analysis
- Language-specific statistics

#### `priority-health`

Comprehensive priority consistency and health check with 0-100 scoring.

```bash
pnpm llms:priority-health [--quiet]
```

**Health indicators:**
- ✅ Excellent (90-100): Well-structured priority system
- 🟢 Good (70-89): Minor inconsistencies exist
- 🟡 Fair (50-69): Several issues need attention
- 🟠 Poor (30-49): Significant problems require fixing
- 🔴 Critical (0-29): Priority system needs major overhaul

#### `priority-tasks`

Manage priority.json files (missing, outdated, invalid) with automatic fixes.

```bash
pnpm llms:priority-tasks [options]
```

**Options:**
- `-l, --language <lang>`: Filter by language
- `--category <category>`: Filter by document category  
- `--task-type <type>`: Filter by task type
- `-n, --limit <number>`: Limit number of results
- `-v, --verbose`: Show detailed information
- `--fix`: Automatically fix detected issues
- `--dry-run`: Preview changes without modification

**Task Types:**
- 🔴 **missing**: priority.json files are missing
- ❌ **invalid**: JSON syntax errors or missing required fields  
- 🟡 **outdated**: Source documents modified after priority.json
- 🟠 **needs_review**: Priority scores don't align with category standards
- 🔵 **needs_update**: Metadata is incomplete or needs enhancement

**Examples:**
```bash
# Check all priority.json issues
pnpm llms:priority-tasks

# Show detailed info for top 5 issues
pnpm llms:priority-tasks --limit 5 --verbose

# Fix missing priority.json files
pnpm llms:priority-tasks --task-type missing --fix

# Preview what would be fixed
pnpm llms:priority-tasks --fix --dry-run

# Check only Korean documents
pnpm llms:priority-tasks --language ko --verbose
```

#### Additional Priority Commands

- `priority-stats`: Display priority distribution statistics
- `priority-health`: Check priority consistency and health (0-100 score)
- `priority-suggest`: Provide improvement recommendations
- `priority-auto`: Auto-recalculate priorities with custom criteria

### Source Code Documentation

#### `code-mode` 🆕

Generate complete source code documentation for LLM understanding. Comments are stripped and type definitions are prioritized.

```bash
# Basic usage (core, react packages)
pnpm llms:code-mode

# Specific packages only
pnpm llms:code-mode core
pnpm llms:code-mode react

# Custom paths
pnpm llms:code-mode ./example/src
pnpm llms:code-mode ./packages/llms-generator/src

# Multiple targets
pnpm llms:code-mode core ./custom/path

# Specify file extensions
pnpm llms:code-mode --extensions=js,jsx,ts,tsx

# Preview mode
pnpm llms:code-mode --dry-run

# All options
pnpm llms:code-mode core ./src --extensions=ts,tsx --keep-comments --include-tests
```

**Options:**
- `targets`: Package names, paths, or files (default: core, react)
- `--extensions=<extensions>`: File extensions to process (default: .ts,.tsx)
- `--keep-comments`: Keep comments (default: strip)
- `--include-tests`: Include test files (default: exclude)
- `--multiple-files`: Output multiple files (default: single file)
- `-q, --quiet`: Quiet mode
- `--dry-run`: Preview mode
- `-f, --force`: Overwrite existing files

**Generated Files:**
```
llmsData/code/
├── core-complete.md         # Complete Core package code (~43KB)
├── core-metadata.json       # Core package statistics
├── react-complete.md        # Complete React package code (~113KB)
└── react-metadata.json      # React package statistics
```

**Features:**
- **Comment Stripping**: Automatically removes all comments, JSDoc, and empty lines
- **Type-First Organization**: types.ts files are placed before implementation code
- **Single File Output**: Each package combined into one markdown file
- **Test Exclusion**: Automatically excludes `*.test.*`, `*.spec.*`, `__tests__/` directories
- **Metadata Generation**: Creates JSON files with file statistics and structure info

## Advanced Features

### Language Processing Matrix

| Command | Korean Support | English Support | Multi-language | Filtering |
|---------|----------------|-----------------|----------------|-----------|
| `sync-docs` | ✅ | ✅ | ✅ | ✅ |
| `generate-templates` | ✅ | ✅ | ✅ | ✅ |
| `priority-*` | ✅ | ✅ | ✅ | ❌ |
| `work-next` | ✅ | ✅ | ❌ | ✅ |
| `code-mode` | N/A | N/A | N/A | 🎯 |

> `code-mode` processes source code, which is a different concept from language-specific document processing.

### Automation Workflows

#### Post-commit Hook

The LLMS Generator automatically processes documentation changes via a post-commit hook:

1. **Detection**: Automatically detects changes in `docs/(en|ko)/**/*.md` files
2. **Processing**: Generates 7 character-limited templates (100, 200, 300, 500, 1000, 2000, 5000 chars)
3. **Metadata**: Creates `priority.json` with title extraction, language detection, and tag generation
4. **Commit**: Creates separate commits for LLMS files to maintain clean history
5. **Language Support**: Full English and Korean processing with intelligent language detection

#### Continuous Integration

```bash
# CI/CD Pipeline Integration
pnpm llms:priority-health        # Check system health
pnpm llms:priority-tasks --check # Validate all priority files
pnpm llms:generate-templates     # Generate missing templates
```

## Examples & Workflows

### Complete Setup Workflow

```bash
# 1. Initialize system
pnpm llms:init

# 2. Check system health
pnpm llms:priority-health
pnpm llms:priority-tasks --verbose

# 3. Generate templates
pnpm llms:generate-templates

# 4. Find next work
pnpm llms:work-next --limit 10

# 5. Generate code documentation
pnpm llms:code-mode

# 6. Validate everything
pnpm llms:detect-mismatches
```

### Document Update Workflow

```bash
# After editing docs/en/guide/example.md
pnpm llms:sync-docs --changed-files docs/en/guide/example.md

# Check if priority needs updating
pnpm llms:priority-tasks --language en --verbose

# Generate templates if needed
pnpm llms:generate-templates --language en
```

### Code Documentation Workflow

```bash
# Generate complete code documentation
pnpm llms:code-mode

# For specific development areas
pnpm llms:code-mode ./src/components --extensions=js,jsx,ts,tsx

# Preview before generating
pnpm llms:code-mode ./packages/custom --dry-run
```

## Troubleshooting

### Common Issues

1. **Priority.json errors**: Use `pnpm llms:priority-tasks --fix`
2. **Missing templates**: Use `pnpm llms:generate-templates --overwrite`
3. **Language detection issues**: Use specific language flags like `--only-english`
4. **Code-mode path issues**: Use absolute paths or check file extensions

### Performance Optimization

- Use `--quiet` flag for CI/CD pipelines
- Use `--dry-run` to preview large operations
- Use specific language filters to reduce processing time
- Use `--limit` with priority commands for faster results

---

For comprehensive implementation details, advanced workflows, and architectural specifics, refer to the **[Comprehensive Implementation Reference](./llms-cli-comprehensive-reference.md)**.