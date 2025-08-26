#!/bin/bash
# 코드 포맷팅 및 품질 개선 스크립트
# Context-Action Example 리팩토링용

set -e  # 에러 시 스크립트 중단

echo "🎨 Starting code formatting and quality improvements..."

# 1. Prettier로 코드 포맷팅
echo "📝 Running Prettier formatting..."
if command -v pnpm &> /dev/null; then
  pnpm prettier --write "src/**/*.{ts,tsx,js,jsx,json,md}" 2>/dev/null || {
    echo "⚠️  Prettier formatting had some issues, continuing..."
  }
  echo "✅ Prettier formatting complete"
else
  echo "⚠️  pnpm not found, skipping Prettier"
fi

# 2. ESLint 자동 수정
echo "🔧 Running ESLint auto-fix..."
if command -v pnpm &> /dev/null; then
  pnpm eslint --fix "src/**/*.{ts,tsx,js,jsx}" 2>/dev/null || {
    echo "⚠️  ESLint auto-fix had some issues, continuing..."
    echo "   Manual review may be needed for remaining issues"
  }
  echo "✅ ESLint auto-fix complete"
else
  echo "⚠️  pnpm not found, skipping ESLint"
fi

# 3. TypeScript 컴파일 체크
echo "🔍 Running TypeScript compilation check..."
if command -v pnpm &> /dev/null; then
  if pnpm type-check 2>/dev/null; then
    echo "✅ TypeScript compilation successful"
  else
    echo "❌ TypeScript compilation errors found"
    echo "   Please review and fix TypeScript errors manually"
    echo "   Run 'pnpm type-check' for details"
  fi
else
  echo "⚠️  pnpm not found, skipping TypeScript check"
fi

# 4. 파일 권한 정리
echo "🔒 Cleaning up file permissions..."
find src -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs chmod 644 2>/dev/null || true
echo "✅ File permissions cleaned"

# 5. 빈 디렉토리 정리 (선택적)
echo "🧹 Checking for empty directories..."
EMPTY_DIRS=$(find src -type d -empty 2>/dev/null || true)
if [ -n "$EMPTY_DIRS" ]; then
  echo "Found empty directories:"
  echo "$EMPTY_DIRS"
  echo "   Consider removing these manually if no longer needed"
else
  echo "✅ No empty directories found"
fi

echo ""
echo "✅ Code formatting and quality improvements complete!"
echo ""
echo "📋 Summary of actions taken:"
echo "  - ✅ Prettier code formatting"
echo "  - ✅ ESLint auto-fix"
echo "  - 🔍 TypeScript compilation check"
echo "  - ✅ File permissions cleanup"
echo "  - 🧹 Empty directory detection"
echo ""
echo "📋 Next steps:"
echo "1. Review any remaining TypeScript errors: pnpm type-check"
echo "2. Review any remaining ESLint errors: pnpm lint"
echo "3. Test build process: pnpm build"
echo "4. Test development server: pnpm dev"
echo "5. Commit changes: git add . && git commit -m 'refactor: apply formatting and quality improvements'"
echo ""
echo "⚠️  If errors persist:"
echo "   - Check import paths manually"
echo "   - Verify all moved files exist in new locations" 
echo "   - Review path mapping configuration in vite.config.ts and tsconfig.json"