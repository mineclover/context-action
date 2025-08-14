# Document Extraction Guidelines

## General Instructions

1. **Extract content** from the source document specified in YAML metadata
2. **Stay within character limit** (±10% tolerance)
3. **Preserve document structure** and key information
4. **Update status** in YAML front matter when complete

## Character Limit Guidelines

### 100 Characters
- Core concept only
- Single sentence explanations
- Remove all examples and code blocks
- Minimal technical detail

### 300 Characters  
- Main concepts and key points
- One simple example maximum
- Essential technical details only
- Brief explanations

### 500-1000 Characters
- Cover main concepts with explanation
- Include 2-3 key examples
- Important technical details
- Moderate explanations

### 2000+ Characters
- Comprehensive coverage of topic
- Multiple examples and use cases
- Full technical details and edge cases
- Complete explanations

## Status Values

- `placeholder`: Not yet written
- `draft`: Content added but needs review
- `complete`: Content finalized and within character limit
- `review`: Needs character count or quality review

## File Naming Convention

- Folder: `documentId/`
- File: `documentId-charLimit.txt`
- Example: `guide-concepts/guide-concepts-300.txt`

## Quality Standards

1. **Character Count**: Stay within ±10% of target
2. **Information Preservation**: Maintain essential meaning
3. **Readability**: Clear and well-structured content
4. **Consistency**: Follow established patterns

---
Generated: 2025-08-14
