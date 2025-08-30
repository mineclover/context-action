import { createStoreContext } from '@context-action/react';

export interface SourceLinkEntry {
  id: string;                    // 고유 식별자
  name: string;                  // 표시명
  filePath: string;             // 파일 경로
  githubPath: string;           // GitHub 상의 경로
  category: string;             // 카테고리 (demos, core, store 등)
  description?: string;         // 설명
  tags?: string[];             // 태그들
  registeredAt: Date;          // 등록 시간
}

export interface SourceLinkRegistryState {
  entries: Record<string, SourceLinkEntry>;
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