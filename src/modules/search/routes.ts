import { Router } from 'express';
import { SearchService } from './service.js';
import { searchQuerySchema } from './schemas.js';

export function createSearchRouter(mode: 'vulnerable' | 'secure'): Router {
  const router = Router();
  const searchService = new SearchService(mode);

  router.get('/search', (req, res) => {
    const rawQuery = req.query.q;
    const query = typeof rawQuery === 'string' ? searchQuerySchema.parse(rawQuery) : '';
    const results = query.trim() ? searchService.searchTitles(query) : [];

    res.render('pages/search', {
      results,
      query,
    });
  });

  return router;
}
