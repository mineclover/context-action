# Context-Action Ecosystem

The Context-Action framework includes a comprehensive ecosystem of tools, generators, and documentation systems designed to enhance developer productivity and maintain high-quality documentation.

## 🤖 LLMS Generator v0.5.1

**Advanced documentation management system** with AI-ready content generation and priority-driven workflows.

### Quick Start
```bash
# Install globally for CLI usage (recommended)
npm install -g @context-action/llms-generator

# Verify installation
llms --version
```

### Core Features
- 🤖 **AI-Ready Content**: Generate character-limited summaries (100-5000 chars)
- 📊 **Priority Management**: Automated priority analysis with health scoring
- 🌐 **Multilingual Support**: English/Korean processing with intelligent detection  
- ⚡ **CLI Tools**: Complete command-line interface with global `llms` command
- 🔄 **Auto-Sync**: Post-commit hooks for seamless documentation workflow
- 🎯 **Work Management**: Priority-driven task discovery

---

## 📊 Priority Management System

Sophisticated tools for analyzing, maintaining, and optimizing documentation priorities across the entire project.

### Priority Analysis Commands
```bash
# Statistical analysis of documentation priorities
llms priority-stats         # Overall statistics
llms priority-health         # Health check (0-100 score)
llms priority-suggest        # Actionable recommendations
llms priority-auto           # Auto-recalculate priorities

# Find next priority work
llms work-next              # Single next task
llms work-next --top 10     # Top 10 priority items
llms work-next --completed  # View completed documentation
```

### Priority Management Features
- **Health Scoring**: 0-100 health scores with automatic issue detection
- **Statistical Analysis**: Distribution analysis across categories and languages
- **Smart Suggestions**: Data-driven recommendations for improvement
- **Automated Calculation**: Configurable criteria-based priority assignment
- **Task Management**: Detect and fix missing, outdated, or invalid priority files

### Priority Health Indicators
```bash
llms priority-health
```
```
📊 Priority Health Report
├─ Overall Health: 87/100 ✅
├─ Categories: 
│  ├─ guide: 92/100 (23 files)
│  ├─ concept: 85/100 (18 files) 
│  └─ api: 78/100 (12 files)
├─ Languages:
│  ├─ English: 89/100 (31 files)
│  └─ Korean: 84/100 (22 files)
└─ Issues Found: 3
   ├─ Missing priority.json: 2 files
   └─ Outdated priorities: 1 file
```

---

## 🤖 LLMS Content Generation

Generate AI-optimized content with proper metadata and character limits for various use cases.

### Content Generation Commands
```bash
# Generate specific character limits
llms clean-llms-generate 500 --language en    # 500-char English
llms clean-llms-generate 1000 --language ko   # 1000-char Korean
llms clean-llms-generate 2000 --all-languages # 2000-char both languages

# Pattern-based generation
llms clean-llms-generate --pattern minimal    # Minimal summaries
llms clean-llms-generate --pattern detailed   # Detailed summaries
llms clean-llms-generate --pattern complete   # Complete summaries

# Category-specific generation
llms generate-templates --category guide      # Guide templates only
llms generate-templates --category concept    # Concept templates only
llms generate-templates --category api        # API templates only
```

### Template Generation Features
- **7 Character Limits**: 100, 200, 300, 500, 1000, 2000, 5000 characters
- **YAML Frontmatter**: Complete metadata including priority scores
- **Language Detection**: Automatic English/Korean content processing
- **Category Classification**: Smart categorization (guide, concept, api, etc.)
- **Original Links**: Proper source document references

---

## 🌐 Multilingual Document Processing

Advanced language filtering and processing capabilities for comprehensive multilingual documentation.

### Document Sync Commands
```bash
# Language-specific processing
llms sync-docs --language ko                  # Korean only 🇰🇷
llms sync-docs --language en                  # English only 🇺🇸
llms sync-docs --languages ko,en              # Both languages

# Advanced filtering
llms sync-docs --only-korean --changed-files docs/ko/**/*.md
llms sync-docs --no-korean --changed-files docs/en/**/*.md

# Preview mode
llms sync-docs --dry-run --changed-files files...  # Preview without changes
```

