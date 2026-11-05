import type { Request, Response } from 'express';
import { PostsService } from '../../../core/services/posts.service.js';
import { tagQuerySchema } from '../../../core/services/schemas.js';

export function createHomeController(mode: 'vulnerable' | 'secure') {
  const postsService = new PostsService(mode);

  return {
    renderHome(req: Request, res: Response): void {
      const rawTag = req.query['tag'];
      const tagParse = tagQuerySchema.safeParse(rawTag);
      const activeTag = tagParse.success && tagParse.data ? tagParse.data : null;

      const tags = postsService.getAllTags();
      const recentComments = postsService.getRecentComments(5);

      if (activeTag) {
        const posts = postsService.getPostsByTag(activeTag);
        res.render('pages/home', {
          posts,
          tags,
          activeTag,
          recentComments,
          page: 1,
          hasMore: false,
        });
        return;
      }

      const { posts, total } = postsService.getAllPosts(1, 10);
      res.render('pages/home', {
        posts,
        tags,
        activeTag: null,
        recentComments,
        page: 1,
        hasMore: total > 10,
      });
    },
  };
}
