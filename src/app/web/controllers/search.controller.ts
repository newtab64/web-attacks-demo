import type { Request, Response } from 'express';
import { SearchService } from '../../../core/services/search.service.js';
import { searchQuerySchema } from '../../../core/services/schemas.js';

export function createSearchController(mode: 'vulnerable' | 'secure') {
  const searchService = new SearchService(mode);

  return {
    renderSearch(req: Request, res: Response): void {
      const rawQuery = req.query['q'];
      const query = typeof rawQuery === 'string' ? searchQuerySchema.parse(rawQuery) : '';
      const results = query.trim() ? searchService.searchTitles(query) : [];

      res.render('pages/search', {
        results,
        query,
      });
    },
  };
}
