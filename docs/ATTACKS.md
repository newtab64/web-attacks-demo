# Classroom Demonstration Guide: Web Attacks & Countermeasures

This document serves as your live lecture demo script for university computer science and cybersecurity courses. For each attack, follow the step-by-step instructions, paste the provided payloads, and observe the contrast between **Vulnerable Mode** (`SECURITY_MODE=vulnerable`) and **Secure Mode** (`SECURITY_MODE=secure`).

---

## Overview of Demonstrated Vulnerabilities

| #     | Attack Vector                         | Entry Point                                            | Vulnerable Mode Behavior                                              | Secure Mode Countermeasure                                       |
| :---- | :------------------------------------ | :----------------------------------------------------- | :-------------------------------------------------------------------- | :--------------------------------------------------------------- |
| **1** | **SQL Injection (SQLi)**              | `/login` & `/search`                                   | String interpolation allows auth bypass and full table disclosure     | Parameterized queries (`?` bindings)                             |
| **2** | **Cross-Site Scripting (XSS)**        | `/search` (Reflected) & `/posts/:id/comments` (Stored) | Unescaped template output (`<%- %>`) executes arbitrary JavaScript    | HTML escaping (`<%= %>`) + Strict CSP                            |
| **3** | **Cross-Site Request Forgery (CSRF)** | Profile Email Update (`POST /profile/email`)           | No CSRF token & unrestricted cookies allow state alteration           | CSRF token verification + `SameSite=Lax`                         |
| **4** | **Broken Auth & Session Management**  | Login form & Cookies                                   | Plaintext passwords, script-accessible cookies, unlimited brute force | Bcrypt password hashing, `HttpOnly` cookies, rate limiting (429) |
| **5** | **Phishing & Credential Harvesting**  | Standalone server (`:4000`)                            | Deceptive clone harvests student credentials to `/captured`           | Domain awareness, CSP `frame-ancestors`, 2FA                     |
| **6** | **Missing Security Headers**          | All HTTP responses                                     | No defense-in-depth headers; clickjacking and MIME sniffing possible  | Helmet headers: CSP, `X-Frame-Options: DENY`, `nosniff`          |

---

## 1. SQL Injection (SQLi)

### 1.1 Authentication Bypass (Login)

- **Target URL:** `http://localhost:3000/login`
- **Username Payload:** `admin' --`
- **Password:** `anypassword` (can be anything)

#### Execution Steps:

1. Navigate to `http://localhost:3000/login`.
2. In the **Tên đăng nhập** (Username) field, paste: `admin' --`.
3. In the **Mật khẩu** (Password) field, type any characters.
4. Click **Đăng nhập**.

#### Observations:

- **In Vulnerable Mode (`SECURITY_MODE=vulnerable`):**
  - Query executed:
    ```sql
    SELECT * FROM users WHERE username = 'admin' --' AND password = '...'
    ```
  - The single quote `'` closes the username literal, and `--` comments out the password clause.
  - **Result:** You are instantly authenticated as `admin` and redirected to the home page with full administrative privileges.
- **In Secure Mode (`SECURITY_MODE=secure`):**
  - Query executed:
    ```sql
    SELECT * FROM users WHERE username = ?
    ```
  - The driver treats `admin' --` strictly as literal string data.
  - **Result:** No user with literal name `admin' --` exists. Login fails with flash error: _"Tên đăng nhập hoặc mật khẩu không đúng."_

---

### 1.2 Title Search Injection

- **Target URL:** `http://localhost:3000` (search bar in top navigation)
- **Search Query Payload:** `' OR '1'='1`

#### Observations:

- **In Vulnerable Mode:**
  - Query executed:
    ```sql
    SELECT * FROM posts WHERE title LIKE '%' OR '1'='1%'
    ```
  - Because `'1'='1'` is always true, SQLite returns all 9 posts in the database regardless of search terms.
- **In Secure Mode:**
  - Query executed:
    ```sql
    SELECT * FROM posts WHERE title LIKE ?
    ```
  - The driver binds `%' OR '1'='1%` literally.
  - **Result:** Finds 0 posts containing that literal pattern and shows: _"0 kết quả cho “' OR '1'='1”"_.

---

## 2. Cross-Site Scripting (XSS)

### 2.1 Reflected XSS

- **Target URL:** Top search bar at `http://localhost:3000`
- **Search Payload:** `<script>alert("Reflected XSS: " + document.cookie)</script>`
- _Alternative non-blocking visual payload:_ `<img src=x onerror="alert(document.domain)">`

#### Observations:

- **In Vulnerable Mode:**
  - The view renders: `<%- query %>`.
  - The browser receives raw unescaped HTML, parses the `<script>` tag, and executes it.
  - **Result:** JavaScript alert pop-up executes immediately.
