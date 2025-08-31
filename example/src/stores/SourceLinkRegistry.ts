import { createStoreContext } from '@context-action/react';

export interface SourceLinkEntry {
  filePath: string;             // 파일 경로 (KEY로 사용)
  name: string;                  // 표시명
  githubPath: string;           // GitHub 상의 경로
  category: string;             // 카테고리 (demos, core, store 등)
  description?: string;         // 설명
  tags?: string[];             // 태그들
  priority?: number;           // 우선순위 (높을수록 먼저 표시)
  instances: Set<string>;      // 마운트된 컴포넌트 인스턴스 ID들 (useId)
  firstRegisteredAt: Date;     // 최초 등록 시간
  lastUpdatedAt: Date;         // 마지막 업데이트 시간
}

export interface SourceLinkRegistryState {
  entries: Record<string, SourceLinkEntry>;  // filePath를 key로 사용
  categories: string[];
  totalCount: number;
}

export const {
  Provider: SourceLinkRegistryProvider,
  useStore: useSourceLinkRegistry,
  useStoreManager: useSourceLinkRegistryManager
} = createStoreContext('SourceLinkRegistry', {
  entries: {} as Record<string, SourceLinkEntry>,
  categories: [] as string[],
  totalCount: 0
});