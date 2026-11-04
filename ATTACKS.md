# Classroom Demonstration Guide: Web Attacks & Countermeasures

> The full, detailed lecture demo guide is maintained at [docs/ATTACKS.md](docs/ATTACKS.md).

For quick reference during lectures, use the following payload matrix:

| Attack Vector                | Vulnerable Endpoint      | Demonstration Payload                         | Expected Outcome (Vulnerable vs Secure)                                                                     |
| :--------------------------- | :----------------------- | :-------------------------------------------- | :---------------------------------------------------------------------------------------------------------- |
| **1.1 SQLi Login Bypass**    | `POST /login`            | Username: `admin' --`<br>Password: `any`      | **Vuln:** Authenticates as admin.<br>**Sec:** 401 Unauthorized.                                             |
| **1.2 SQLi Title Search**    | `GET /search?q=...`      | `' OR '1'='1`                                 | **Vuln:** All 9 posts returned.<br>**Sec:** 0 posts matched.                                                |
| **2.1 Reflected XSS**        | `GET /search?q=...`      | `<script>alert(document.cookie)</script>`     | **Vuln:** Unescaped alert popup.<br>**Sec:** HTML entity escaped + CSP block.                               |
| **2.2 Stored XSS**           | `POST /posts/1/comments` | `<img src=x onerror=alert('Stored')>`         | **Vuln:** Persistent alert for all visitors.<br>**Sec:** HTML entity escaped (`&lt;img...&gt;`).            |
| **3. CSRF Email Update**     | `POST /profile/email`    | Auto-submitted from `:4000/csrf.html`         | **Vuln:** Alice email silently replaced.<br>**Sec:** 403 Forbidden (CSRF token missing).                    |
| **4. Broken Authentication** | Storage & Sessions       | Plaintext passwords in DB, missing `HttpOnly` | **Vuln:** Plaintext pass, script-accessible cookies.<br>**Sec:** Bcrypt hashes, `HttpOnly`, 429 rate limit. |
| **5. Phishing Demo**         | `http://localhost:4000`  | Fake login at `/phishing.html`                | Submits to `/capture` and lists on `/captured`.                                                             |
| **6. Security Headers**      | All HTTP responses       | Headers audit                                 | **Vuln:** 0 security headers.<br>**Sec:** Strict CSP, `DENY`, `nosniff`.                                    |

Refer to [docs/ATTACKS.md](docs/ATTACKS.md) for full lecture walkthrough and verification steps.
