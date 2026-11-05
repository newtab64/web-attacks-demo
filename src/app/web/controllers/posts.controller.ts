import type { Request, Response } from 'express';
import { PostsService } from '../../../core/services/posts.service.js';
import { CommentsService } from '../../../core/services/comments.service.js';
import { postIdSchema } from '../../../core/services/schemas.js';

export function createPostsController(mode: 'vulnerable' | 'secure') {
  const postsService = new PostsService(mode);
  const commentsService = new CommentsService(mode);

  return {
    renderPostDetail(req: Request, res: Response): void {
      const parsed = postIdSchema.safeParse(req.params['id']);
      if (!parsed.success) {
        res.status(404).render('pages/error', {
          title: res.locals.i18n.emptyState.notFoundTitle,
          description: res.locals.i18n.emptyState.notFoundDesc,
        });
        return;
      }

      const post = postsService.getPostById(parsed.data);
      if (!post) {
        res.status(404).render('pages/error', {
          title: res.locals.i18n.emptyState.notFoundTitle,
          description: res.locals.i18n.emptyState.notFoundDesc,
        });
        return;
      }

      const comments = commentsService.getCommentsForPost(post.id);

      res.render('pages/post', {
        post,
        comments,
      });
    },
  };
}
