---
document_id: en_guide_llms-priority-management
category: guide
source_path: en/guide/llms-priority-management.md
character_limit: 5000
last_update: '2025-08-30T10:42:05.667Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Priority Management System

Priority Management System The Priority Management System provides automated tools for analyzing, maintaining, and optimizing documentation priorities in the LLMS Generator framework. Overview Problem Statement Traditional documentation management faces several challenges: - Manual Priority Assignment: Subjective priority scoring leads to inconsistency - Team Coordination: Difficulty tracking who's working on what - Priority Drift: Priorities become outdated without systematic review - Scalability Issues: Manual management doesn't scale with growing documentation Solution Architecture The Priority Management System provides: - Automated Analysis: Statistical insights into priority distribution - Health Monitoring: Consistency checks and variance detection - Smart Suggestions: Data-driven recommendations for improvement - Team Collaboration: Foundation for external server integration Quick Start Basic Commands Example Output Commands Reference priority-stats Analyzes priority distribution across your documentation. Output includes: - Total document count and average priority score - Distribution by priority tier (critical, high, medium, low) - Breakdown by category and language - Statistical measures (range, standard deviation) priority-health Evaluates priority consistency and identifies issues. Health Scoring: - Excellent (85-100): Well-balanced, consistent priorities - Good (70-84): Minor inconsistencies, easily addressed - Fair (50-69): Noticeable issues requiring attention - Poor (0-49): Significant problems needing immediate action Common Issues Detected: - High priority variance (standard deviation > 25) - Similar scores across all documents (range < 20) - Uneven category distribution (variance > 50) - Language inconsistencies (variance > 30) priority-suggest Provides actionable recommendations based on current state. Suggestions include: - Immediate actions for poor health scores - Standardization recommendations - Document-specific guidance - Next steps for improvement priority-auto Automatically recalculates priorities based on defined criteria. Options: - --criteria <file>: Path to custom criteria JSON file - --force: Update all priorities, even if changes are minimal - --quiet: Suppress detailed output Default Criteria: - Document size (40% weight) - Category importance (30% weight) - Keyword density (20% weight) - Cross-references (10% weight) Multilingual Document Processing The system now supports advanced language filtering for document processing: Language Filtering Options: - --only-korean: Process Korean documents only 🇰🇷 - --only-english: Process English documents only 🇺🇸 - --languages ko,en: Process specific comma-separated languages - --include-korean / --no-korean: Control Korean document processing - --quiet: Suppress deta

Key points:
• **Manual Priority Assignment**: Subjective priority scoring leads to inconsistency
• **Team Coordination**: Difficulty tracking who's working on what
• **Priority Drift**: Priorities become outdated without systematic review
• **Scalability Issues**: Manual management doesn't scale with growing documentation
• **Automated Analysis**: Statistical insights into priority distribution
• **Health Monitoring**: Consistency checks and variance detection
• **Smart Suggestions**: Data-driven recommendations for improvement
• **Team Collaboration**: Foundation for external server integration
• Total document count and average priority score
• Distribution by priority tier (critical, high, medium, low)
• Breakdown by category and language
• Statistical measures (range, standard deviation)
• **Excellent (85-100)**: Well-balanced, consistent priorities
• **Good (70-84)**: Minor inconsistencies, easily addressed
• **Fair (50-69)**: Noticeable issues requiring attention
• **Poor (0-49)**: Significant problems needing immediate action
• High priority variance (standard deviation > 25)
• Similar scores across all documents (range < 20)
• Uneven category distribution (variance > 50)
• Language inconsistencies (variance > 30)
• Immediate actions for poor health scores
• Standardization recommendations
• Document-specific guidance
• Next steps for improvement
• `--criteria <file>`: Path to custom criteria JSON file
• `--force`: Update all priorities, even if changes are minimal
• `--quiet`: Suppress detailed output
• Document size (40% weight)
• Category importance (30% weight)
• Keyword density (20% weight)
• Cross-references (10% weight)
• `--only-korean`: Process Korean documents only 🇰🇷
• `--only-english`: Process English documents only 🇺🇸
• `--languages ko,en`: Process specific comma-separated...