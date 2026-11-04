import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { getDb } from './client.js';

interface SeedUser {
  username: string;
  pass: string;
  email: string;
  role: string;
}

interface SeedTag {
  name: string;
  slug: string;
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
  comments: Array<{
    authorName: string;
    content: string;
    createdAt: string;
  }>;
}

const users: SeedUser[] = [
  { username: 'admin', pass: 'admin123', email: 'admin@campusblog.local', role: 'admin' },
  { username: 'alice', pass: 'alice123', email: 'alice@campusblog.local', role: 'user' },
  { username: 'bob', pass: 'bob123', email: 'bob@campusblog.local', role: 'user' },
];

const tags: SeedTag[] = [
  { name: 'Node.js', slug: 'nodejs' },
  { name: 'Git', slug: 'git' },
  { name: 'Cơ sở dữ liệu', slug: 'database' },
  { name: 'Cộng đồng', slug: 'community' },
  { name: 'Làm việc nhóm', slug: 'teamwork' },
  { name: 'Bảo mật web', slug: 'security' },
];

const posts: SeedPost[] = [
  {
    title: 'Bắt đầu với Node.js và SQLite',
    slug: 'bat-dau-voi-nodejs-va-sqlite',
    content:
      'SQLite kết hợp rất hợp với Node.js khi bạn đang học cách máy chủ làm việc với cơ sở dữ liệu. Không cần cài dịch vụ nền nào, và cả cơ sở dữ liệu chỉ là một tệp mà bạn có thể sao chép hoặc xóa.\n\nThói quen đáng tập ngay từ ngày đầu là không bao giờ ghép dữ liệu người dùng nhập vào chuỗi truy vấn. Hãy dùng placeholder và để driver truyền giá trị riêng:\n\n```js\nconst post = db.prepare("SELECT * FROM posts WHERE id = ?").get(id);\n```\n\nChỉ một dòng này là khác biệt giữa một bài tập hướng dẫn và một thứ bạn có thể yên tâm đưa lên mạng.',
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
        content: 'Cảm ơn bạn đã chia sẻ bài viết hữu ích cho cộng đồng sinh viên.',
        createdAt: '2026-10-27 14:00:00',
      },
    ],
  },
  {
    title: 'Điều mình học được khi hoàn thành dự án nhóm đầu tiên',
    slug: 'dieu-minh-hoc-duoc-khi-hoan-thanh-du-an-nhom',
    content:
      'Ba người, một repository và một hạn nộp bài dồn dập. Những tuần đầu tiên của dự án nhóm là chuỗi ngày merge conflict liên miên vì cả ba bạn đều commit thẳng vào nhánh main.\n\nSau lần suýt mất mã nguồn vào tuần thứ hai, nhóm quyết định họp lại và đặt ra quy tắc branch: mỗi tính năng có nhánh riêng, mọi pull request cần ít nhất một bạn khác duyệt trước khi merge. Bài học lớn nhất không phải là kỹ thuật code, mà là cách giao tiếp và tôn trọng quy trình chung.',
    excerpt:
      'Ba người, một repo và một hạn nộp. Những lỗi tụi mình mắc với branch và cách sửa để làm việc nhóm ăn ý hơn.',
    authorUsername: 'bob',
    readingTimeMin: 8,
    tagSlugs: ['teamwork', 'git'],
    createdAt: '2026-10-26 14:30:00',
    comments: [
      {
        authorName: 'Nguyễn Minh Anh',
        content: 'Đồng cảm sâu sắc! Nhóm mình kì trước cũng mất cả đêm giải quyết conflict.',
        createdAt: '2026-10-26 16:00:00',
      },
    ],
  },
  {
    title: 'Chào mừng đến với Campus Devs',
    slug: 'chao-mung-den-voi-campus-devs',
    content:
      'Chào mừng các bạn sinh viên đam mê công nghệ đến với Campus Devs! Đây là không gian mở dành cho sinh viên chia sẻ kinh nghiệm học tập, ghi chép kỹ thuật và các dự án thực tế.\n\nMục tiêu của diễn đàn là tạo ra môi trường học thuật tích cực, nơi mọi câu hỏi đều được trân trọng và những sản phẩm dù nhỏ nhất cũng được đón nhận và góp ý chân thành.',
    excerpt:
      'Nơi các bạn sinh viên lập trình chia sẻ hướng dẫn, tin công nghệ trong trường và các dự án code thực tế.',
    authorUsername: 'admin',
    readingTimeMin: 3,
    tagSlugs: ['community'],
    createdAt: '2026-10-25 08:00:00',
    comments: [
      {
        authorName: 'alice',
        content: 'Tuyệt vời quá! Mong diễn đàn sẽ ngày càng phát triển.',
        createdAt: '2026-10-25 09:15:00',
      },
      {
        authorName: 'bob',
        content: 'Rất vui được đồng hành cùng các bạn!',
        createdAt: '2026-10-25 10:20:00',
      },
    ],
  },
  {
    title: 'Tối ưu truy vấn SQLite cho ứng dụng nhỏ',
    slug: 'toi-uu-truy-van-sqlite-cho-ung-dung-nho',
    content:
      'Khi ứng dụng bắt đầu có hàng chục ngàn dòng dữ liệu, các truy vấn không có chỉ mục (INDEX) sẽ làm ứng dụng chậm thấy rõ.\n\nBằng cách sử dụng lệnh EXPLAIN QUERY PLAN, chúng ta có thể xem SQLite có đang thực hiện SCAN TABLE hay SEARCH TABLE USING INDEX. Hãy luôn thêm chỉ mục cho các trường thường xuyên xuất hiện trong mệnh đề WHERE và ORDER BY.',
    excerpt:
      'Hiểu cách đánh chỉ mục (INDEX) và đọc kế hoạch thực thi EXPLAIN QUERY PLAN trong SQLite để tăng tốc độ trang.',
    authorUsername: 'alice',
    readingTimeMin: 5,
    tagSlugs: ['database', 'nodejs'],
    createdAt: '2026-10-28 15:45:00',
    comments: [],
  },
  {
    title: 'Quy trình Git branch hiệu quả cho nhóm sinh viên',
    slug: 'quy-trinh-git-branch-hieu-qua-cho-nhom-sinh-vien',
    content:
      'Lựa chọn mô hình nhánh phù hợp là chìa khóa để giữ lịch sử commit rõ ràng. Thay vì các mô hình phức tạp như Git Flow, các nhóm sinh viên nên áp dụng Trunk-based development hoặc GitHub Flow đơn giản hóa.\n\nMỗi tính năng được tạo trên một branch ngắn hạn và nhanh chóng được tích hợp lại sau khi kiểm thử.',
    excerpt:
      'Hướng dẫn áp dụng GitHub Flow đơn giản để các nhóm dự án sinh viên không bị rối loạn lịch sử commit.',
    authorUsername: 'bob',
    readingTimeMin: 7,
    tagSlugs: ['git', 'teamwork'],
    createdAt: '2026-10-29 11:20:00',
    comments: [
      {
        authorName: 'Nguyễn Văn C',
        content: 'Bài viết rất dễ hiểu cho người mới bắt đầu dùng Git nhóm.',
        createdAt: '2026-10-29 13:00:00',
      },
    ],
  },
  {
    title: 'Tìm hiểu về tấn công Injection và cách phòng chống',
    slug: 'tim-hieu-ve-tan-cong-injection-va-cach-phong-chong',
    content:
      'SQL Injection là một trong những lỗ hổng kinh điển nhất trong an toàn thông tin web. Lỗ hổng xuất hiện khi dữ liệu do người dùng cung cấp bị hiểu nhầm là mã lệnh truy vấn.\n\nGiải pháp triệt để và duy nhất được khuyến nghị bởi OWASP là luôn luôn sử dụng Parameterized Queries (Prepared Statements). Không bao giờ tự ghép chuỗi SQL thủ công.',
    excerpt:
      'Phân tích cơ chế của lỗi ghép chuỗi SQL và tại sao prepared statement là tuyến phòng thủ bắt buộc.',
    authorUsername: 'admin',
    readingTimeMin: 9,
    tagSlugs: ['security', 'database'],
    createdAt: '2026-10-30 09:10:00',
    comments: [
      {
        authorName: 'alice',
        content: 'Kiến thức cốt lõi cho môn An toàn mạng máy tính kì này!',
        createdAt: '2026-10-30 10:45:00',
      },
    ],
  },
  {
    title: 'Xây dựng API RESTful chuẩn mực với Express',
    slug: 'xay-dung-api-restful-chuan-muc-voi-express',
    content:
      'Thiết kế REST API đòi hỏi sự nhất quán về quy ước đặt tên endpoint, mã trạng thái HTTP (status code) và cấu trúc phản hồi JSON.\n\nLuôn sử dụng đúng động từ HTTP: GET để truy vấn, POST để tạo mới, PUT/PATCH để cập nhật và DELETE để xóa. Tránh dùng GET cho các thao tác thay đổi trạng thái máy chủ.',
    excerpt:
      'Các nguyên tắc thiết kế REST API dễ mở rộng, quy ước đặt tên URL và sử dụng đúng HTTP status codes.',
    authorUsername: 'alice',
    readingTimeMin: 6,
    tagSlugs: ['nodejs'],
    createdAt: '2026-10-31 16:00:00',
    comments: [],
  },
  {
    title: 'Kinh nghiệm ôn tập môn Kiến trúc phần mềm',
    slug: 'kinh-nghiem-on-tap-mon-kien-truc-phan-mem',
    content:
      'Môn Kiến trúc phần mềm thường làm sinh viên bỡ ngỡ vì chuyển từ việc viết từng hàm sang thiết kế hệ thống tổng thể.\n\nHãy tập trung nắm vững các mẫu kiến trúc phổ biến: Layered Architecture, Client-Server, Event-Driven và Microservices. Vẽ lại sơ đồ luồng dữ liệu là cách tốt nhất để ghi nhớ.',
    excerpt:
      'Tóm tắt các mẫu kiến trúc kinh điển và mẹo làm bài tập lớn môn kiến trúc hệ thống đạt điểm cao.',
    authorUsername: 'bob',
    readingTimeMin: 8,
    tagSlugs: ['teamwork', 'community'],
    createdAt: '2026-11-01 10:00:00',
    comments: [
      {
        authorName: 'Lê Hoàng D',
        content: 'Cảm ơn anh Bảo, bài viết rất đúng lúc trước đợt thi giữa kì.',
        createdAt: '2026-11-01 14:10:00',
      },
    ],
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

  // Reset database schema
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
}

export function seedDatabase(): void {
  seedDb('vulnerable');
  seedDb('secure');
}

// CLI invocation
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Seeding data/vulnerable.db and data/secure.db...');
  seedDatabase();
  console.log('Database seeding complete.');
}
