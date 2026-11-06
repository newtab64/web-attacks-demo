import { describe, it, expect } from 'vitest';
import { i18n } from '../../src/core/i18n/vi.js';

describe('Vietnamese i18n Dictionary', () => {
  it('contains all required top-level sections', () => {
    expect(i18n.brand.name).toBe('Trạm Dev');
    expect(i18n.nav.home).toBe('Trang chủ');
    expect(i18n.nav.login).toBe('Đăng nhập');
    expect(i18n.nav.register).toBe('Đăng ký');
    expect(i18n.nav.logout).toBe('Đăng xuất');
    expect(i18n.nav.profile).toBe('Hồ sơ');
    expect(i18n.nav.searchPlaceholder).toBe('Tìm bài viết');
  });

  it('contains empty state and tag labels', () => {
    expect(i18n.sidebar.allTags).toBe('Tất cả');
    expect(i18n.sidebar.tagsHeading).toBe('Duyệt theo thẻ');
    expect(i18n.sidebar.recentCommentsHeading).toBe('Bình luận gần đây');
    expect(i18n.emptyState.noTagPosts).toBe('Chưa có bài viết nào với thẻ này');
  });

  it('contains flash and auth messages', () => {
    expect(i18n.auth.loginFailed).toBe('Tên đăng nhập hoặc mật khẩu không đúng.');
    expect(i18n.profile.emailUpdated).toBe('Đã cập nhật email.');
  });
});
