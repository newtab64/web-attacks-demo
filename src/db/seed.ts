import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { getDb } from './client.js';

interface SeedUser {
  username: string;
  pass: string;
  email: string;
  role: 'admin' | 'member';
}

interface SeedTag {
  name: string;
  slug: string;
}

interface SeedComment {
  authorName: string;
  content: string;
  createdAt: string;
}

interface SeedPost {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  authorUsername: string;
  readingTimeMin: number;
  tagSlugs: string[];
  createdAt: string;
  comments: SeedComment[];
}

export const users: SeedUser[] = [
  {
    username: 'admin',
    pass: 'admin123',
    email: 'admin@campusblog.local',
    role: 'admin',
  },
  {
    username: 'alice',
    pass: 'alice123',
    email: 'alice@campusblog.local',
    role: 'member',
  },
  {
    username: 'bob',
    pass: 'bob123',
    email: 'bob@campusblog.local',
    role: 'member',
  },
];

export const tags: SeedTag[] = [
  { name: 'Node.js', slug: 'nodejs' },
  { name: 'Git', slug: 'git' },
  { name: 'Cơ sở dữ liệu', slug: 'database' },
  { name: 'Cộng đồng', slug: 'community' },
  { name: 'Bảo mật', slug: 'security' },
  { name: 'Giao diện', slug: 'frontend' },
];

