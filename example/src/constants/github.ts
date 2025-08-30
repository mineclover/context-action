export const GITHUB_CONFIG = {
  PROFILE_URL: 'https://github.com/mineclover',
  REPOSITORY_BASE: 'https://github.com/mineclover/context-action',
  
  // 경로 생성 함수
  getSourceUrl: (filePath: string) => 
    `${GITHUB_CONFIG.REPOSITORY_BASE}/blob/main/${filePath}`,
    
  getExampleUrl: (examplePath: string) => 
    `${GITHUB_CONFIG.REPOSITORY_BASE}/blob/main/example/src/${examplePath}`,
    
  // 링크 아이콘
  ICONS: {
    PROFILE: '👨‍💻',
    SOURCE: '📝', 
    REPOSITORY: '📦',
    EXTERNAL: '🔗'
  }
} as const;