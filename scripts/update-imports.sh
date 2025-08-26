#!/bin/bash
# Import 경로 자동 수정 스크립트
# Context-Action Example 리팩토링용

set -e  # 에러 시 스크립트 중단

echo "🔄 Updating import paths..."

# 백업 확인
if [ ! -d ".git" ]; then
  echo "❌ Error: This script should be run in a git repository"
  echo "Please commit your changes first for safety"
  exit 1
fi

echo "📋 Checking for files to update..."

# 1. domains/shared/templates → @/lib/templates
echo "🔧 Updating domains template imports..."
TEMPLATE_FILES=$(find src -name "*.tsx" -o -name "*.ts" | xargs grep -l "domains/shared/templates" 2>/dev/null || true)
if [ -n "$TEMPLATE_FILES" ]; then
  echo "Found files with template imports:"
  echo "$TEMPLATE_FILES"
  
  find src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' \
    -e "s|from '../../domains/shared/templates'|from '@/lib/templates'|g" \
    -e "s|from '../../../domains/shared/templates'|from '@/lib/templates'|g" \
    -e "s|from '../../../../domains/shared/templates'|from '@/lib/templates'|g" \
    2>/dev/null || true
  
  echo "✅ Template imports updated"
else
  echo "ℹ️  No template imports found"
fi

# 2. features → @/pages
echo "🔧 Updating features imports..."
FEATURE_FILES=$(find src -name "*.tsx" -o -name "*.ts" | xargs grep -l "features/conditional-patterns" 2>/dev/null || true)
if [ -n "$FEATURE_FILES" ]; then
  echo "Found files with feature imports:"
  echo "$FEATURE_FILES"
  
  find src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' \
    -e "s|from './features/conditional-patterns|from '@/pages/conditional-patterns'|g" \
    -e "s|from '../features/conditional-patterns|from '@/pages/conditional-patterns'|g" \
    -e "s|from '../../features/conditional-patterns|from '@/pages/conditional-patterns'|g" \
    2>/dev/null || true
  
  echo "✅ Feature imports updated"
else
  echo "ℹ️  No feature imports found"
fi

# 3. patterns → @/lib/patterns  
echo "🔧 Updating patterns imports..."
PATTERN_FILES=$(find src -name "*.tsx" -o -name "*.ts" | xargs grep -l "patterns/object-context-manager" 2>/dev/null || true)
if [ -n "$PATTERN_FILES" ]; then
  echo "Found files with pattern imports:"
  echo "$PATTERN_FILES"
  
  find src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' \
    -e "s|from './patterns/object-context-manager|from '@/lib/patterns'|g" \
    -e "s|from '../patterns/object-context-manager|from '@/lib/patterns'|g" \
    -e "s|from '../../patterns/object-context-manager|from '@/lib/patterns'|g" \
    2>/dev/null || true
  
  echo "✅ Pattern imports updated"
else
  echo "ℹ️  No pattern imports found"
fi

# 4. domains/shared/services → @/lib/services
echo "🔧 Updating services imports..."
SERVICE_FILES=$(find src -name "*.tsx" -o -name "*.ts" | xargs grep -l "domains/shared/services" 2>/dev/null || true)
if [ -n "$SERVICE_FILES" ]; then
  echo "Found files with service imports:"
  echo "$SERVICE_FILES"
  
  find src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' \
    -e "s|from '../../domains/shared/services'|from '@/lib/services'|g" \
    -e "s|from '../../../domains/shared/services'|from '@/lib/services'|g" \
    -e "s|from '../../../../domains/shared/services'|from '@/lib/services'|g" \
    2>/dev/null || true
  
  echo "✅ Service imports updated"
else
  echo "ℹ️  No service imports found"
fi

# 5. domains/shared/hooks → @/lib/hooks
echo "🔧 Updating hooks imports..."
HOOK_FILES=$(find src -name "*.tsx" -o -name "*.ts" | xargs grep -l "domains/shared/hooks" 2>/dev/null || true)
if [ -n "$HOOK_FILES" ]; then
  echo "Found files with hook imports:"
  echo "$HOOK_FILES"
  
  find src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' \
    -e "s|from '../../domains/shared/hooks'|from '@/lib/hooks'|g" \
    -e "s|from '../../../domains/shared/hooks'|from '@/lib/hooks'|g" \
    -e "s|from '../../../../domains/shared/hooks'|from '@/lib/hooks'|g" \
    2>/dev/null || true
  
  echo "✅ Hook imports updated"
else
  echo "ℹ️  No hook imports found"
fi

echo ""
echo "✅ Import paths updated!"
echo ""
echo "📋 Next steps:"
echo "1. Update vite.config.ts with path mapping"
echo "2. Update tsconfig.json with path mapping"  
echo "3. Test compilation: pnpm type-check"
echo "4. Test development server: pnpm dev"
echo ""
echo "⚠️  If TypeScript errors occur, you may need to:"
echo "   - Update path mappings in tsconfig.json"
echo "   - Check for missing index.ts files"
echo "   - Manually fix complex import cases"