### Language Processing Features
- **Intelligent Detection**: Automatic language detection from file paths
- **Cultural Adaptation**: Language-specific content formatting
- **Character Counting**: Accurate character counting for Korean/English
- **Metadata Localization**: Localized priority and category information

---

## 📁 Generated Content Structure

The LLMS Generator creates a structured output format optimized for AI consumption and human review.

### Directory Structure (v0.5.1)
```
llmsData/
├── en/                                    # English content
│   ├── guide--quick-start/               # Document directory
│   │   ├── priority.json                 # Priority metadata
│   │   ├── guide--quick-start-100.md     # 100 char summary
│   │   ├── guide--quick-start-500.md     # 500 char summary
│   │   ├── guide--quick-start-1000.md    # 1000 char summary
│   │   ├── guide--quick-start-2000.md    # 2000 char summary
│   │   └── guide--quick-start-5000.md    # 5000 char summary
│   │
│   └── concept--architecture/            # Architecture concepts
│       ├── priority.json                 # Metadata
│       └── concept--architecture-*.md    # Various lengths
│
├── ko/                                    # Korean content 🇰🇷
│   ├── guide--quick-start/               # 한국어 가이드
│   │   ├── priority.json                 # 우선순위 메타데이터
│   │   ├── guide--quick-start-100.md     # 100자 요약
│   │   ├── guide--quick-start-500.md     # 500자 요약
│   │   └── guide--quick-start-5000.md    # 5000자 요약
│   │
│   └── concept--architecture/            # 아키텍처 개념
│       ├── priority.json                 # 메타데이터
│       └── concept--architecture-*.md    # 다양한 길이
│
└── code/                                  # Source code documentation
    ├── core-complete.md                   # Complete core package (~43KB)
    ├── core-metadata.json                # Core package statistics  
    ├── react-complete.md                 # Complete react package (~113KB)
    └── react-metadata.json               # React package statistics
```

### File Format Improvements (v0.5.1)
- ✅ **YAML Frontmatter**: All `.md` files include complete metadata
- ✅ **Consistent Naming**: `priority.json` without document prefix  
- ✅ **Proper Source Paths**: Links reference original documents
- ✅ **Enhanced Metadata**: Priority scores, completion status, workflow stage

### Example Generated File
```markdown
---
title: "Quick Start Guide"
originalPath: "en/guide/quick-start.md"
category: "guide"
language: "en"
priority: 95
wordCount: 127
characterCount: 500
tags: ["setup", "installation", "beginner"]
lastUpdated: "2024-01-15T10:30:00Z"
---

# Quick Start Guide (500 chars)

Context-Action is a revolutionary TypeScript state management framework...
[Content optimized for 500 characters]

**[📚 Read Full Guide](../../en/guide/quick-start.md)**
```

---

## 🔧 Code Mode - Source Documentation

Generate complete source code documentation optimized for AI understanding and development assistance.

### Code Generation Commands
```bash
# Generate code documentation for all packages
llms code-mode

# Generate for specific package
llms code-mode core                # Core package only
llms code-mode react               # React package only

# Generate for custom paths
llms code-mode ./example/src       # Example app source
llms code-mode ./packages/llms-generator/src  # LLMS Generator source

# Advanced options
llms code-mode --extensions=js,jsx,ts,tsx    # Specific file types
llms code-mode --dry-run                     # Preview without generating
llms code-mode --keep-comments               # Include comments (not recommended)
llms code-mode --include-tests               # Include test files
```

### Code Mode Features
- **Comment Stripping**: Automatically removes all comments and empty lines
- **Type-First Organization**: Places type definitions before implementation
- **Single File Output**: Combines all source files into one markdown document
- **Metadata Generation**: File statistics and structure information
- **Test Exclusion**: Automatically excludes test files by default

### Generated Output
- `llmsData/code/core-complete.md` (~43KB, ~1,300 lines) - Complete core implementation
- `llmsData/code/react-complete.md` (~113KB, ~3,300 lines) - Complete react implementation
- `llmsData/code/*-metadata.json` - Package statistics and file structure

