#!/bin/bash
# 디렉토리 구조 변경 스크립트
# Context-Action Example 리팩토링용

set -e  # 에러 시 스크립트 중단

echo "🚀 Starting directory restructure..."

# 1. 새 디렉토리 생성
echo "📁 Creating new directory structure..."
mkdir -p src/lib/templates
mkdir -p src/lib/patterns  
mkdir -p src/lib/services
mkdir -p src/lib/hooks
mkdir -p src/pages/conditional-patterns

# 2. features → pages 이동
echo "📁 Moving features to pages..."
if [ -d "src/features/conditional-patterns" ]; then
  echo "  - Moving conditional-patterns pages..."
  if [ -d "src/features/conditional-patterns/pages" ]; then
    cp -r src/features/conditional-patterns/pages/* src/pages/conditional-patterns/ 2>/dev/null || true
  fi
  
  echo "  - Moving conditional-patterns stores..."
  if [ -d "src/features/conditional-patterns/stores" ]; then
    cp -r src/features/conditional-patterns/stores src/pages/conditional-patterns/ 2>/dev/null || true
  fi
  
  echo "  - Moving conditional-patterns types..."
  if [ -d "src/features/conditional-patterns/types" ]; then
    cp -r src/features/conditional-patterns/types src/pages/conditional-patterns/ 2>/dev/null || true
  fi
  
  echo "  - Moving conditional-patterns utils..."
  if [ -d "src/features/conditional-patterns/utils" ]; then
    cp -r src/features/conditional-patterns/utils src/pages/conditional-patterns/ 2>/dev/null || true
  fi
  
  echo "  ✅ Features moved to pages/"
else
  echo "  ⚠️  src/features/conditional-patterns not found, skipping..."
fi

# 3. domains → lib 이동
echo "📁 Moving domains to lib..."
if [ -d "src/domains/shared/templates" ]; then
  echo "  - Moving shared templates..."
  cp -r src/domains/shared/templates/* src/lib/templates/ 2>/dev/null || true
  echo "  ✅ Templates moved to lib/templates/"
else
  echo "  ⚠️  src/domains/shared/templates not found, skipping..."
fi

if [ -d "src/domains/shared/services" ]; then
  echo "  - Moving shared services..."
  cp -r src/domains/shared/services/* src/lib/services/ 2>/dev/null || true
  echo "  ✅ Services moved to lib/services/"
else
  echo "  ⚠️  src/domains/shared/services not found, skipping..."
fi

if [ -d "src/domains/shared/hooks" ]; then
  echo "  - Moving shared hooks..."
  cp -r src/domains/shared/hooks/* src/lib/hooks/ 2>/dev/null || true
  echo "  ✅ Hooks moved to lib/hooks/"
else
  echo "  ⚠️  src/domains/shared/hooks not found, skipping..."
fi

# 4. patterns → lib 이동
echo "📁 Moving patterns to lib..."
if [ -d "src/patterns/object-context-manager" ]; then
  echo "  - Moving object-context-manager..."
  cp -r src/patterns/object-context-manager/* src/lib/patterns/ 2>/dev/null || true
  echo "  ✅ Patterns moved to lib/patterns/"
else
  echo "  ⚠️  src/patterns/object-context-manager not found, skipping..."
fi

echo ""
echo "✅ Directory restructure complete!"
echo ""
echo "📋 Next steps:"
echo "1. Verify moved files: ls -la src/lib/ src/pages/conditional-patterns/"
echo "2. Test compilation: pnpm type-check"
echo "3. Update import paths: ./scripts/update-imports.sh"
echo "4. Remove old directories after testing"
echo ""
echo "⚠️  Old directories preserved for safety. Remove manually after verification:"
echo "   - src/features/"
echo "   - src/domains/"  
echo "   - src/patterns/"