# Package.json Scripts Optimization Plan

## 🎯 Current Issue

**Problem**: Too many scripts in package.json (50+ scripts)
- Hard to discover relevant commands
- Cluttered namespace
- Maintenance overhead
- Poor developer experience

## 📋 Requirements

### Core Requirements
1. **Simplicity**: Reduce package.json script count by 70%+
2. **Discoverability**: Easy to find and use commands
3. **Consistency**: Uniform command patterns
4. **Maintainability**: Easy to add/modify scripts
5. **Backward Compatibility**: Don't break existing workflows

### Functional Requirements
- Keep core development scripts in package.json (build, test, dev, lint)
- Move specialized tools to dedicated CLIs
- Maintain all current functionality
- Preserve script performance
- Support help/usage information

## 🚀 Proposed Solution

### Phase 1: Create Specialized CLIs
Create dedicated CLI scripts for major tool categories:

**1. LLM CLI** (`scripts/llm-cli.js`)
```bash
# Replace 6+ scripts with single CLI
pnpm llms minimum --lang en
pnpm llms origin --lang ko
pnpm llms status
pnpm llms chars 5000 --lang en
```

**2. Priority CLI** (`scripts/priority-cli.js`)
```bash
# Replace 8+ scripts with single CLI  
pnpm priority status
pnpm priority generate
pnpm priority validate
pnpm priority critical
```

**3. Docs CLI** (`scripts/docs-cli.js`)
```bash
# Consolidate doc generation commands
pnpm docs analyze
pnpm docs status
pnpm docs optimized
```

### Phase 2: Package.json Cleanup
Keep only essential scripts:

```json
{
  "scripts": {
    // Core Development (8 scripts)
    "build": "lerna run build",
    "dev": "cd example && pnpm dev", 
    "test": "lerna run test",
    "lint": "lerna run lint",
    "clean": "lerna run clean",
    "type-check": "lerna run type-check",
    
    // Release Management (4 scripts)
    "version": "lerna version",
    "release": "lerna publish from-package",
    
    // Specialized CLIs (3 scripts)
    "llms": "node scripts/llm-cli.js",
    "priority": "node scripts/priority-cli.js", 
    "docs": "node scripts/docs-cli.js",
    
    // Meta Commands (2 scripts)
    "docs:full": "pnpm docs:api && pnpm docs:sync && pnpm llms minimum && pnpm docs:build"
  }
}
```

**Result**: ~17 scripts (vs current 50+) = 66% reduction

## 📊 Implementation Priority

### High Priority
- ✅ LLM CLI (most complex, 6+ scripts → 1)
- ✅ Priority CLI (routine tasks, 8+ scripts → 1)

### Medium Priority  
- Docs CLI (analysis tools, 5+ scripts → 1)
- Version management consolidation

### Low Priority
- Advanced workflow automation
- CI/CD script optimization

## 🎯 Success Metrics

### Quantitative
- **Script Count**: Reduce from 50+ to <20 scripts
- **Command Length**: Average command length <30 characters
- **Discovery Time**: <5 seconds to find relevant command

### Qualitative  
- **Ease of Use**: New contributors can run commands without documentation
- **Consistency**: All CLIs follow same argument patterns
- **Maintainability**: Adding new features requires minimal package.json changes

## 🚧 Implementation Steps

### Step 1: LLM CLI Implementation
1. Create `scripts/llm-cli.js` with argument parsing
2. Migrate existing LLM generation logic
3. Add help system and validation
4. Update package.json with single `llms` script
5. Test all existing use cases

### Step 2: Priority CLI Implementation  
1. Create `scripts/priority-cli.js`
2. Consolidate priority management commands
3. Update package.json

### Step 3: Documentation & Migration
1. Update README with new command patterns
2. Create migration guide for existing workflows
3. Add deprecation warnings for old scripts
4. Remove deprecated scripts after transition period

## 🔧 Technical Specifications

### CLI Pattern Standard
```bash
pnpm <tool> <action> [options]

Examples:
pnpm llms minimum --lang ko --output custom.txt
pnpm priority status --format table
pnpm docs analyze --verbose
```

### Error Handling
- Validate arguments before execution  
- Provide helpful error messages
- Support --help for all commands
- Exit codes for CI/CD integration

### Performance Requirements
- CLI startup time <200ms
- Maintain existing script performance
- Memory usage <100MB for CLI overhead

---

**Planning Status**: Requirements defined, solution designed
**Next Step**: Implement LLM CLI prototype
**Estimated Effort**: 4-6 hours total implementation