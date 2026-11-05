import type { Request, Response } from 'express';
import { PostsService } from '../../../core/services/posts.service.js';
import { CommentsService } from '../../../core/services/comments.service.js';
import { postIdSchema, tagQuerySchema } from '../../../core/services/schemas.js';

export function createPostsApiController(mode: 'vulnerable' | 'secure') {
  const postsService = new PostsService(mode);
  const commentsService = new CommentsService(mode);

  return {
    listPosts(req: Request, res: Response): void {
      const rawTag = req.query['tag'];
      const tagParse = tagQuerySchema.safeParse(rawTag);
      const activeTag = tagParse.success && tagParse.data ? tagParse.data : null;

      if (activeTag) {
        const posts = postsService.getPostsByTag(activeTag);
        res.status(200).json({
          data: {
            posts,
            total: posts.length,
            activeTag,
          },
        });
        return;
      }

      const { posts, total } = postsService.getAllPosts(1, 100);
      res.status(200).json({
        data: {
          posts,
          total,
          activeTag: null,
        },
      });
    },

    getPostById(req: Request, res: Response): void {
      const parsed = postIdSchema.safeParse(req.params['id']);
      if (!parsed.success) {
        res.status(404).json({ error: 'Bài viết không tồn tại.' });
        return;
      }

      const post = postsService.getPostById(parsed.data);
      if (!post) {
        res.status(404).json({ error: 'Bài viết không tồn tại.' });
        return;
      }

      const comments = commentsService.getCommentsForPost(post.id);
      res.status(200).json({
        data: {
          post,
          comments,
        },
      });
    },
  };
}
