import { useEffect } from 'react';
import { useSourceLinkRegistry, type SourceLinkEntry } from '../stores/SourceLinkRegistry';
import { GITHUB_CONFIG } from '../constants/github';

interface SourceLinkRegistrationOptions {
  id: string;                    // 고유 식별자
  name: string;                  // 표시명
  filePath: string;             // example/src 기준 상대 경로
  category?: string;            // 카테고리
  description?: string;         // 설명
  tags?: string[];             // 태그들
}

export function useSourceLinkRegistration({
  id,
  name,
  filePath,
  category = 'demo',
  description,
  tags = []
}: SourceLinkRegistrationOptions) {
  const entriesStore = useSourceLinkRegistry('entries');
  const categoriesStore = useSourceLinkRegistry('categories');
  const totalCountStore = useSourceLinkRegistry('totalCount');
  
  useEffect(() => {
    // 등록 로직
    const entry: SourceLinkEntry = {
      name,
      filePath,
      githubPath: GITHUB_CONFIG.getExampleUrl(filePath),
      category,
      description,
      tags,
      instances: new Set<string>(),
      firstRegisteredAt: new Date(),
      lastUpdatedAt: new Date()
    };
    
    // Store 업데이트
    const currentEntries = entriesStore.getValue();
    const currentCategories = categoriesStore.getValue();
    
    // 중복 체크 및 등록
    if (!currentEntries[id]) {
      entriesStore.setValue({
        ...currentEntries,
        [id]: entry
      });
      
      // 카테고리 추가 (중복 제거)
      if (!currentCategories.includes(category)) {
        categoriesStore.setValue([...currentCategories, category]);
      }
      
      // 총 개수 업데이트
      totalCountStore.setValue(Object.keys(currentEntries).length + 1);
    }
    
    // Cleanup - 컴포넌트 언마운트시 등록 해제
    return () => {
      const entries = entriesStore.getValue();
      const { [id]: _, ...remaining } = entries;
      entriesStore.setValue(remaining);
      totalCountStore.setValue(Object.keys(remaining).length);
      
      // 카테고리 정리 (해당 카테고리의 마지막 항목인 경우)
      const remainingEntries = Object.values(remaining);
      const hasCategory = remainingEntries.some(entry => entry.category === category);
      if (!hasCategory) {
        const categories = categoriesStore.getValue();
        categoriesStore.setValue(categories.filter(cat => cat !== category));
      }
    };
  }, [id, name, filePath, category, description, tags?.join(',')]);
}