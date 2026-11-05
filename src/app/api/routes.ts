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
  router.post('/auth/login', createApiRateLimitMiddleware(isSecure), (req, res) => {
    authController.login(req, res);
  });
  router.post('/auth/register', (req, res) => {
    authController.register(req, res);
  });
  router.post('/auth/logout', (req, res) => {
    authController.logout(req, res);
  });

  // Posts & Comments
  router.get('/posts', (req, res) => {
    postsController.listPosts(req, res);
  });
  router.get('/posts/:id', (req, res) => {
    postsController.getPostById(req, res);
  });
  router.post('/posts/:id/comments', (req, res) => {
    commentsController.createComment(req, res);
  });
  router.get('/comments/recent', (req, res) => {
    commentsController.getRecentComments(req, res);
  });

  // Tags
  router.get('/tags', (req, res) => {
    tagsController.listTags(req, res);
  });

  // Profile
  router.get('/profile', (req, res) => {
    profileController.getProfile(req, res);
  });
  router.post('/profile/email', (req, res) => {
    profileController.updateEmail(req, res);
  });

  // Search
  router.get('/search', (req, res) => {
    searchController.search(req, res);
  });

  // Catch-all 404 & error handler for API
  router.use(apiNotFoundHandler);
  router.use(apiErrorHandler);

  return router;
}
