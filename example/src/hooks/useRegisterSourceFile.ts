import { useEffect, useId } from 'react';
import { useStoreValue } from '@context-action/react';
import { useSourceLinkRegistry } from '../stores/SourceLinkRegistry';
import { GITHUB_CONFIG } from '../constants/github';

/**
 * 컴포넌트가 마운트될 때 소스 파일을 자동으로 등록하는 Hook
 * filePath를 키로 사용하고, React useId로 인스턴스를 추적
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   useRegisterSourceFile('components/MyComponent.tsx');
 *   // 여러 인스턴스가 마운트되어도 하나의 entry로 관리됨
 * }
 * ```
 */
export function useRegisterSourceFile(
  filePath: string,
  options?: {
    /** 표시할 이름 (기본값: 파일명) */
    name?: string;
    /** 설명 */
    description?: string;
    /** 태그들 */
    tags?: string[];
    /** 우선순위 (높을수록 먼저 표시) */
    priority?: number;
  }
) {
  const entriesStore = useSourceLinkRegistry('entries');
  const categoriesStore = useSourceLinkRegistry('categories');
  const totalCountStore = useSourceLinkRegistry('totalCount');
  
  // React 18의 useId를 사용하여 각 인스턴스를 고유하게 식별
  const instanceId = useId();
  
  useEffect(() => {
    // 파일 경로에서 정보 추출
    const pathParts = filePath.split('/');
    const fileName = pathParts[pathParts.length - 1];
    const fileNameWithoutExt = fileName ? fileName.replace(/\.(tsx?|jsx?|ts|js)$/, '') : 'unknown';
    
    // 카테고리 자동 감지
    const category = pathParts[0] || 'general';
    
    // Store 업데이트
    const currentEntries = entriesStore.getValue();
    const currentCategories = categoriesStore.getValue();
    
    // 기존 엔트리가 있는지 확인
    const existingEntry = currentEntries[filePath];
    
    if (existingEntry) {
      // 기존 엔트리가 있으면 인스턴스만 추가
      const updatedInstances = new Set(existingEntry.instances);
      updatedInstances.add(instanceId);
      
      entriesStore.setValue({
        ...currentEntries,
        [filePath]: {
          ...existingEntry,
          instances: updatedInstances,
          lastUpdatedAt: new Date(),
          // 옵션이 제공되면 업데이트 (마지막 등록된 값으로)
          name: options?.name || existingEntry.name,
          description: options?.description || existingEntry.description,
          tags: options?.tags || existingEntry.tags,
          priority: options?.priority ?? existingEntry.priority,
        }
      });
    } else {
      // 새로운 엔트리 생성
      const newEntry = {
        filePath,
        name: options?.name || fileNameWithoutExt,
        githubPath: GITHUB_CONFIG.getExampleUrl(filePath),
        category,
        description: options?.description,
        tags: options?.tags || [],
        priority: options?.priority || 0,
        instances: new Set([instanceId]),
        firstRegisteredAt: new Date(),
        lastUpdatedAt: new Date()
      };
      
      entriesStore.setValue({
        ...currentEntries,
        [filePath]: newEntry
      });
      
      // 카테고리 추가 (중복 제거)
      if (!currentCategories.includes(category)) {
        categoriesStore.setValue([...currentCategories, category]);
      }
      
      // 총 개수 업데이트
      totalCountStore.setValue(Object.keys(currentEntries).length + 1);
    }
    
    // Cleanup - 컴포넌트 언마운트시 인스턴스만 제거
    return () => {
      const entries = entriesStore.getValue();
      const entry = entries[filePath];
      
      if (entry) {
        const updatedInstances = new Set(entry.instances);
        updatedInstances.delete(instanceId);
        
        if (updatedInstances.size === 0) {
          // 마지막 인스턴스가 언마운트되면 엔트리 제거
          const { [filePath]: removed, ...remaining } = entries;
          entriesStore.setValue(remaining);
          totalCountStore.setValue(Object.keys(remaining).length);
          
          // 카테고리 정리
          const remainingEntries = Object.values(remaining);
          const hasCategory = remainingEntries.some(e => e.category === category);
          if (!hasCategory) {
            const categories = categoriesStore.getValue();
            categoriesStore.setValue(categories.filter(cat => cat !== category));
          }
        } else {
          // 아직 다른 인스턴스가 있으면 인스턴스만 제거
          entriesStore.setValue({
            ...entries,
            [filePath]: {
              ...entry,
              instances: updatedInstances,
              lastUpdatedAt: new Date()
            }
          });
        }
      }
    };
  }, [filePath, instanceId]); // instanceId는 변하지 않으므로 안전
}


/**
 * 파일이 현재 등록되어 있는지 확인하는 Hook
 */
export function useIsSourceFileRegistered(filePath: string): boolean {
  const entriesStore = useSourceLinkRegistry('entries');
  const entries = useStoreValue(entriesStore);
  
  const entry = entries[filePath];
  return entry ? entry.instances.size > 0 : false;
}

/**
 * 특정 파일의 인스턴스 개수를 반환하는 Hook
 */
export function useSourceFileInstanceCount(filePath: string): number {
  const entriesStore = useSourceLinkRegistry('entries');
  const entries = useStoreValue(entriesStore);
  
  const entry = entries[filePath];
  return entry ? entry.instances.size : 0;
}