# Priority Management System

The Priority Management System provides automated tools for analyzing, maintaining, and optimizing documentation priorities in the LLMS Generator framework.

## Overview

### Problem Statement

Traditional documentation management faces several challenges:
- **Manual Priority Assignment**: Subjective priority scoring leads to inconsistency
- **Team Coordination**: Difficulty tracking who's working on what
- **Priority Drift**: Priorities become outdated without systematic review
- **Scalability Issues**: Manual management doesn't scale with growing documentation

### Solution Architecture

The Priority Management System provides:
- **Automated Analysis**: Statistical insights into priority distribution
- **Health Monitoring**: Consistency checks and variance detection
- **Smart Suggestions**: Data-driven recommendations for improvement
- **Team Collaboration**: Foundation for external server integration

## Quick Start

### Basic Commands

```bash
# Check current priority statistics
pnpm llms:priority-stats

# Analyze priority health and get suggestions
pnpm llms:priority-health

# Get personalized recommendations
pnpm llms:priority-suggest

# Auto-recalculate priorities (when available)
pnpm llms:priority-auto --force
```

### Example Output

```bash
$ pnpm llms:priority-stats

📊 Priority Statistics

Total Documents: 49
Average Score: 89.5
Score Range: 80 - 95
Standard Deviation: 6.3

🏆 By Priority Tier:
  high: 27 (55.1%)
  medium: 22 (44.9%)

📁 By Category:
  guide: 27 (55.1%)
  concept: 12 (24.5%)
  examples: 10 (20.4%)
```

## Commands Reference

### `priority-stats`

Analyzes priority distribution across your documentation.

```bash
pnpm llms:priority-stats [--quiet]
```

**Output includes:**
- Total document count and average priority score
- Distribution by priority tier (critical, high, medium, low)
- Breakdown by category and language
- Statistical measures (range, standard deviation)

### `priority-health`

Evaluates priority consistency and identifies issues.

```bash
pnpm llms:priority-health [--quiet]
```

**Health Scoring:**
- **Excellent (85-100)**: Well-balanced, consistent priorities
- **Good (70-84)**: Minor inconsistencies, easily addressed
- **Fair (50-69)**: Noticeable issues requiring attention
- **Poor (0-49)**: Significant problems needing immediate action

**Common Issues Detected:**
- High priority variance (standard deviation > 25)
- Similar scores across all documents (range < 20)
- Uneven category distribution (variance > 50)
- Language inconsistencies (variance > 30)

### `priority-suggest`

Provides actionable recommendations based on current state.

```bash
pnpm llms:priority-suggest [--document-id <id>] [--quiet]
```

**Suggestions include:**
- Immediate actions for poor health scores
- Standardization recommendations
- Document-specific guidance
- Next steps for improvement

### `priority-auto`

Automatically recalculates priorities based on defined criteria.

```bash
pnpm llms:priority-auto [--criteria <file>] [--force] [--quiet]
```

**Options:**
- `--criteria <file>`: Path to custom criteria JSON file
- `--force`: Update all priorities, even if changes are minimal
- `--quiet`: Suppress detailed output

**Default Criteria:**
- Document size (40% weight)
- Category importance (30% weight)
- Keyword density (20% weight)
- Cross-references (10% weight)

### Multilingual Document Processing

The system now supports advanced language filtering for document processing:

```bash
# Process Korean documents only
pnpm llms:sync-docs:ko --changed-files docs/ko/guide/example.md

# Process English documents only
pnpm llms:sync-docs:en --changed-files docs/en/guide/example.md

# Process specific languages
node cli.js sync-docs --languages ko,en --changed-files files...

# Disable Korean processing
node cli.js sync-docs --no-korean --changed-files files...
```

**Language Filtering Options:**
- `--only-korean`: Process Korean documents only 🇰🇷
- `--only-english`: Process English documents only 🇺🇸
- `--languages ko,en`: Process specific comma-separated languages
- `--include-korean` / `--no-korean`: Control Korean document processing
- `--quiet`: Suppress detailed language processing output

## Priority Health Metrics

### Distribution Analysis

**Variance Indicators:**
- **Standard Deviation**: Measures priority score spread
- **Category Balance**: Even distribution across document types
- **Language Consistency**: Similar priorities between language versions

**Health Thresholds:**
```javascript
{
  stdDeviation: {
    excellent: "< 15",
    good: "15-25", 
    fair: "25-35",
    poor: "> 35"
  },
  categoryVariance: {
    excellent: "< 30",
    good: "30-50",
    fair: "50-80", 
    poor: "> 80"
  }
}
```

