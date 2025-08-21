# LLMS Generator CLI Reference

Complete command reference for the LLMS Generator CLI system with multilingual document processing capabilities.

## Core Commands

### Document Processing

#### `sync-docs`

Automatically process changed documentation files and generate templates with priority metadata.

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

# Dry run preview
pnpm llms:sync-docs:dry --changed-files files...
```

**Options:**
- `--changed-files <files>`: Comma-separated list of changed markdown files
- `--only-korean`: Process Korean documents only 🇰🇷
- `--only-english`: Process English documents only 🇺🇸
- `--languages <langs>`: Process specific comma-separated languages
- `--include-korean` / `--no-korean`: Control Korean document processing
- `--dry-run`: Preview changes without making modifications
- `--force`: Force update even if minimal changes
- `--quiet`: Suppress detailed output

#### `generate-templates`

Generate character-limited templates for existing documentation.

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
- Distribution by priority tier (critical, high, medium, low)
- Breakdown by category and language
- Statistical measures (range, standard deviation)

#### `priority-health`

Evaluate priority consistency and identify issues.

```bash
pnpm llms:priority-health [--quiet]
```

**Health Scoring:**
- **Excellent (85-100)**: Well-balanced, consistent priorities
- **Good (70-84)**: Minor inconsistencies, easily addressed
- **Fair (50-69)**: Noticeable issues requiring attention
- **Poor (0-49)**: Significant problems needing immediate action

#### `priority-suggest`

Provide actionable recommendations based on current state.

```bash
pnpm llms:priority-suggest [--document-id <id>] [--quiet]
```

#### `priority-auto`

Automatically recalculate priorities based on defined criteria.

```bash
pnpm llms:priority-auto [--criteria <file>] [--force] [--quiet]
```

### Project Management

#### `init`

Initialize LLMS Generator in a new project.

```bash
pnpm llms:init [options]
```

**Options:**
- `--dry-run`: Preview initialization without making changes
- `--overwrite`: Overwrite existing configuration
- `--quiet`: Suppress output
- `--skip-priority`: Skip priority file generation
- `--skip-templates`: Skip template generation
- `-l, --language <lang>`: Set default language

#### `work-next`

Find the next documentation item to work on based on priorities.

```bash
pnpm llms:work-next [options]
```

**Options:**
- `-l, --language <lang>`: Filter by language
- `--show-completed`: Include completed items
- `-v, --verbose`: Show detailed information

## Advanced Features

### Language Processing Matrix

| Command | Korean Support | English Support | Multi-language | Filtering |
|---------|----------------|-----------------|----------------|-----------|
| `sync-docs` | ✅ | ✅ | ✅ | ✅ |
| `generate-templates` | ✅ | ✅ | ✅ | ✅ |
| `priority-*` | ✅ | ✅ | ✅ | ❌ |
| `work-next` | ✅ | ✅ | ❌ | ✅ |

### Automated Workflows

#### Post-commit Hook

Automatically triggered when documentation files change:

```bash
# Automatic detection and processing
docs/en/guide/example.md → llmsData/en/guide/example-*.md + priority.json
docs/ko/guide/example.md → llmsData/ko/guide/example-*.md + priority.json
```

**Features:**
- Detects changes in `docs/(en|ko)/**/*.md`
- Generates 7 character-limited templates (100, 200, 300, 500, 1000, 2000, 5000)
- Creates priority.json with metadata
- Commits LLMS files separately from source changes
- Enhanced debugging and error handling

#### NPM Scripts

```bash
# Document processing
pnpm llms:sync-docs              # Process all languages
pnpm llms:sync-docs:ko           # Korean only
pnpm llms:sync-docs:en           # English only
pnpm llms:sync-docs:dry          # Preview mode

# Priority management
pnpm llms:priority-stats         # Statistics
pnpm llms:priority-health        # Health check
pnpm llms:priority-auto          # Auto-calculate
pnpm llms:priority-suggest       # Recommendations

# Template generation
pnpm llms:generate-templates     # Generate all templates
pnpm llms:init                   # Initialize project

# Utilities
pnpm llms:work-next             # Find next work item
```

## Configuration

### Environment Configuration

The system respects configuration files for customized behavior:

```json
{
  "paths": {
    "llmContentDir": "./llmsData",
    "docsDir": "./docs"
  },
  "generation": {
    "supportedLanguages": ["en", "ko"],
    "characterLimits": [100, 200, 300, 500, 1000, 2000, 5000],
    "defaultLanguage": "en"
  }
}
```

### Custom Priority Criteria

Create custom criteria files for automated priority calculation:

```json
{
  "documentSize": { "weight": 0.4, "method": "linear" },
  "category": { 
    "weight": 0.3, 
    "values": { "guide": 90, "concept": 80, "examples": 70 }
  },
  "keywordDensity": { "weight": 0.2, "method": "logarithmic" },
  "relationships": { "weight": 0.1, "method": "network" }
}
```

## Best Practices

### Language-Specific Workflows

**Korean Documentation:**
```bash
# Create Korean document
vim docs/ko/guide/new-feature.md

# Process Korean only
pnpm llms:sync-docs:ko --changed-files docs/ko/guide/new-feature.md

# Check Korean priorities
pnpm llms:work-next --language ko
```

**English Documentation:**
```bash
# Create English document
vim docs/en/guide/new-feature.md

# Process English only
pnpm llms:sync-docs:en --changed-files docs/en/guide/new-feature.md

# Check English priorities
pnpm llms:work-next --language en
```

### Team Coordination

**Daily Workflow:**
```bash
# 1. Check system health
pnpm llms:priority-health

# 2. Find next work item
pnpm llms:work-next --verbose

# 3. After completing work, sync if needed
pnpm llms:sync-docs --changed-files docs/path/to/modified.md
```

**Weekly Maintenance:**
```bash
# 1. Full system analysis
pnpm llms:priority-stats

# 2. Health check and suggestions
pnpm llms:priority-health
pnpm llms:priority-suggest

# 3. Auto-recalculate if needed
pnpm llms:priority-auto --force
```

## Error Handling

### Common Issues

**Language Processing Errors:**
- Ensure file paths match `docs/(en|ko)/**/*.md` pattern
- Check language filtering options are correctly specified
- Verify LLMS Generator is built with `pnpm build:llms-generator`

**Priority Inconsistencies:**
- Run `pnpm llms:priority-health` to identify issues
- Use `pnpm llms:priority-auto --force` for bulk recalculation
- Review custom criteria files for proper JSON format

**Template Generation Failures:**
- Check source document formatting and structure
- Ensure sufficient content for character limits
- Verify directory permissions for `llmsData/` creation

### Debug Mode

Enable detailed debugging output:

```bash
# Verbose output for all commands
node cli.js <command> --verbose

# Dry run to preview changes
node cli.js sync-docs --dry-run --changed-files files...

# Quiet mode for automated scripts
node cli.js <command> --quiet
```

---

::: tip Next Steps
- Set up automated workflows with post-commit hooks
- Configure language-specific processing for your team
- Establish regular priority health monitoring
- Integrate with CI/CD pipelines for documentation quality gates
:::

::: warning Important Notes
- Always test language filtering with `--dry-run` first
- Monitor priority health scores after bulk changes
- Coordinate language processing settings with team members
- Keep LLMS Generator build up to date for latest features
:::