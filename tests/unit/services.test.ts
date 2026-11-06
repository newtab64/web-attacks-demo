import { describe, it, expect, beforeAll } from 'vitest';
import { seedDatabase } from '../../src/core/db/seed.js';
import { AuthService } from '../../src/core/services/auth.service.js';
import { SearchService } from '../../src/core/services/search.service.js';
import { PostsService } from '../../src/core/services/posts.service.js';
import { CommentsService } from '../../src/core/services/comments.service.js';
import { ProfileService } from '../../src/core/services/profile.service.js';

describe('Feature Services & Side-by-Side Branching', () => {
  beforeAll(() => {
    seedDatabase();
  });

  it('AuthService: SQL injection bypass works in vulnerable mode and fails in secure mode', () => {
    const vulnAuth = new AuthService('vulnerable');
    const vulnUser = vulnAuth.login("quantri' --", 'anypassword');
    expect(vulnUser).not.toBeNull();
    expect(vulnUser?.username).toBe('quantri');

    const secAuth = new AuthService('secure');
    const secUser = secAuth.login("quantri' --", 'anypassword');
    expect(secUser).toBeNull();

    const validUser = secAuth.login('quantri', 'quantri123');
    expect(validUser?.username).toBe('quantri');
  });

  it('AuthService: registration stores plaintext in vulnerable mode and bcrypt hash in secure mode', () => {
    const vulnAuth = new AuthService('vulnerable');
    const secAuth = new AuthService('secure');

    vulnAuth.register('newuser_vuln', 'secret123', 'new_vuln@example.com');
    secAuth.register('newuser_sec', 'secret123', 'new_sec@example.com');

    const vulnUser = vulnAuth.getUserByUsername('newuser_vuln');
    expect(vulnUser?.password).toBe('secret123');

    const secUser = secAuth.getUserByUsername('newuser_sec');
    expect(secUser?.password.startsWith('$2')).toBe(true);
  });

  it('SearchService: SQL injection expands results in vulnerable mode and matches literally in secure mode', () => {
    const vulnSearch = new SearchService('vulnerable');
    const vulnResults = vulnSearch.searchTitles("' OR '1'='1");
    expect(vulnResults.length).toBeGreaterThanOrEqual(8);

    const secSearch = new SearchService('secure');
    const secResults = secSearch.searchTitles("' OR '1'='1");
    expect(secResults.length).toBe(0);
  });

  it('PostsService: tag filtering is parameterized and safe in both modes', () => {
    const secPosts = new PostsService('secure');
    const tagged = secPosts.getPostsByTag('nodejs');
    expect(tagged.length).toBeGreaterThanOrEqual(1);

    const unknown = secPosts.getPostsByTag('unknown-tag');
    expect(unknown.length).toBe(0);

    const vulnPosts = new PostsService('vulnerable');
    const vulnTagged = vulnPosts.getPostsByTag('nodejs');
    expect(vulnTagged.length).toBeGreaterThanOrEqual(1);
  });

  it('PostsService: gets post with tags and recent comments', () => {
    const postsService = new PostsService('secure');
    const post = postsService.getPostById(1);
    expect(post).not.toBeNull();
    expect(post?.title).toBeDefined();

    const recentComments = postsService.getRecentComments(5);
    expect(recentComments.length).toBeGreaterThan(0);
    expect(recentComments[0]?.post_id).toBeDefined();
    expect(recentComments[0]?.post_title).toBeDefined();
  });

  it('CommentsService: creates comment and increments comments list', () => {
    const commentsService = new CommentsService('secure');
    const comment = commentsService.createComment(1, 'Kiểm thử viên', 'Bình luận thử nghiệm');
    expect(comment.id).toBeDefined();

    const postComments = commentsService.getCommentsForPost(1);
    expect(postComments.some((c) => c.content === 'Bình luận thử nghiệm')).toBe(true);
  });

  it('ProfileService: updates email successfully', () => {
    const profileService = new ProfileService('secure');
    const updated = profileService.updateEmail(2, 'alice_updated@example.com');
    expect(updated).toBe(true);

    const user = profileService.getUserById(2);
    expect(user?.email).toBe('alice_updated@example.com');
  });
});
