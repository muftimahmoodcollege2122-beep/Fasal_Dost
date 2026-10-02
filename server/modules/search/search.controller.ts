// ─────────────────────────────────────────────────────────────────────────────
// server/modules/search/search.controller.ts
// REST Controller for Search Engine
// ─────────────────────────────────────────────────────────────────────────────

import { Request, Response, NextFunction } from 'express';
import { searchEngine } from './search.service';
import { sendResponse } from '../../core/middleware';

export class SearchController {
  public async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = req.query.q as string | undefined;
      const category = req.query.category as any;
      const province = req.query.province as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

      const result = await searchEngine.search({
        q,
        category,
        province,
        limit,
        offset,
      });

      sendResponse(res, result);
    } catch (err) {
      next(err);
    }
  }
}

export const searchController = new SearchController();
