import { useStoreValue } from '@context-action/react';
import { useSourceLinkRegistry } from '../../stores/SourceLinkRegistry';
import { PageLayout } from '../../components/layout/PageLayout';
import { useRegisterSourceFile } from '../../hooks/useRegisterSourceFile';

export function SourceLinkDirectory() {
  // 이 페이지 자체 등록
  useRegisterSourceFile('pages/utilities/SourceLinkDirectory.tsx');

  const entriesStore = useSourceLinkRegistry('entries');
  const entries = useStoreValue(entriesStore);
  
  // 활성 파일들만 필터링하고 정렬
  const activeFiles = Object.values(entries)
    .filter(e => e.instances && e.instances.size > 0)
    .sort((a, b) => a.filePath.localeCompare(b.filePath));

  return (
    <PageLayout 
      title="Source Files"
      description="Currently registered source files"
    >
      <div className="bg-gray-50 border rounded p-4">
        <div className="text-xs text-gray-500 mb-3">
          {activeFiles.length} files registered
        </div>
        
        {activeFiles.length === 0 ? (
          <div className="text-sm text-gray-500 py-4 text-center">
            No files registered. Navigate to other pages to see source files.
          </div>
        ) : (
          <div className="space-y-1">
            {activeFiles.map(file => (
              <div key={file.filePath} className="flex items-center gap-3 text-sm">
                <span className="text-gray-500 text-xs font-mono w-16">
                  {file.category}
                </span>
                <a
                  href={file.githubPath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex-1 font-mono"
                  title={file.filePath}
                >
                  {file.name}
                </a>
                {file.instances.size > 1 && (
                  <span className="text-xs text-gray-400 bg-gray-200 px-1 rounded">
                    {file.instances.size}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-4 pt-3 border-t text-xs text-gray-400">
          <code>useRegisterSourceFile('path/to/file.tsx')</code>
        </div>
      </div>
    </PageLayout>
  );
}