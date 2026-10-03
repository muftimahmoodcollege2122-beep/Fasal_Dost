// ─────────────────────────────────────────────────────────────────────────────
// server/modules/search/search.service.ts
// Dedicated Full-Text & Inverted Index Search Engine for FasalDost
// ─────────────────────────────────────────────────────────────────────────────

import { ISearchEngine, SearchQueryDto, SearchResponseDto, SearchResultItem } from './search.interface';
import { db } from '../../../src/db/index.ts';
import { marketplaceListings, farmerProfiles } from '../../../src/db/schema.ts';
import { eq, ilike, or } from 'drizzle-orm';
import { redisCache } from '../../core/redis';

interface IndexedDoc {
  id: string;
  type: 'crop' | 'disease' | 'marketplace_listing' | 'farmer';
  title: string;
  content: string;
  tags: string[];
  metadata: Record<string, any>;
}

export class SearchEngineService implements ISearchEngine {
  private invertedIndex = new Map<string, Set<string>>();
  private documents = new Map<string, IndexedDoc>();

  constructor() {
    this.seedKnowledgeBase();
  }

  private seedKnowledgeBase() {
    // Seed common Pakistani agricultural crops and known plant pathology knowledge
    const knowledge = [
      { id: 'crop-wheat', type: 'crop' as const, title: 'Wheat (Gandum)', content: 'Wheat cereal crop rabi season rust smuts yellow rust brown rust aphids', tags: ['wheat', 'rabi', 'cereal'] },
      { id: 'crop-rice', type: 'crop' as const, title: 'Rice (Chawal - Basmati)', content: 'Basmati rice paddy kharif season bacterial leaf blight blast sheath rot stem borer', tags: ['rice', 'basmati', 'kharif'] },
      { id: 'crop-cotton', type: 'crop' as const, title: 'Cotton (Kapas)', content: 'White gold cotton bollworm whitefly pink bollworm leaf curl virus CLCuV', tags: ['cotton', 'kapas', 'fiber'] },
      { id: 'crop-sugarcane', type: 'crop' as const, title: 'Sugarcane (Ganna)', content: 'Sugarcane red rot smut top borer pyrilla gur sugar cash crop', tags: ['sugarcane', 'ganna'] },
      { id: 'crop-maize', type: 'crop' as const, title: 'Maize / Corn (Makki)', content: 'Maize corn fall armyworm stalk borer leaf blight turcicum', tags: ['maize', 'corn', 'makki'] },
      { id: 'crop-mango', type: 'crop' as const, title: 'Mango (Aam - Chaunsa / Sindhri)', content: 'Mango fruit anthrancnose powdery mildew fruit fly malformation mealy bug', tags: ['mango', 'fruit', 'chaunsa', 'sindhri'] },
      { id: 'crop-potato', type: 'crop' as const, title: 'Potato (Aloo)', content: 'Potato solanum tuberosum early blight late blight phytophthora black scurf virus tuber', tags: ['potato', 'aloo', 'vegetable'] },
      { id: 'crop-tomato', type: 'crop' as const, title: 'Tomato (Tamatar)', content: 'Tomato early blight septoria leaf spot blossom end rot whitefly leaf curl virus', tags: ['tomato', 'vegetable'] },
      { id: 'dis-rust', type: 'disease' as const, title: 'Wheat Rust (Yellow / Brown Rust)', content: 'Fungal infection Puccinia striiformis yellow powder stripes on leaves. Treatment: Tebuconazole, Propiconazole fungicides.', tags: ['wheat', 'rust', 'fungal'] },
      { id: 'dis-blight', type: 'disease' as const, title: 'Late Blight (Phytophthora)', content: 'Water-soaked dark lesions white mold under moist conditions in potatoes and tomatoes. Treatment: Mancozeb, Metalaxyl.', tags: ['potato', 'tomato', 'blight'] },
      { id: 'dis-clcuv', type: 'disease' as const, title: 'Cotton Leaf Curl Virus (CLCuV)', content: 'Upward curling thickened veins enations spread by whitefly Bemisia tabaci.', tags: ['cotton', 'virus', 'whitefly'] },
    ];

    for (const doc of knowledge) {
      this.indexDocument({ ...doc, metadata: {} });
    }
  }

  public async indexDocument(doc: {
    id: string;
    type: 'crop' | 'disease' | 'marketplace_listing' | 'farmer';
    title: string;
    content: string;
    tags: string[];
    metadata?: any;
  }): Promise<void> {
    const fullText = `${doc.title} ${doc.content} ${doc.tags.join(' ')}`.toLowerCase();
    const tokens = this.tokenize(fullText);

    this.documents.set(doc.id, {
      id: doc.id,
      type: doc.type,
      title: doc.title,
      content: doc.content,
      tags: doc.tags,
      metadata: doc.metadata || {},
    });

    for (const token of tokens) {
      if (!this.invertedIndex.has(token)) {
        this.invertedIndex.set(token, new Set<string>());
      }
      this.invertedIndex.get(token)!.add(doc.id);
    }
  }

