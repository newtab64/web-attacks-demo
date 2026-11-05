import type { Request, Response } from 'express';
import { CommentsService } from '../../../core/services/comments.service.js';
import { createCommentSchema, postIdSchema } from '../../../core/services/schemas.js';

export function createCommentsController(mode: 'vulnerable' | 'secure') {
  const commentsService = new CommentsService(mode);

  return {
    handleCreateComment(req: Request, res: Response): void {
      const postParsed = postIdSchema.safeParse(req.params['id']);
      if (!postParsed.success) {
        res.redirect('/');
        return;
      }

      const postId = postParsed.data;
      const bodyParsed = createCommentSchema.safeParse(req.body);
      if (!bodyParsed.success) {
        res.redirect(`/posts/${postId}`);
        return;
      }

      const { author_name, content } = bodyParsed.data;
      const comment = commentsService.createComment(postId, author_name, content);

      res.redirect(`/posts/${postId}#comment-${comment.id}`);
    },
  };
}
