import { Router } from 'express';
import { createHomeController } from './controllers/home.controller.js';
import { createPostsController } from './controllers/posts.controller.js';
import { createCommentsController } from './controllers/comments.controller.js';
import { createAuthController } from './controllers/auth.controller.js';
import { createProfileController } from './controllers/profile.controller.js';
import { createSearchController } from './controllers/search.controller.js';
import { createRateLimitMiddleware } from '../../core/security/rate-limit.js';

export function createWebRouter(mode: 'vulnerable' | 'secure'): Router {
  const router = Router();
  const isSecure = mode === 'secure';

  const homeController = createHomeController(mode);
  const postsController = createPostsController(mode);
  const commentsController = createCommentsController(mode);
  const authController = createAuthController(mode);
  const profileController = createProfileController(mode);
  const searchController = createSearchController(mode);

  // Home & Posts
  router.get('/', homeController.renderHome);
  router.get('/posts/:id', postsController.renderPostDetail);
  router.post('/posts/:id/comments', commentsController.handleCreateComment);

  // Authentication
  router.get('/login', authController.renderLogin);
  router.post('/login', createRateLimitMiddleware(isSecure), authController.handleLogin);
  router.get('/register', authController.renderRegister);
  router.post('/register', authController.handleRegister);
  router.post('/logout', authController.handleLogout);

  // Profile
  router.get('/profile', profileController.renderProfile);
  router.post('/profile/email', profileController.handleUpdateEmail);

  // Search
  router.get('/search', searchController.renderSearch);

  return router;
}