  public async removeDocument(id: string): Promise<void> {
    this.documents.delete(id);
    for (const [, docSet] of this.invertedIndex) {
      docSet.delete(id);
    }
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 1);
  }

  public async search(params: SearchQueryDto): Promise<SearchResponseDto> {
    const startTime = Date.now();
    const query = (params.q || '').trim().toLowerCase();
    const category = params.category || 'all';

    // 1. Check Redis Cache
    const cacheKey = `search:${query}:${category}:${params.province || 'all'}:${params.limit || 20}:${params.offset || 0}`;
    const cached = await redisCache.get<SearchResponseDto>(cacheKey);
    if (cached) {
      return { ...cached, tookMs: Date.now() - startTime };
    }

    const matchedScores = new Map<string, number>();

    if (query) {
      const tokens = this.tokenize(query);
      for (const token of tokens) {
        for (const [indexedToken, docIds] of this.invertedIndex.entries()) {
          // Exact and prefix matching
          if (indexedToken.includes(token) || token.includes(indexedToken)) {
            const scoreMultiplier = indexedToken === token ? 3.0 : 1.2;
            for (const docId of docIds) {
              matchedScores.set(docId, (matchedScores.get(docId) || 0) + scoreMultiplier);
            }
          }
        }
      }
    } else {
      // Return all indexed docs when query is empty
      for (const docId of this.documents.keys()) {
        matchedScores.set(docId, 1.0);
      }
    }

    // 2. Fetch live database records (marketplace & verified farmers)
    try {
      if (category === 'all' || category === 'marketplace') {
        const liveListings = await db
          .select()
          .from(marketplaceListings)
          .where(
            query
              ? or(
                  ilike(marketplaceListings.cropName, `%${query}%`),
                  ilike(marketplaceListings.variety, `%${query}%`),
                  ilike(marketplaceListings.description, `%${query}%`)
                )
              : undefined
          )
          .limit(30);

        for (const l of liveListings) {
          const docId = `listing-${l.id}`;
          this.documents.set(docId, {
            id: l.id.toString(),
            type: 'marketplace_listing',
            title: `${l.cropName} (${l.variety || 'Standard'})`,
            content: `${l.cropName} ${l.variety || ''} ${l.description || ''} ${l.district || ''} ${l.province}`,
            tags: [l.cropName.toLowerCase(), l.province.toLowerCase()],
            metadata: {
              price: l.pricePkr,
              unit: l.unit,
              quantity: l.quantity,
              province: l.province,
              district: l.district,
              images: l.images,
              sellerName: l.farmerName,
              sellerPhone: l.farmerPhone,
              isVerifiedSeller: l.isSellerVerified,
              status: l.status,
            },
          });
          matchedScores.set(docId, (matchedScores.get(docId) || 0) + 2.5);
        }
      }
    } catch (e) {
      console.warn('[SearchEngine] Database query fallback:', e);
    }

    // 3. Assemble and rank results
    const results: SearchResultItem[] = [];
    const facets = {
      provinces: {} as Record<string, number>,
      categories: {} as Record<string, number>,
    };

    for (const [docId, score] of matchedScores.entries()) {
      const doc = this.documents.get(docId);
      if (!doc) continue;

      if (category !== 'all') {
        if (category === 'marketplace' && doc.type !== 'marketplace_listing') continue;
        if (category === 'crops' && doc.type !== 'crop') continue;
        if (category === 'diseases' && doc.type !== 'disease') continue;
        if (category === 'farmers' && doc.type !== 'farmer') continue;
      }

      if (params.province && doc.metadata?.province && doc.metadata.province.toLowerCase() !== params.province.toLowerCase()) {
        continue;
      }

      // Record Facets
      const prov = doc.metadata?.province || 'General';
      facets.provinces[prov] = (facets.provinces[prov] || 0) + 1;
      facets.categories[doc.type] = (facets.categories[doc.type] || 0) + 1;

      results.push({
        id: doc.id,
        type: doc.type,
        title: doc.title,
        subtitle: doc.metadata?.variety || doc.tags.join(', '),
        description: doc.content,
        tags: doc.tags,
        metadata: doc.metadata,
        score: Math.round(score * 100) / 100,
      });
    }

    // Sort by descending score
    results.sort((a, b) => b.score - a.score);

    const limit = params.limit || 20;
    const offset = params.offset || 0;
    const paginated = results.slice(offset, offset + limit);

    const response: SearchResponseDto = {
      query,
      totalHits: results.length,
      tookMs: Date.now() - startTime,
      results: paginated,
      facets,
    };

    // Cache results for 60 seconds
    await redisCache.set(cacheKey, response, 60);

    return response;
  }
}

export const searchEngine = new SearchEngineService();
