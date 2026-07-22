---
document_id: en_guide_llms-cli-reference
category: guide
source_path: en/guide/llms-cli-reference.md
character_limit: 2000
last_update: '2025-08-30T10:42:11.276Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
LLMS Generator CLI Command Reference

LLMS Generator CLI Command Reference Complete command reference for the LLMS Generator CLI system with multilingual document processing capabilities. 🎯 Quick Overview (30 seconds) What is LLMS Generator? A system that automatically summarizes long documents into 7 different lengths (100-5000 characters) How it works: Most used commands: --- Core Commands Document Processing sync-docs Automatically processes changed document files and generates templates with priority metadata. Options: - --changed-files <files>: Comma-separated list of changed markdown files - --only-korean: Process only Korean documents 🇰🇷 - --only-english: Process only English documents 🇺🇸 - --languages <langs>: Comma-separated specific languages to process - --include-korean / --no-korean: Control Korean document processing - --dry-run: Preview changes without modification - --force: Force update even with minimal changes - --quiet: Suppress detailed output generate-templates Generate character-limited templates for

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
• `--character-limits <limits>`:...