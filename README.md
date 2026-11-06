# Trạm Dev: Demo tấn công web và cách phòng chống

**Chủ đề 3 · Lập trình web và ứng dụng (503073)**

## Câu chuyện

Trạm Dev trông giống một blog bình thường của sinh viên lập trình: có bài viết, bình luận, tìm kiếm và đăng nhập. Nhìn bề ngoài, không có gì bất thường.

Hãy chạy ở **chế độ có lỗ hổng** và xem kẻ tấn công làm được gì:

1. **SQL injection.** Nhập `quantri' --` vào ô tên đăng nhập, bạn đăng nhập được với quyền quản trị mà không cần mật khẩu. Tìm kiếm `' OR '1'='1` và toàn bộ bài viết hiện ra.
2. **XSS.** Gửi bình luận `<img src=x onerror=alert('Stored')>`. Đoạn mã này chạy trên trình duyệt của mọi người xem bài.
3. **CSRF.** Một bạn sinh viên mở trang "nhận quà" ở một website khác, và email của bạn ấy bị đổi mà không cần thao tác gì.
4. **Lừa đảo (phishing).** Một bản sao trang đăng nhập tại `localhost:4000` thu lại mật khẩu mà mọi người gõ vào.

Sau đó khởi động lại ở **chế độ an toàn** và làm lại từng bước. Cùng một trang web, cùng những đoạn tấn công, nhưng tất cả đều thất bại nhờ truy vấn tham số hóa, thoát ký tự đầu ra, CSRF token, mật khẩu băm bcrypt, giới hạn số lần đăng nhập và các header bảo mật nghiêm ngặt.

Điểm mấu chốt là sự đối lập: hai chế độ nhìn giống hệt nhau, chỉ khác ở phần mã bên dưới.

Các bước chi tiết, đoạn mã tấn công và kết quả mong đợi của từng kịch bản nằm trong [docs/ATTACKS.md](docs/ATTACKS.md).

## Chạy thử

Cần Node.js 22.

```bash
npm install
npm run seed          # tạo cả hai cơ sở dữ liệu
npm start             # chế độ an toàn (mặc định) -> http://localhost:3000
```

```bash
SECURITY_MODE=vulnerable npm start   # chế độ có lỗ hổng
SHOW_MODE_BADGE=1 npm start          # hiện nhãn chế độ nhỏ ở góc màn hình
npm run attacker                     # máy chủ kẻ tấn công -> http://localhost:4000
```

Máy chủ kẻ tấn công phục vụ trang lừa đảo (`/phishing.html`), trang CSRF (`/csrf.html`) và bảng thống kê mật khẩu bị thu thập (`/captured`).

## Tài khoản thử nghiệm

| Tên đăng nhập | Mật khẩu     | Vai trò       |
| :------------ | :----------- | :------------ |
| `quantri`     | `quantri123` | Quản trị viên |
| `minhanh`     | `minhanh123` | Thành viên    |
| `quocbao`     | `quocbao123` | Thành viên    |

Chế độ có lỗ hổng lưu mật khẩu dạng văn bản thuần (`data/vulnerable.db`). Chế độ an toàn lưu mật khẩu đã băm bằng bcrypt (`data/secure.db`).

## Cấu trúc bên trong

TypeScript, Express, EJS và SQLite, giao diện dùng Tailwind. Toàn bộ giao diện bằng tiếng Việt và không có JavaScript phía trình duyệt. Mã nguồn chia thành `src/app/web` (các trang), `src/app/api` (API JSON tại `/api/v1`) và `src/core` (dịch vụ, cơ sở dữ liệu, middleware bảo mật).

```bash
npm run check         # kiểm tra kiểu, lint, định dạng và toàn bộ test
npm run screenshots   # tạo lại ảnh trong docs/screenshots
```
