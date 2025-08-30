import { useStoreValue } from '@context-action/react';
import { useSourceLinkRegistry, type SourceLinkEntry } from '../../stores/SourceLinkRegistry';
import { SourceLink } from '../../components/ui/SourceLink';
import { PageLayout } from '../../components/layout/PageLayout';
import { useSourceLinkRegistration } from '../../hooks/useSourceLinkRegistration';

export function SourceLinkDirectory() {
  // 이 페이지 자체도 등록
  useSourceLinkRegistration({
    id: 'source-link-directory',
    name: 'Source Link Directory',
    filePath: 'pages/utilities/SourceLinkDirectory.tsx',
    category: 'utilities',  // This is for SourceLinkRegistry, not PageLayout
    description: 'Registry visualization for all registered source links',
    tags: ['registry', 'visualization', 'utility']
  });

  const entriesStore = useSourceLinkRegistry('entries');
  const categoriesStore = useSourceLinkRegistry('categories');
  const totalCountStore = useSourceLinkRegistry('totalCount');
  
  const entries = useStoreValue(entriesStore);
  const categories = useStoreValue(categoriesStore);
  const totalCount = useStoreValue(totalCountStore);
  
  const entriesByCategory = categories.reduce((acc, category) => {
    acc[category] = Object.values(entries).filter(entry => entry.category === category);
    return acc;
  }, {} as Record<string, SourceLinkEntry[]>);

  // 카테고리별 색상
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'demos': 'bg-blue-50 border-blue-200',
      'core': 'bg-red-50 border-red-200',
      'store': 'bg-green-50 border-green-200',
      'react': 'bg-purple-50 border-purple-200',
      'actionguard': 'bg-pink-50 border-pink-200',
      'performance': 'bg-orange-50 border-orange-200',
      'utilities': 'bg-gray-50 border-gray-200',
      'refs': 'bg-indigo-50 border-indigo-200',
    };
    return colors[category] || 'bg-gray-50 border-gray-200';
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'demos': '🎯',
      'core': '🔴',
      'store': '🏪',
      'react': '⚛️',
      'actionguard': '🛡️',
      'performance': '⚡',
      'utilities': '🛠️',
      'refs': '🎯',
    };
    return icons[category] || '📁';
  };
  
  return (
    <PageLayout
      title="Source Link Directory"
      description="All registered source code links in the Context-Action framework examples"
    >
      <div className="space-y-6">
        {/* 통계 정보 */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-blue-900">Registry Statistics</h2>
              <p className="text-blue-700 mt-1">
                Live tracking of all registered source files in the application
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-900">{totalCount}</div>
              <div className="text-sm text-blue-600">Files Registered</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {categories.map(category => (
              <div key={category} className="bg-white rounded-md p-3 border border-blue-100">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getCategoryIcon(category)}</span>
                  <div>
                    <div className="text-sm font-medium capitalize text-gray-900">
                      {category}
                    </div>
                    <div className="text-lg font-bold text-blue-600">
                      {entriesByCategory[category]?.length || 0}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 카테고리별 목록 */}
        {categories.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Source Links Registered</h3>
            <p className="text-gray-500">
              Navigate to other pages to see source links appear here automatically.
            </p>
          </div>
        ) : (
          categories.map(category => {
            const categoryEntries = entriesByCategory[category] || [];
            if (categoryEntries.length === 0) return null;
            
            return (
              <div key={category} className={`border rounded-lg p-6 ${getCategoryColor(category)}`}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{getCategoryIcon(category)}</span>
                  <div>
                    <h3 className="text-lg font-semibold capitalize text-gray-900">
                      {category}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {categoryEntries.length} registered file{categoryEntries.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                
                <div className="grid gap-3">
                  {categoryEntries
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map(entry => (
                    <div key={entry.id} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-start gap-3">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 mb-1">{entry.name}</div>
                              
                              {entry.description && (
                                <div className="text-sm text-gray-600 mb-2">{entry.description}</div>
                              )}
                              
                              <div className="text-xs text-gray-400 font-mono bg-gray-50 px-2 py-1 rounded">
                                {entry.filePath}
                              </div>
                              
                              {entry.tags && entry.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {entry.tags.map(tag => (
                                    <span 
                                      key={tag}
                                      className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex-shrink-0 ml-4">
                          <SourceLink id={entry.id} variant="badge" />
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-400 mt-3 pt-2 border-t border-gray-100">
                        Registered: {entry.registeredAt.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </PageLayout>
  );
}