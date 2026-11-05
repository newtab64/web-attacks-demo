import { Router } from 'express';
import { createAuthApiController } from './controllers/auth.api.controller.js';
import { createPostsApiController } from './controllers/posts.api.controller.js';
import { createCommentsApiController } from './controllers/comments.api.controller.js';
import { createTagsApiController } from './controllers/tags.api.controller.js';
import { createProfileApiController } from './controllers/profile.api.controller.js';
import { createSearchApiController } from './controllers/search.api.controller.js';
import { createApiRateLimitMiddleware } from './middleware/api-rate-limit.js';
import { apiNotFoundHandler, apiErrorHandler } from './middleware/api-error-handler.js';

export function createApiRouter(mode: 'vulnerable' | 'secure'): Router {
  const router = Router();
  const isSecure = mode === 'secure';

  const authController = createAuthApiController(mode);
  const postsController = createPostsApiController(mode);
  const commentsController = createCommentsApiController(mode);
  const tagsController = createTagsApiController(mode);
  const profileController = createProfileApiController(mode);
  const searchController = createSearchApiController(mode);

  // Authentication
  router.post('/auth/login', createApiRateLimitMiddleware(isSecure), authController.login);
  router.post('/auth/register', authController.register);
  router.post('/auth/logout', authController.logout);

  // Posts & Comments
  router.get('/posts', postsController.listPosts);
  router.get('/posts/:id', postsController.getPostById);
  router.post('/posts/:id/comments', commentsController.createComment);
  router.get('/comments/recent', commentsController.getRecentComments);

  // Tags
  router.get('/tags', tagsController.listTags);

  // Profile
  router.get('/profile', profileController.getProfile);
  router.post('/profile/email', profileController.updateEmail);

  // Search
  router.get('/search', searchController.search);

  // Catch-all 404 & error handler for API
  router.use(apiNotFoundHandler);
  router.use(apiErrorHandler);

  return router;
}
