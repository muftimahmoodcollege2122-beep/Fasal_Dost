// ─────────────────────────────────────────────────────────────────────────────
// server/modules/search/search.interface.ts
// Search Engine Contract & Query Types
// ─────────────────────────────────────────────────────────────────────────────

export interface SearchQueryDto {
  q?: string;
  category?: 'all' | 'crops' | 'diseases' | 'marketplace' | 'farmers';
  province?: string;
  minPrice?: number;
  maxPrice?: number;
  verifiedOnly?: boolean;
  limit?: number;
  offset?: number;
}

export interface SearchResultItem {
  id: string;
  type: 'crop' | 'disease' | 'marketplace_listing' | 'farmer';
  title: string;
  subtitle?: string;
  description?: string;
  tags: string[];
  metadata: Record<string, any>;
  score: number;
}

export interface SearchResponseDto {
  query: string;
  totalHits: number;
  tookMs: number;
  results: SearchResultItem[];
  facets: {
    provinces: Record<string, number>;
    categories: Record<string, number>;
  };
}

export interface ISearchEngine {
  search(params: SearchQueryDto): Promise<SearchResponseDto>;
  indexDocument(doc: { id: string; type: string; title: string; content: string; tags: string[]; metadata?: any }): Promise<void>;
  removeDocument(id: string): Promise<void>;
}
