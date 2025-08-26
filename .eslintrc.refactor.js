// ESLint 리팩토링용 추가 규칙
// 기존 .eslintrc.cjs에 추가할 규칙들

const additionalRules = {
  rules: {
    // Import 순서 강제
    'import/order': [
      'error',
      {
        groups: [
          'builtin',    // Node.js 내장 모듈
          'external',   // 외부 라이브러리
          'internal',   // 내부 모듈 (@ 또는 ~ 경로)
          'parent',     // 상위 디렉토리
          'sibling',    // 같은 디렉토리
          'index'       // index 파일
        ],
        pathGroups: [
          {
            pattern: 'react',
            group: 'external',
            position: 'before'
          },
          {
            pattern: 'react-**',
            group: 'external',
            position: 'before'
          },
          {
            pattern: '@/**',
            group: 'internal',
            position: 'before'
          },
          {
            pattern: '~/**', 
            group: 'internal',
            position: 'before'
          }
        ],
        pathGroupsExcludedImportTypes: ['react'],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true
        }
      }
    ],

    // 상대 경로 제한 (부모 디렉토리로의 상대 경로 금지)
    'import/no-relative-parent-imports': 'error',

    // 명명된 export 사용 권장
    'import/prefer-default-export': 'off',
    'import/no-default-export': 'warn',

    // 미사용 import 제거
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }
    ],

    // 일관된 타입 import 사용
    '@typescript-eslint/consistent-type-imports': [
      'error',
      {
        prefer: 'type-imports',
        disallowTypeAnnotations: false
      }
    ],

    // 파일명 규칙 (필요시 활성화)
    // 'filenames/match-regex': [
    //   'error', 
    //   '^[a-zA-Z0-9\\-\\.]+$',
    //   true
    // ],

    // React 관련 규칙
    'react/jsx-sort-props': [
      'warn',
      {
        callbacksLast: true,
        shorthandFirst: false,
        shorthandLast: true,
        multiline: 'last',
        ignoreCase: true,
        noSortAlphabetically: false
      }
    ],

    // 함수형 컴포넌트 선호
    'react/function-component-definition': [
      'error',
      {
        namedComponents: 'function-declaration',
        unnamedComponents: 'function-expression'
      }
    ],

    // JSX에서 불필요한 Fragment 금지
    'react/jsx-no-useless-fragment': 'warn',

    // Hook 의존성 배열 검증
    'react-hooks/exhaustive-deps': 'warn'
  }
};

module.exports = additionalRules;