### Consistency Checks

**Automated Detection:**
- Priority scores too similar (differentiation < 20 points)
- Extreme variance (standard deviation > 25)
- Category imbalance (one category > 60% of total)
- Language drift (> 30% variance between EN/KO versions)

## Workflow Integration

### Daily Workflow

```bash
# 1. Check system health
pnpm llms:priority-health

# 2. Find next work item
pnpm llms:work-next --verbose

# 3. After completing work, check if priorities need adjustment
pnpm llms:priority-suggest --document-id <completed-doc>
```

### Weekly Maintenance

```bash
# 1. Full system analysis
pnpm llms:priority-stats

# 2. Health check and review suggestions
pnpm llms:priority-health
pnpm llms:priority-suggest

# 3. Auto-recalculate if needed
pnpm llms:priority-auto --force

# 4. Verify improvements
pnpm llms:priority-health
```

### Team Coordination

**Current State (Local):**
- Individual priority analysis
- Local consistency checking
- Personal workflow optimization
- Multilingual document processing with language-specific filtering

**Future State (Team Integration):**
- Shared priority server
- Real-time work status tracking
- Team-wide consistency enforcement
- Centralized multilingual document coordination

## Configuration

### Custom Priority Criteria

Create a criteria file to customize auto-calculation:

```json
{
  "documentSize": {
    "weight": 0.4,
    "method": "linear",
    "minScore": 20,
    "maxScore": 100
  },
  "category": {
    "weight": 0.3,
    "values": {
      "guide": 90,
      "concept": 80,
      "examples": 70,
      "reference": 60
    }
  },
  "keywordDensity": {
    "weight": 0.2,
    "method": "logarithmic",
    "keywords": ["typescript", "react", "context", "action"]
  },
  "relationships": {
    "weight": 0.1,
    "method": "network",
    "boost": 5
  }
}
```

Use with:
```bash
pnpm llms:priority-auto --criteria ./custom-criteria.json
```

### Environment Configuration

Priority management respects LLMS Generator configuration:

```json
{
  "paths": {
    "llmContentDir": "./llmsData",
    "docsDir": "./docs"
  },
  "generation": {
    "supportedLanguages": ["en", "ko"],
    "characterLimits": [100, 200, 300, 500, 1000, 2000, 5000]
  }
}
```

## Best Practices

### Priority Assignment Guidelines

**Score Ranges:**
- **90-100 (Critical)**: Core framework concepts, getting started guides
- **80-89 (High)**: Important features, common use cases
- **60-79 (Medium)**: Advanced features, specific scenarios
- **40-59 (Low)**: Edge cases, experimental features
- **0-39 (Minimal)**: Deprecated or rarely used content

**Category Priorities:**
- **Guides**: Usually high priority (80-95)
- **Concepts**: Medium to high priority (70-90)
- **Examples**: Medium priority (60-80)
- **Reference**: Variable based on usage (40-90)

### Consistency Maintenance

**Regular Reviews:**
- Run health checks weekly
- Monitor standard deviation trends
- Address category imbalances promptly
- Keep language versions synchronized

**Quality Indicators:**
- Standard deviation < 20 (excellent distribution)
- No category > 50% of total documents
- Language versions within 10% variance
- Clear differentiation between priority tiers

### Team Collaboration

**Coordination Strategies:**
- Establish team priority guidelines
- Regular priority review meetings
- Use auto-calculation as baseline
- Document priority decision rationale

**Communication:**
- Share priority health reports
- Discuss variance issues in team meetings
- Align on category importance weights
- Coordinate major priority adjustments

## Advanced Features

### Future Enhancements

**Phase 2: Team Collaboration**
- Work status tracking (`work-claim`, `work-status`, `work-release`)
- Real-time collaboration conflict prevention
- Team workload balancing
- Progress dashboards

**Phase 3: External Integration**
- Priority server synchronization
- Web-based management interface
- GitHub Issues integration
- Automated priority updates from analytics

**Phase 4: AI-Powered Optimization**
- Machine learning priority suggestions
- User behavior pattern analysis
- Seasonal trend adaptation
- Automatic category rebalancing

### Integration Points

**Current Integrations:**
- LLMS Generator work-next command
- Priority.json metadata system
- Template generation workflow

**Planned Integrations:**
- GitHub Issues priority sync
- Documentation analytics
- User feedback systems
- CI/CD pipeline integration

