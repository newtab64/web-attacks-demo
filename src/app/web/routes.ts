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
  router.get('/', (req, res) => {
    homeController.renderHome(req, res);
  });
  router.get('/posts/:id', (req, res) => {
    postsController.renderPostDetail(req, res);
  });
  router.post('/posts/:id/comments', (req, res) => {
    commentsController.handleCreateComment(req, res);
  });

  // Authentication
  router.get('/login', (req, res) => {
    authController.renderLogin(req, res);
  });
  router.post('/login', createRateLimitMiddleware(isSecure), (req, res) => {
    authController.handleLogin(req, res);
  });
  router.get('/register', (req, res) => {
    authController.renderRegister(req, res);
  });
  router.post('/register', (req, res) => {
    authController.handleRegister(req, res);
  });
  router.post('/logout', (req, res) => {
    authController.handleLogout(req, res);
  });

  // Profile
  router.get('/profile', (req, res) => {
    profileController.renderProfile(req, res);
  });
  router.post('/profile/email', (req, res) => {
    profileController.handleUpdateEmail(req, res);
  });

  // Search
  router.get('/search', (req, res) => {
    searchController.renderSearch(req, res);
  });

  return router;
}