export const posts: SeedPost[] = [
  {
    title: 'Bắt đầu với Node.js và SQLite',
    slug: 'bat-dau-voi-nodejs-va-sqlite',
    content:
      'SQLite kết hợp rất hợp với Node.js khi bạn đang học cách máy chủ làm việc với cơ sở dữ liệu. Không cần cài dịch vụ nền nào, và cả cơ sở dữ liệu chỉ là một tệp mà bạn có thể sao chép hoặc xóa.\n\nThói quen đáng tập ngay từ ngày đầu là không bao giờ ghép dữ liệu người dùng nhập vào chuỗi truy vấn. Hãy dùng placeholder và để driver truyền giá trị riêng:\n\n```javascript\nconst post = db.prepare("SELECT * FROM posts WHERE id = ?").get(id);\n```\n\nChỉ một dòng này là khác biệt giữa một bài tập hướng dẫn và một thứ bạn có thể yên tâm đưa lên mạng.',
    excerpt:
      'SQLite kết hợp Node.js là bộ công cụ nhẹ để học kiến trúc máy chủ. Không cần cấu hình dịch vụ nền, chỉ cần một tệp.',
    authorUsername: 'alice',
    readingTimeMin: 6,
    tagSlugs: ['nodejs', 'database'],
    createdAt: '2026-10-27 10:00:00',
    comments: [
      {
        authorName: 'Trần Quốc Bảo',
        content: 'Phần giới thiệu hay quá. Lần sau bạn viết về transaction được không?',
        createdAt: '2026-10-27 11:30:00',
      },
      {
        authorName: 'Quản trị viên',
        content: 'Cảm ơn bạn đã chia sẻ cho cộng đồng.',
        createdAt: '2026-10-27 12:00:00',
      },
    ],
  },
  {
    title: 'Điều mình học được khi hoàn thành dự án nhóm đầu tiên',
    slug: 'dieu-minh-hoc-duoc-khi-hoan-thanh-du-an-nhom-dau-tien',
    content:
      'Ba người, một repository và một hạn nộp bài tập lớn. Những ngày đầu cả nhóm liên tục gặp conflict vì ai cũng đẩy code trực tiếp lên nhánh main.\n\nSau tuần đầu bối rối, tụi mình thống nhất quy trình làm việc với feature branch, pull request và bắt buộc ít nhất một người duyệt trước khi merge. Dự án hoàn thành đúng hạn và ai cũng học được cách phối hợp chuyên nghiệp.',
    excerpt: 'Ba người, một repo và một hạn nộp. Những lỗi tụi mình mắc với branch và cách sửa.',
    authorUsername: 'bob',
    readingTimeMin: 8,
    tagSlugs: ['git', 'community'],
    createdAt: '2026-10-26 14:00:00',
    comments: [
      {
        authorName: 'Nguyễn Minh Anh',
        content: 'Nhóm mình hồi năm nhất cũng y chang! Nhánh main bị vỡ liên tục.',
        createdAt: '2026-10-26 15:10:00',
      },
    ],
  },
  {
    title: 'Chào mừng đến với Campus Devs',
    slug: 'chao-mung-den-voi-campus-devs',
    content:
      'Campus Devs là không gian dành riêng cho các bạn sinh viên đam mê công nghệ và lập trình. Tại đây, bạn có thể chia sẻ các bài học kinh nghiệm, đặt câu hỏi về các lỗi thường gặp trong đồ án, hoặc giới thiệu sản phẩm phần mềm của nhóm mình.\n\nHãy cùng nhau xây dựng một cộng đồng học thuật cởi mở và tiến bộ!',
    excerpt:
      'Nơi các bạn sinh viên lập trình chia sẻ hướng dẫn, tin công nghệ trong trường và các dự án code.',
    authorUsername: 'admin',
    readingTimeMin: 2,
    tagSlugs: ['community'],
    createdAt: '2026-10-25 09:00:00',
    comments: [
      {
        authorName: 'alice',
        content: 'Rất vui được đồng hành cùng mọi người!',
        createdAt: '2026-10-25 09:30:00',
      },
    ],
  },
  {
    title: 'Tối ưu hiệu năng truy vấn trong SQLite',
    slug: 'toi-uu-hieu-nang-truy-van-trong-sqlite',
    content:
      'Khi dữ liệu tăng lên hàng chục ngàn dòng, việc thiếu index sẽ khiến truy vấn chậm rõ rệt. Hãy sử dụng EXPLAIN QUERY PLAN để kiểm tra xem SQLite có đang duyệt toàn bộ bảng hay sử dụng chỉ mục thích hợp.\n\nNgoài ra, luôn bọc các thao tác ghi hàng loạt trong transaction để giảm thiểu thao tác ghi đĩa vật lý.',
    excerpt:
      'Cách sử dụng index và transaction để tăng tốc độ đọc ghi cơ sở dữ liệu lên gấp nhiều lần.',
    authorUsername: 'alice',
    readingTimeMin: 5,
    tagSlugs: ['database'],
    createdAt: '2026-10-28 16:00:00',
    comments: [],
  },
  {
    title: 'Xây dựng giao diện web chuẩn Accessibility',
    slug: 'xay-dung-giao-dien-web-chuan-accessibility',
    content:
      'Một website tốt không chỉ đẹp mà còn phải tiếp cận được với mọi đối tượng người dùng, bao gồm cả những người sử dụng trình đọc màn hình. Hãy chú ý đến độ tương phản màu sắc, cấu trúc heading hợp lý và hỗ trợ điều hướng hoàn toàn bằng bàn phím.\n\nSử dụng thẻ semantic như `<main>`, `<nav>`, `<article>` thay vì chỉ dùng thẻ `<div>`.',
    excerpt:
      'Các nguyên tắc cốt lõi giúp giao diện web thân thiện với bàn phím và trình đọc màn hình.',
    authorUsername: 'bob',
    readingTimeMin: 7,
    tagSlugs: ['frontend'],
    createdAt: '2026-10-29 11:00:00',
    comments: [
      {
        authorName: 'admin',
        content: 'Bài viết rất thiết thực cho các bạn làm đồ án môn Web.',
        createdAt: '2026-10-29 13:00:00',
      },
    ],
  },
  {
    title: 'Hiểu về Git Rebase và Git Merge',
    slug: 'hieu-ve-git-rebase-va-git-merge',
    content:
      'Git merge giữ nguyên toàn bộ lịch sử các commit phân nhánh, trong khi Git rebase viết lại lịch sử thành một đường thẳng liền mạch. Khi làm việc cá nhân trên feature branch, rebase giúp nhánh gọn gàng trước khi tạo pull request.\n\nTuy nhiên, tuyệt đối không rebase các commit đã được đẩy lên nhánh công khai mà nhiều người cùng làm việc.',
    excerpt: 'So sánh ưu nhược điểm giữa merge và rebase cùng nguyên tắc vàng khi làm việc nhóm.',
    authorUsername: 'bob',
    readingTimeMin: 4,
    tagSlugs: ['git'],
    createdAt: '2026-10-30 08:30:00',
    comments: [],
  },
  {
    title: 'Kinh nghiệm viết Unit Test cho người mới bắt đầu',
    slug: 'kinh-nghiem-viet-unit-test-cho-nguoi-moi-bat-dau',
    content:
      'Viết test ban đầu có vẻ tốn thời gian, nhưng nó tiết kiệm hàng giờ gỡ lỗi khi dự án mở rộng. Hãy bắt đầu từ các hàm thuần túy (pure functions), kiểm tra cả trường hợp đầu vào hợp lệ lẫn trường hợp biên.\n\nSử dụng các framework hiện đại như Vitest giúp việc chạy test diễn ra tức thì nhờ tốc độ xử lý nhanh chóng.',
    excerpt: 'Tại sao bạn nên tập viết test từ sớm và cách tiếp cận từ dễ đến khó với Vitest.',
    authorUsername: 'alice',
    readingTimeMin: 5,
    tagSlugs: ['nodejs'],
    createdAt: '2026-10-31 15:45:00',
    comments: [
      {
        authorName: 'bob',
        content: 'Nhờ có test mà refactor code tự tin hơn hẳn!',
        createdAt: '2026-10-31 17:00:00',
      },
    ],
  },
  {
    title: 'Phân biệt Authentication và Authorization',
    slug: 'phan-biet-authentication-va-authorization',
    content:
      'Authentication (Xác thực) trả lời câu hỏi: Bạn là ai? Còn Authorization (Phân quyền) trả lời câu hỏi: Bạn có quyền làm gì?\n\nTrong các ứng dụng web, việc nhầm lẫn hoặc kiểm tra phân quyền lỏng lẻo có thể dẫn đến các lỗ hổng nghiêm trọng như IDOR (Insecure Direct Object Reference). Luôn kiểm tra quyền truy cập ở tầng máy chủ đối với mỗi hành động nhạy cảm.',
    excerpt:
      'Khái niệm nền tảng trong an toàn thông tin web và những sai lầm phổ biến khi triển khai.',
    authorUsername: 'admin',
    readingTimeMin: 6,
    tagSlugs: ['security'],
    createdAt: '2026-11-01 10:15:00',
    comments: [],
  },
  {
    title: 'Giới thiệu về bảo mật Cookie và phiên làm việc',
    slug: 'gioi-thieu-ve-bao-mat-cookie-va-phien-lam-viec',
    content:
      'Quản lý phiên làm việc bằng cookie đòi hỏi các cờ bảo vệ bắt buộc: HttpOnly để ngăn chặn đánh cắp qua XSS, Secure để chỉ truyền qua HTTPS, và SameSite=Lax hoặc Strict để phòng vệ CSRF.\n\nHiểu rõ cách trình duyệt xử lý cookie giữa các origin khác nhau giúp lập trình viên tránh được những rủi ro bảo mật nghiêm trọng.',
    excerpt:
      'Tác dụng của các cờ HttpOnly, Secure và SameSite trong việc ngăn chặn đánh cắp cookie và CSRF.',
    authorUsername: 'admin',
    readingTimeMin: 7,
    tagSlugs: ['security'],
    createdAt: '2026-11-02 08:30:00',
    comments: [],
  },
];

