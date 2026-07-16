export interface SearchItem {
  id: string;
  title: string;
  category: string;
  tags: string[];
  author: string;
  date: string;
  popularity: number;
  relevance?: number;
}

export interface SearchMetrics {
  totalSearches: number;
  averageSearchTime: number;
  activeSearchs: number;
  resultsFound: number;
  searchHits: Record<string, number>;
  popularSearchs: Array<{ tag: string; count: number }>;
}

export const sampleData: SearchItem[] = [
  {
    id: '1',
    title: 'React Hooks Advanced Patterns',
    category: 'Tutorial',
    tags: ['react', 'hooks', 'javascript', 'patterns'],
    author: 'John Doe',
    date: '2024-01-15',
    popularity: 95,
  },
  {
    id: '2',
    title: 'TypeScript Best Practices Guide',
    category: 'Guide',
    tags: ['typescript', 'javascript', 'best-practices', 'coding'],
    author: 'Jane Smith',
    date: '2024-01-20',
    popularity: 88,
  },
  {
    id: '3',
    title: 'Context-Action Framework Deep Dive',
    category: 'Documentation',
    tags: ['context-action', 'react', 'state-management', 'framework'],
    author: 'Dev Team',
    date: '2024-01-25',
    popularity: 92,
  },
  {
    id: '4',
    title: 'Performance Optimization Masterclass',
    category: 'Tutorial',
    tags: ['performance', 'optimization', 'react', 'javascript'],
    author: 'Mike Johnson',
    date: '2024-01-30',
    popularity: 96,
  },
  {
    id: '5',
    title: 'Action Pipeline Architecture',
    category: 'Tutorial',
    tags: ['context-action', 'pipeline', 'advanced', 'architecture'],
    author: 'Sarah Wilson',
    date: '2024-02-05',
    popularity: 89,
  },
  {
    id: '6',
    title: 'Store Management Patterns',
    category: 'Guide',
    tags: ['store', 'patterns', 'architecture', 'design'],
    author: 'Tom Brown',
    date: '2024-02-10',
    popularity: 85,
  },
  {
    id: '7',
    title: 'Component Testing Strategies',
    category: 'Guide',
    tags: ['testing', 'components', 'jest', 'tdd'],
    author: 'Lisa Chen',
    date: '2024-02-15',
    popularity: 91,
  },
  {
    id: '8',
    title: 'Real-time State Synchronization',
    category: 'Documentation',
    tags: ['state', 'sync', 'real-time', 'websockets'],
    author: 'Alex Kim',
    date: '2024-02-20',
    popularity: 87,
  },
];

export function createInitialSearchMetrics(): SearchMetrics {
  return {
    totalSearches: 0,
    averageSearchTime: 0,
    activeSearchs: 0,
    resultsFound: 0,
    searchHits: {},
    popularSearchs: [],
  };
}

export function calculateRelevance(item: SearchItem, query: string): number {
  if (!query.trim()) return 0.5;

  const searchTerm = query.toLowerCase();
  let score = 0;

  if (item.title.toLowerCase().includes(searchTerm)) {
    score += 0.6;
  }

  const tagMatches = item.tags.filter((tag) =>
    tag.toLowerCase().includes(searchTerm)
  ).length;
  score += (tagMatches * 0.3) / item.tags.length;

  if (item.author.toLowerCase().includes(searchTerm)) {
    score += 0.1;
  }

  score += (item.popularity / 100) * 0.2;
  return Math.min(score, 1);
}

export function searchItems(
  items: SearchItem[],
  query: string,
  filters: Record<string, string>
): SearchItem[] {
  let filteredResults = items.map((item) => ({
    ...item,
    relevance: calculateRelevance(item, query),
  }));

  if (query.trim()) {
    const searchTerm = query.toLowerCase();
    filteredResults = filteredResults.filter(
      (item) =>
        item.title.toLowerCase().includes(searchTerm) ||
        item.tags.some((tag) => tag.toLowerCase().includes(searchTerm)) ||
        item.author.toLowerCase().includes(searchTerm)
    );
  }

  Object.entries(filters).forEach(([key, value]) => {
    if (!value) return;

    filteredResults = filteredResults.filter((item) => {
      if (key === 'category') return item.category === value;
      if (key === 'author') return item.author === value;
      if (key === 'tag') return item.tags.includes(value);
      return true;
    });
  });

  return filteredResults.sort(
    (left, right) => (right.relevance ?? 0) - (left.relevance ?? 0)
  );
}

export function addSearchHistory(
  history: string[],
  query: string,
  limit = 5
): string[] {
  if (!query.trim() || history.includes(query)) return history;
  return [query, ...history].slice(0, limit);
}

export function updateSearchMetrics(
  metrics: SearchMetrics,
  query: string,
  filters: Record<string, string>,
  resultsFound: number,
  searchTime: number
): SearchMetrics {
  const totalSearches = metrics.totalSearches + 1;
  return {
    ...metrics,
    totalSearches,
    averageSearchTime:
      (metrics.averageSearchTime * metrics.totalSearches + searchTime) /
      totalSearches,
    activeSearchs: Object.keys(filters).length,
    resultsFound,
    searchHits: {
      ...metrics.searchHits,
      [query]: (metrics.searchHits[query] || 0) + 1,
    },
  };
}

export function addSearchFilter(
  filters: Record<string, string>,
  key: string,
  value: string
): Record<string, string> {
  return { ...filters, [key]: value };
}

export function removeSearchFilter(
  filters: Record<string, string>,
  key: string
): Record<string, string> {
  const { [key]: _removed, ...nextFilters } = filters;
  return nextFilters;
}
