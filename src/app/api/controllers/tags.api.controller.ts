import type { Request, Response } from 'express';
import { PostsService } from '../../../core/services/posts.service.js';

export function createTagsApiController(mode: 'vulnerable' | 'secure') {
  const postsService = new PostsService(mode);

  return {
    listTags(_req: Request, res: Response): void {
      const tags = postsService.getAllTags();
      res.status(200).json({ data: tags });
    },
  };
}