function seedDb(mode: 'vulnerable' | 'secure'): void {
  const db = getDb(mode);
  const schemaPath = path.resolve('src/db/schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  // Reset database schema inside transaction
  db.exec('PRAGMA foreign_keys = OFF;');
  db.exec(`
    DROP TABLE IF EXISTS post_tags;
    DROP TABLE IF EXISTS tags;
    DROP TABLE IF EXISTS comments;
    DROP TABLE IF EXISTS posts;
    DROP TABLE IF EXISTS users;
  `);
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(schemaSql);

  const runSeed = db.transaction(() => {
    // Insert users
    const insertUser = db.prepare(
      'INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)',
    );
    const userMap = new Map<string, number>();

    for (const u of users) {
      const storedPassword = mode === 'secure' ? bcrypt.hashSync(u.pass, 10) : u.pass;
      const info = insertUser.run(u.username, storedPassword, u.email, u.role);
      userMap.set(u.username, Number(info.lastInsertRowid));
    }

    // Insert tags
    const insertTag = db.prepare('INSERT INTO tags (name, slug) VALUES (?, ?)');
    const tagMap = new Map<string, number>();
    for (const t of tags) {
      const info = insertTag.run(t.name, t.slug);
      tagMap.set(t.slug, Number(info.lastInsertRowid));
    }

    // Insert posts and comments
    const insertPost = db.prepare(
      'INSERT INTO posts (title, slug, content, excerpt, author_id, reading_time_min, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    );
    const insertPostTag = db.prepare('INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)');
    const insertComment = db.prepare(
      'INSERT INTO comments (post_id, author_name, content, created_at) VALUES (?, ?, ?, ?)',
    );

    for (const p of posts) {
      const authorId = userMap.get(p.authorUsername);
      if (!authorId) continue;

      const postInfo = insertPost.run(
        p.title,
        p.slug,
        p.content,
        p.excerpt,
        authorId,
        p.readingTimeMin,
        p.createdAt,
      );
      const postId = Number(postInfo.lastInsertRowid);

      for (const tagSlug of p.tagSlugs) {
        const tagId = tagMap.get(tagSlug);
        if (tagId) {
          insertPostTag.run(postId, tagId);
        }
      }

      for (const c of p.comments) {
        insertComment.run(postId, c.authorName, c.content, c.createdAt);
      }
    }
  });

  runSeed();
}

export function seedDatabase(): void {
  seedDb('vulnerable');
  seedDb('secure');
}

// CLI invocation
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('[Seed] Seeding databases...');
  seedDatabase();
  console.log('[Seed] Both data/vulnerable.db and data/secure.db seeded successfully.');
}