---

## 🔄 Automation & Workflows

### Post-Commit Hook System
Automatically processes documentation changes via git hooks:

```bash
# Setup (automatically configured during pnpm install)
.husky/post-commit
```

**Automated Workflow:**
1. **Detection**: Automatically detects changes in `docs/(en|ko)/**/*.md` files
2. **Processing**: Generates 7 character-limited templates with YAML frontmatter
3. **Metadata**: Creates `priority.json` with enhanced metadata
4. **Manual Control**: Files are staged but require manual commit

### Integration with Development
```bash
# Development workflow
git add docs/en/guide/new-feature.md
git commit -m "docs: add new feature guide"
# → LLMS Generator automatically processes the new file
# → Files staged for manual commit

git add llmsData/ 
git commit -m "chore(llms): update documentation templates"
```

---

## 📚 Documentation Tools

### VitePress Integration
The framework uses VitePress for documentation with:
- **Dual Language Support**: English and Korean
- **Auto-Generated API**: TypeDoc integration
- **Live Examples**: Embedded interactive examples
- **Search**: Full-text search across all documentation

### TypeDoc API Generation
```bash
# Generate API documentation
pnpm docs:api

# Sync API docs to VitePress
pnpm docs:sync

# Full documentation build
pnpm docs:full
```

---

## 🎯 Work Management

Priority-driven task discovery and workflow optimization.

### Work Discovery Commands
```bash
# Find next priority work
llms work-next                     # Single highest priority task
llms work-next --top 5             # Top 5 priority items  
llms work-next --category guide    # Guide category only
llms work-next --language ko       # Korean documents only

# View completed work
llms work-next --show-completed    # Recently completed items
llms work-next --completed-stats   # Completion statistics
```

### Priority Task Management
```bash
# Manage priority.json files
llms priority-tasks                # Find missing/outdated/invalid files
llms priority-tasks --fix          # Auto-fix detected issues
llms priority-tasks --validate     # Validate all priority files
```

---

## 🔗 CLI Reference

### Global Installation
```bash
npm install -g @context-action/llms-generator
llms --help
```

### Local Development
```bash
# Use project-local commands
pnpm llms:priority-stats
pnpm llms:sync-docs:ko
pnpm llms:work-next
```

### Command Categories
- **`sync-docs`**: Process changed documentation with language filtering
- **`priority-*`**: Priority management and health monitoring
- **`priority-tasks`**: Manage priority.json files (missing, outdated, invalid)
- **`generate-templates`**: Create character-limited templates  
- **`clean-llms-generate`**: Generate specific character limit files
- **`work-next`**: Find next documentation work or show priority items
- **`code-mode`**: Generate source code documentation
- **`init`**: Initialize LLMS Generator in new projects

---

## 🏗️ Architecture

### Core Components
- **CLI System**: Commander.js-based command-line interface
- **Priority Engine**: Sophisticated priority calculation and health monitoring
- **Template Generator**: Character-limited content generation with YAML frontmatter
- **Language Processor**: Multilingual content processing and detection
- **Workflow Manager**: Automated task discovery and work prioritization

### Integration Points
- **Git Hooks**: Post-commit processing for seamless workflow
- **VitePress**: Documentation site integration
- **TypeDoc**: API documentation generation
- **Package.json Scripts**: Development workflow integration

---

## 🤝 Contributing to the Ecosystem

The LLMS Generator and ecosystem tools are actively developed alongside the core framework.

### Development Setup
```bash
cd packages/llms-generator
pnpm install
pnpm build

# Test CLI locally  
node dist/cli/index.js --help
```

### Adding New Commands
1. Create command class in `src/cli/commands/`
2. Extend base command functionality
3. Add to CLI index with proper help text
4. Add tests and documentation
5. Update global CLI binary

### Extending Priority System
1. Add new priority criteria in configuration
2. Implement calculation logic
3. Add health check validation
4. Update statistics and reporting
5. Test across multiple languages

---

This ecosystem provides a comprehensive foundation for maintaining high-quality, AI-ready documentation while supporting efficient development workflows. All tools are designed to work seamlessly together while remaining modular and extensible.