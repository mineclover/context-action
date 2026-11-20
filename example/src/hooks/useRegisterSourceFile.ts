import { useStoreValue } from '@context-action/react';
import { useEffect, useId, useRef } from 'react';
import { GITHUB_CONFIG } from '../constants/github';
import { useSourceLinkRegistry } from '../stores/SourceLinkRegistry';

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
    /** 카테고리 (기본값: filePath의 첫 번째 경로 세그먼트) */
    category?: string;
  }
) {
  const entriesStore = useSourceLinkRegistry('entries');
  const categoriesStore = useSourceLinkRegistry('categories');
  const totalCountStore = useSourceLinkRegistry('totalCount');

  // useId를 사용하여 각 인스턴스를 고유하게 식별
  const instanceId = useId();
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const tagsKey = options?.tags ? options.tags.join('\u0000') : '';

  useEffect(() => {
    const currentOptions = optionsRef.current;
    // 파일 경로에서 정보 추출
    const pathParts = filePath.split('/');
    const fileName = pathParts[pathParts.length - 1];
    const fileNameWithoutExt = fileName
      ? fileName.replace(/\.(tsx?|jsx?|ts|js)$/, '')
      : 'unknown';

    // 카테고리 자동 감지 (옵션 우선)
    const category = currentOptions?.category || pathParts[0] || 'general';

    // Store 업데이트
    const currentEntries = entriesStore.getValue();
    const currentCategories = categoriesStore.getValue();

    // 기존 엔트리가 있는지 확인
    const existingEntry = currentEntries[filePath];

    if (existingEntry) {
      // 기존 엔트리가 있으면 인스턴스만 추가
      const updatedInstances = existingEntry.instances.includes(instanceId)
        ? existingEntry.instances
        : [...existingEntry.instances, instanceId];

      entriesStore.setValue({
        ...currentEntries,
        [filePath]: {
          ...existingEntry,
          instances: updatedInstances,
          lastUpdatedAt: new Date(),
          // 옵션이 제공되면 업데이트 (마지막 등록된 값으로)
          name: currentOptions?.name || existingEntry.name,
          description:
            currentOptions?.description !== undefined
              ? currentOptions.description
              : existingEntry.description,
          tags: currentOptions?.tags ?? existingEntry.tags,
          priority: currentOptions?.priority ?? existingEntry.priority,
          category: currentOptions?.category || existingEntry.category,
        },
      });
    } else {
      // 새로운 엔트리 생성
      const newEntry = {
        filePath,
        name: currentOptions?.name || fileNameWithoutExt,
        githubPath: GITHUB_CONFIG.getExampleUrl(filePath),
        category,
        description: currentOptions?.description,
        tags: currentOptions?.tags ?? [],
        priority: currentOptions?.priority ?? 0,
        instances: [instanceId],
        firstRegisteredAt: new Date(),
        lastUpdatedAt: new Date(),
      };

      entriesStore.setValue({
        ...currentEntries,
        [filePath]: newEntry,
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
        const updatedInstances = entry.instances.filter(
          (id) => id !== instanceId
        );

        if (updatedInstances.length === 0) {
          // 마지막 인스턴스가 언마운트되면 엔트리 제거
          const { [filePath]: _, ...remaining } = entries;
          entriesStore.setValue(remaining);
          totalCountStore.setValue(Object.keys(remaining).length);

          // 카테고리 정리
          const remainingEntries = Object.values(remaining);
          const remainingCategories = Array.from(
            new Set(remainingEntries.map((e) => e.category))
          );
          categoriesStore.setValue(remainingCategories);
        } else {
          // 아직 다른 인스턴스가 있으면 인스턴스만 제거
          entriesStore.setValue({
            ...entries,
            [filePath]: {
              ...entry,
              instances: updatedInstances,
              lastUpdatedAt: new Date(),
            },
          });
        }
      }
    };
  }, [categoriesStore, entriesStore, filePath, instanceId, totalCountStore]);

  useEffect(() => {
    const currentEntries = entriesStore.getValue();
    const existingEntry = currentEntries[filePath];
    if (!existingEntry) return;

    const currentOptions = optionsRef.current;
    const pathParts = filePath.split('/');
    const fileName = pathParts[pathParts.length - 1];
    const fileNameWithoutExt = fileName
      ? fileName.replace(/\.(tsx?|jsx?|ts|js)$/, '')
      : 'unknown';

    const nextName = currentOptions?.name || fileNameWithoutExt;
    const nextDescription = currentOptions?.description;
    const nextTags = currentOptions?.tags ?? [];
    const nextPriority = currentOptions?.priority ?? 0;
    const nextCategory = currentOptions?.category || pathParts[0] || 'general';

    const currentTags = existingEntry.tags ?? [];
    const tagsChanged =
      currentTags.length !== nextTags.length ||
      currentTags.some((tag, index) => tag !== nextTags[index]);

    if (
      existingEntry.name === nextName &&
      existingEntry.description === nextDescription &&
      !tagsChanged &&
      (existingEntry.priority ?? 0) === nextPriority &&
      existingEntry.category === nextCategory
    ) {
      return;
    }

    const updatedEntries = {
      ...currentEntries,
      [filePath]: {
        ...existingEntry,
        name: nextName,
        description: nextDescription,
        tags: nextTags,
        priority: nextPriority,
        category: nextCategory,
        lastUpdatedAt: new Date(),
      },
    };
    entriesStore.setValue(updatedEntries);

    const remainingCategories = Array.from(
      new Set(Object.values(updatedEntries).map((entry) => entry.category))
    );
    const currentCategories = categoriesStore.getValue();
    if (
      remainingCategories.length !== currentCategories.length ||
      remainingCategories.some((cat, index) => cat !== currentCategories[index])
    ) {
      categoriesStore.setValue(remainingCategories);
    }
  }, [
    categoriesStore,
    entriesStore,
    filePath,
    options?.category,
    options?.description,
    options?.name,
    options?.priority,
    tagsKey,
  ]);
}

/**
 * 파일이 현재 등록되어 있는지 확인하는 Hook
 */
export function useIsSourceFileRegistered(filePath: string): boolean {
  const entriesStore = useSourceLinkRegistry('entries');
  const entries = useStoreValue(entriesStore);

  const entry = entries[filePath];
  return entry ? entry.instances.length > 0 : false;
}

/**
 * 특정 파일의 인스턴스 개수를 반환하는 Hook
 */
export function useSourceFileInstanceCount(filePath: string): number {
  const entriesStore = useSourceLinkRegistry('entries');
  const entries = useStoreValue(entriesStore);

  const entry = entries[filePath];
  return entry ? entry.instances.length : 0;
}
