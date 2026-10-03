// ─────────────────────────────────────────────────────────────────────────────
// server/modules/marketplace/marketplace.controller.ts
// Request controllers for Kisan Produce Marketplace
// ─────────────────────────────────────────────────────────────────────────────

import { Response, NextFunction } from 'express';
import { marketplaceService } from './marketplace.service';
import { sendResponse } from '../../core/middleware';
import { AuthRequest } from '../../core/auth';

function getParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] || '';
  return param || '';
}

export class MarketplaceController {
  public async getAll(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = {
        crop: req.query.crop as string,
        province: req.query.province as string,
        district: req.query.district as string,
        quality: req.query.quality as string,
        search: req.query.search as string,
        sellerId: req.query.sellerId as string,
        status: req.query.status as string,
      };
      const items = await marketplaceService.getListings(filters);
      sendResponse(res, items, 200, { count: items.length });
    } catch (err) {
      next(err);
    }
  }

  public async getOne(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = getParam(req.params.id);
      const item = await marketplaceService.getListingByCode(id);
      sendResponse(res, item);
    } catch (err) {
      next(err);
    }
  }

  public async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const sellerId = req.user?.uid || req.body.farmerId || (req.headers['x-user-uid'] as string) || 'guest-farmer';
      const created = await marketplaceService.createListing({
        ...req.body,
        sellerId,
      });
      sendResponse(res, created, 201);
    } catch (err) {
      next(err);
    }
  }

  public async updateStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = getParam(req.params.id);
      const sellerId = req.user?.uid || (req.headers['x-user-uid'] as string) || '';
      const { status } = req.body;
      const updated = await marketplaceService.updateListingStatus(id, sellerId, status);
      sendResponse(res, updated);
    } catch (err) {
      next(err);
    }
  }

  public async remove(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = getParam(req.params.id);
      const sellerId = req.user?.uid || (req.headers['x-user-uid'] as string) || '';
      await marketplaceService.deleteListing(id, sellerId);
      sendResponse(res, { deleted: true, id });
    } catch (err) {
      next(err);
    }
  }
}

export const marketplaceController = new MarketplaceController();
