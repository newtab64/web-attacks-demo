import { Router } from 'express';
import { PostsService } from './service.js';
import { tagQuerySchema, postIdSchema } from './schemas.js';
import { i18n } from '../../i18n/vi.js';

export function createPostsRouter(mode: 'vulnerable' | 'secure'): Router {
  const router = Router();
  const postsService = new PostsService(mode);

  router.get('/', (req, res) => {
    const rawTag = req.query.tag;
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
  });

  router.get('/posts/:id', (req, res) => {
    const parsedId = postIdSchema.safeParse(req.params.id);
    if (!parsedId.success) {
      res.status(404).render('pages/error', {
        title: i18n.emptyState.notFoundTitle,
        description: i18n.emptyState.notFoundDesc,
      });
      return;
    }

    const post = postsService.getPostById(parsedId.data);
    if (!post) {
      res.status(404).render('pages/error', {
        title: i18n.emptyState.notFoundTitle,
        description: i18n.emptyState.notFoundDesc,
      });
      return;
    }

    res.render('pages/post', {
      post,
      comments: post.comments,
    });
  });

  return router;
}