## Troubleshooting

### Common Issues

**High Standard Deviation (> 25)**
```bash
# Check distribution
pnpm llms:priority-stats

# Get specific suggestions
pnpm llms:priority-suggest

# Auto-recalculate with balanced criteria
pnpm llms:priority-auto --force
```

**Category Imbalance**
```bash
# Review category distribution
pnpm llms:priority-stats

# Check specific category priorities
pnpm llms:priority-health

# Consider adjusting category weights in criteria
```

**Language Inconsistencies**
```bash
# Compare language distributions
pnpm llms:priority-stats

# Review specific documents with high variance
pnpm llms:work-next --language ko --verbose
pnpm llms:work-next --language en --verbose
```

### Performance Optimization

**Large Documentation Sets:**
- Use `--quiet` flag for automated scripts
- Run analysis during off-peak hours
- Consider batch priority updates
- Monitor system resources during auto-calculation

**Error Recovery:**
- Priority files are validated before updates
- Backup originals before auto-calculation
- Rollback capability through git history
- Graceful degradation for missing files

## API Reference

### PriorityManagerCommand

```typescript
interface PriorityManagerOptions {
  mode: 'stats' | 'health' | 'sync' | 'auto-calc' | 'suggest';
  server?: string;           // For future server sync
  criteria?: string;         // Path to criteria file
  documentId?: string;       // Specific document focus
  force?: boolean;          // Force updates
  quiet?: boolean;          // Suppress output
}
```

### Return Types

```typescript
interface PriorityStats {
  total: number;
  byTier: Record<string, number>;
  byCategory: Record<string, number>;
  byLanguage: Record<string, number>;
  averageScore: number;
  distribution: {
    min: number;
    max: number;
    median: number;
    stdDev: number;
  };
}

interface PriorityHealth {
  score: number;                    // 0-100 health score
  issues: string[];                 // Detected problems
  suggestions: string[];            // Improvement recommendations
  consistency: {
    categoryVariance: number;
    languageVariance: number;
    overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
  };
}
```

## Migration Guide

### From Manual Priority Management

1. **Assessment Phase**
   ```bash
   # Analyze current state
   pnpm llms:priority-stats
   pnpm llms:priority-health
   ```

2. **Standardization Phase**
   ```bash
   # Create baseline with auto-calculation
   pnpm llms:priority-auto --force
   
   # Review and adjust outliers manually
   pnpm llms:priority-suggest
   ```

3. **Maintenance Phase**
   ```bash
   # Establish regular review cycle
   pnpm llms:priority-health  # Weekly
   pnpm llms:priority-auto    # Monthly
   ```

### Integration with Existing Workflows

**Git Hooks Integration:**

The post-commit hook automatically processes documentation changes:

```bash
# Automatic workflow (post-commit hook)
1. Detects changes: docs/(en|ko)/**/*.md files
2. Processes changes: Generates templates (100-5000 chars) + priority.json
3. Creates commit: Separate LLMS commit with enhanced debugging
4. Language support: Full Korean and English processing

# Hook configuration (.husky/post-commit)
- Enhanced debugging output showing detected files
- Robust error handling with graceful fallbacks
- Automatic language detection and processing
- Separate commit creation for clean history
```

**Manual Processing:**
```bash
# Language-specific processing
pnpm llms:sync-docs:ko --changed-files docs/ko/guide/example.md
pnpm llms:sync-docs:en --changed-files docs/en/guide/example.md

# Advanced filtering options
node cli.js sync-docs --languages ko,en --changed-files files...
node cli.js sync-docs --only-korean --changed-files files...
node cli.js sync-docs --no-korean --changed-files files...

# Testing and validation
pnpm llms:sync-docs:dry --changed-files files...
pnpm llms:priority-health --quiet
```

**CI/CD Integration:**
```yaml
# .github/workflows/priority-check.yml
- name: Priority Health Check
  run: pnpm llms:priority-health --quiet
  
- name: Generate Priority Report
  run: pnpm llms:priority-stats > priority-report.txt
```

---

::: tip Next Steps
- Set up regular priority health monitoring with `pnpm llms:priority-health`
- Explore auto-calculation with `pnpm llms:priority-auto --dry-run`
- Consider team coordination strategies for priority consistency
- Plan integration with external priority management systems
:::

::: warning Important Notes
- Always backup priority files before mass updates
- Test auto-calculation with `--dry-run` first
- Monitor health scores after making changes
- Coordinate priority changes with team members
:::