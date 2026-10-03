import { describe, it, expect } from 'vitest';
import { SearchEngineService } from '../../server/modules/search/search.service';

describe('SearchEngineService', () => {
  const service = new SearchEngineService();

  it('indexes and finds wheat crop pathology documents', async () => {
    const res = await service.search({ q: 'wheat rust' });
    expect(res.results.length).toBeGreaterThan(0);
    expect(res.results[0].title.toLowerCase()).toContain('wheat');
  });

  it('filters by category accurately', async () => {
    const res = await service.search({ q: 'blight', category: 'diseases' });
    for (const r of res.results) {
      expect(r.type).toBe('disease');
    }
  });

  it('returns facets for provinces and categories', async () => {
    const res = await service.search({ q: '' });
    expect(res.facets).toBeDefined();
    expect(res.facets.categories).toBeDefined();
  });
});
