// ─────────────────────────────────────────────────────────────────────────────
// server/modules/search/search.routes.ts
// Search module routing
// ─────────────────────────────────────────────────────────────────────────────

import { Router } from 'express';
import { searchController } from './search.controller';

const router = Router();

router.get('/', (req, res, next) => searchController.search(req, res, next));

export const searchRouter = router;
