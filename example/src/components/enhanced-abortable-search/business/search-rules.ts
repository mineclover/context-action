export interface SearchResult {
  id: number;
  title: string;
  description: string;
  url: string;
  relevance: number;
  timestamp: number;
}

export interface SearchState {
  query: string;
  isSearching: boolean;
  searchProgress: number;
  results: SearchResult[];
  searchHistory: string[];
  error: string | null;
  searchCount: number;
  lastSearchTime: number | null;
}

export function createInitialSearchState(): SearchState {
  return {
    query: '',
    isSearching: false,
    searchProgress: 0,
    results: [],
    searchHistory: [],
    error: null,
    searchCount: 0,
    lastSearchTime: null,
  };
}

export function updateQuery(state: SearchState, query: string): SearchState {
  return { ...state, query };
}

export function beginSearch(state: SearchState): SearchState {
  return {
    ...state,
    isSearching: true,
    searchProgress: 0,
    error: null,
  };
}

export function updateSearchProgress(
  state: SearchState,
  searchProgress: number
): SearchState {
  return { ...state, searchProgress };
}

export function createMockSearchResults(
  query: string,
  now: number,
  random: () => number
): SearchResult[] {
  return Array.from({ length: Math.floor(random() * 8) + 3 }, (_, index) => ({
    id: now + index,
    title: `${query} - Result ${index + 1}`,
    description: `This is a detailed description for search result ${index + 1} related to "${query}". It contains relevant information and highlights the key points that match your search query.`,
    url: `https://example.com/result-${index + 1}`,
    relevance: Math.round((random() * 40 + 60) * 10) / 10,
    timestamp: now - Math.floor(random() * 86400000),
  })).sort((left, right) => right.relevance - left.relevance);
}

export function completeSearch(
  state: SearchState,
  query: string,
  results: SearchResult[],
  completedAt: number
): SearchState {
  return {
    ...state,
    isSearching: false,
    results,
    searchHistory: state.searchHistory.includes(query)
      ? state.searchHistory
      : [query, ...state.searchHistory.slice(0, 9)],
    searchCount: state.searchCount + 1,
    lastSearchTime: completedAt,
    searchProgress: 100,
    error: null,
  };
}

export function failSearch(state: SearchState, error: string): SearchState {
  return {
    ...state,
    isSearching: false,
    error,
    results: [],
    searchProgress: 0,
  };
}

export function completeLargeDataSet(
  state: SearchState,
  completedAt: number,
  processedChunks: number,
  totalRecords: number
): SearchState {
  return {
    ...state,
    isSearching: false,
    searchProgress: 100,
    error: null,
    results: [
      {
        id: completedAt,
        title: 'Large Dataset Processing Complete',
        description: `Processed ${processedChunks} chunks with ${totalRecords} total records`,
        url: '#',
        relevance: 100,
        timestamp: completedAt,
      },
    ],
  };
}

export function clearSearchResults(state: SearchState): SearchState {
  return { ...state, results: [], error: null, searchProgress: 0 };
}

export function clearSearchHistory(state: SearchState): SearchState {
  return { ...state, searchHistory: [] };
}

export function selectSearchHistory(
  state: SearchState,
  query: string
): SearchState {
  return { ...state, query };
}

export function markSearchAborted(state: SearchState): SearchState {
  return {
    ...state,
    isSearching: false,
    error: 'Search aborted by user',
    searchProgress: 0,
  };
}
