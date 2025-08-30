---
document_id: en_guide_llms-cli-reference
category: guide
source_path: en/guide/llms-cli-reference.md
character_limit: 5000
last_update: '2025-08-30T10:42:11.277Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
LLMS Generator CLI Command Reference

LLMS Generator CLI Command Reference Complete command reference for the LLMS Generator CLI system with multilingual document processing capabilities. 🎯 Quick Overview (30 seconds) What is LLMS Generator? A system that automatically summarizes long documents into 7 different lengths (100-5000 characters) How it works: Most used commands: --- Core Commands Document Processing sync-docs Automatically processes changed document files and generates templates with priority metadata. Options: - --changed-files <files>: Comma-separated list of changed markdown files - --only-korean: Process only Korean documents 🇰🇷 - --only-english: Process only English documents 🇺🇸 - --languages <langs>: Comma-separated specific languages to process - --include-korean / --no-korean: Control Korean document processing - --dry-run: Preview changes without modification - --force: Force update even with minimal changes - --quiet: Suppress detailed output generate-templates Generate character-limited templates for existing documents. Options: - -l, --language <lang>: Target language (en, ko) - --category <category>: Specific document category - --character-limits <limits>: Comma-separated character limits - --overwrite: Overwrite existing templates - --dry-run: Preview without creating files - -v, --verbose: Detailed output Priority Management priority-stats Display comprehensive priority distribution statistics. Output includes: - Total document count and average priority score - Distribution by priority tiers (high, medium, low) - Category-wise priority analysis - Language-specific statistics priority-health Comprehensive priority consistency and health check with 0-100 scoring. Health indicators: - ✅ Excellent (90-100): Well-structured priority system - 🟢 Good (70-89): Minor inconsistencies exist - 🟡 Fair (50-69): Several issues need attention - 🟠 Poor (30-49): Significant problems require fixing - 🔴 Critical (0-29): Priority system needs major overhaul priority-tasks Manage priority.json files (missing, outdated, invalid) with automatic fixes. Options: - -l, --language <lang>: Filter by language - --category <category>: Filter by document category   - --task-type <type>: Filter by task type - -n, --limit <number>: Limit number of results - -v, --verbose: Show detailed information - --fix: Automatically fix detected issues - --dry-run: Preview changes without modification Task Types: - 🔴 missing: priority.json files are missing - ❌ invalid: JSON syntax errors or missing required fields   - 🟡 outdated: Source documents modified after priority.json - 🟠 needsreview: Priority scores don't align with category standards - 🔵 needsupdate: Metadata is incomplete or needs enhancement Examples: Additional Priority Commands - priority-stats: Display priority distribution statistic

Key points:
• `--changed-files <files>`: Comma-separated list of changed markdown files
• `--only-korean`: Process only Korean documents 🇰🇷
• `--only-english`: Process only English documents 🇺🇸
• `--languages <langs>`: Comma-separated specific languages to process
• `--include-korean` / `--no-korean`: Control Korean document processing
• `--dry-run`: Preview changes without modification
• `--force`: Force update even with minimal changes
• `--quiet`: Suppress detailed output
• `-l, --language <lang>`: Target language (en, ko)
• `--category <category>`: Specific document category
• `--character-limits <limits>`: Comma-separated character limits
• `--overwrite`: Overwrite existing templates
• `--dry-run`: Preview without creating files
• `-v, --verbose`: Detailed output
• Total document count and average priority score
• Distribution by priority tiers (high, medium, low)
• Category-wise priority analysis
• Language-specific statistics
• ✅ Excellent (90-100): Well-structured priority system
• 🟢 Good (70-89): Minor inconsistencies exist
• 🟡 Fair (50-69): Several issues need attention
• 🟠 Poor (30-49): Significant problems require fixing
• 🔴 Critical (0-29): Priority system needs major overhaul
• `-l, --language <lang>`: Filter by language
• `--category <category>`: Filter by document category
• `--task-type <type>`: Filter by task type
• `-n, --limit <number>`: Limit number of results
• `-v, --verbose`: Show detailed information
• `--fix`: Automatically fix detected issues
• `--dry-run`: Preview changes without modification
• 🔴 **missing**: priority.json files are missing
• ❌ **invalid**: JSON syntax errors or missing required fields
• 🟡 **outdated**: Source documents modified after priority.json
• 🟠 **needs_review**: Priority scores don't align with category standards
• 🔵...