- **In Secure Mode:**
  - The view renders: `<%= query %>`.
  - Express and EJS automatically encode special characters (`<` to `&lt;`, `>` to `&gt;`).
  - Furthermore, `Content-Security-Policy: default-src 'self'` blocks inline scripts.
  - **Result:** The payload displays harmlessly as text on the screen.

---

### 2.2 Stored XSS

- **Target URL:** `http://localhost:3000/posts/1`
- **Form:** Bottom comment form (_"Viết bình luận"_)
- **Author:** `Attacker`
- **Comment Payload:** `<img src="x" onerror="alert('Stored XSS Triggered!')">`

#### Observations:

- **In Vulnerable Mode:**
  - The comment is stored in `data/vulnerable.db`.
  - When any user visits `/posts/1`, the template renders raw HTML: `<%- comment.content %>`.
  - **Result:** Every student or visitor who opens the post executes the injected script alert.
- **In Secure Mode:**
  - The template safely renders escaped content: `<%= comment.content %>`.
  - CSP prevents inline `onerror` execution.
  - **Result:** The raw HTML tag is displayed safely as text: `&lt;img src="x"...&gt;`.

---

## 3. Cross-Site Request Forgery (CSRF)

### Scenario

An authenticated student (e.g. `alice`) is logged in on `http://localhost:3000`. In another browser tab, the student is lured to a malicious third-party site on `http://localhost:4000/csrf.html` claiming they won a prize.

### Attack Steps:

1. In your browser, log in as `alice` (`alice123`) on `http://localhost:3000/login`.
2. Verify you can view your profile at `http://localhost:3000/profile` (email is `alice@campusblog.local`).
3. In a new tab (or window), visit: `http://localhost:4000/csrf.html`.
4. The page displays a convincing "Congratulations! Student Laptop Giveaway" loader and silently auto-submits a hidden form to `http://localhost:3000/profile/email` setting `email=attacker@pwned.com`.

#### Observations:

- **In Vulnerable Mode:**
  - The session cookie lacks `SameSite=Lax` and the server does not validate CSRF tokens.
  - The browser attaches Alice's session cookie to the cross-site POST request.
  - **Result:** Alice's email address is silently changed to `attacker@pwned.com` without her consent.
- **In Secure Mode:**
  - The session cookie has `SameSite=Lax`, and state-changing POST requests require a hidden `_csrf` session token.
  - The cross-site request does not possess a valid token.
  - **Result:** Request is blocked with HTTP `403 Forbidden` (_"403 - Lỗi CSRF"_). Alice's email remains intact.

---

## 4. Broken Authentication & Session Flags

### 4.1 Plaintext vs Hashed Passwords

- Inspect the databases directly using SQLite CLI or inspect tests:

  ```bash
  # Vulnerable database stores plaintext
  sqlite3 data/vulnerable.db "SELECT username, password FROM users;"
  # Output: admin|admin123, alice|alice123, bob|bob123

  # Secure database stores bcrypt salt and hash
  sqlite3 data/secure.db "SELECT username, password FROM users;"
  # Output: admin|$2a$10$..., alice|$2a$10$..., bob|$2a$10$...
  ```

### 4.2 Cookie Flags (HttpOnly & SameSite)

- Inspect response headers on `POST /login`:
  - **Vulnerable Mode:** `Set-Cookie: session=...; path=/` (No `HttpOnly`, no `SameSite`). JavaScript can read `document.cookie` during XSS.
  - **Secure Mode:** `Set-Cookie: session=...; path=/; HttpOnly; SameSite=Lax`. Protected against script theft and cross-site form submissions.

### 4.3 Brute Force Rate Limiting

- Attempt rapid repeated failed logins at `http://localhost:3000/login`.
- **In Vulnerable Mode:** Unlimited attempts permitted.
- **In Secure Mode:** After 5 failed attempts, the 6th attempt is blocked with HTTP `429 Too Many Requests` (_"Quá nhiều lần đăng nhập không thành công. Vui lòng thử lại sau 5 phút."_).

---

## 5. Phishing Demonstration

1. Start the attacker server:
   ```bash
   npm run attacker
   ```
2. Open `http://localhost:4000/phishing.html`.
3. Notice that the page mimics the authentic Vietnamese Campus Devs login interface, but the URL bar clearly indicates port `4000`.
4. Enter test credentials and submit the form.
5. The form submits to `POST http://localhost:4000/capture` and redirects to `http://localhost:4000/captured`.
6. Inspect the live captured credential dashboard showing timestamp, username, password, and client IP.

---

## 6. Security Headers

Inspect response headers on `curl -I http://localhost:3000/`:

```bash
# Secure Mode Headers:
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; imgSrc 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
X-Security-Mode: secure
```

In Vulnerable Mode, these headers are completely omitted, leaving the browser vulnerable to clickjacking (`<iframe>` embedding), MIME-confusion attacks, and script injection.
