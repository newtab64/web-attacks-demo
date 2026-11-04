import { Router } from 'express';
import { CommentsService } from './service.js';
import { createCommentSchema } from './schemas.js';
import { postIdSchema } from '../posts/schemas.js';

export function createCommentsRouter(mode: 'vulnerable' | 'secure'): Router {
  const router = Router();
  const commentsService = new CommentsService(mode);

  router.post('/posts/:id/comments', (req, res) => {
    const postParsed = postIdSchema.safeParse(req.params.id);
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
  });

  return router;
}
