import type { Request, Response } from 'express';
import { CommentsService } from '../../../core/services/comments.service.js';
import { PostsService } from '../../../core/services/posts.service.js';
import { createCommentSchema, postIdSchema } from '../../../core/services/schemas.js';

export function createCommentsApiController(mode: 'vulnerable' | 'secure') {
  const commentsService = new CommentsService(mode);
  const postsService = new PostsService(mode);

  return {
    createComment(req: Request, res: Response): void {
      const postParsed = postIdSchema.safeParse(req.params['id']);
      if (!postParsed.success) {
        res.status(404).json({ error: 'Bài viết không tồn tại.' });
        return;
      }

      const postId = postParsed.data;
      const post = postsService.getPostById(postId);
      if (!post) {
        res.status(404).json({ error: 'Bài viết không tồn tại.' });
        return;
      }

      const bodyParsed = createCommentSchema.safeParse(req.body);
      if (!bodyParsed.success) {
        res.status(400).json({ error: 'Họ tên và nội dung bình luận là bắt buộc.' });
        return;
      }

      const { author_name, content } = bodyParsed.data;
      const comment = commentsService.createComment(postId, author_name, content);
      res.status(201).json({ data: comment });
    },

    getRecentComments(_req: Request, res: Response): void {
      const recent = postsService.getRecentComments(5);
      res.status(200).json({ data: recent });
    },
  };
}
