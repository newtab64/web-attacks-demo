# Campus Devs — Web Attacks & Countermeasures Demo Blog

[![Verification Pipeline](https://img.shields.io/badge/checks-zero%20warnings-brightgreen)]()
[![Node.js](https://img.shields.io/badge/node-v22%20LTS-blue)]()
[![TypeScript](https://img.shields.io/badge/typescript-strict%20ESM-blue)]()
[![Tailwind CSS](https://img.shields.io/badge/tailwindcss-v4%20CLI-38bdf8)]()
[![License](https://img.shields.io/badge/license-MIT-green)]()

An educational, production-grade community blog website built for demonstrating **Common Website Attacks and Countermeasures** in university computer science and cybersecurity courses.

The site is styled to look and feel like an authentic Vietnamese student developer community blog with **zero visible mentions of "vulnerable" or "attack" in the UI**. All 5 attack vectors and countermeasures from `ATTACKS.md` behave identically in both **Vulnerable Mode** (`SECURITY_MODE=vulnerable`) and **Secure Mode** (`SECURITY_MODE=secure`, default).

---

## Tech Stack & Architecture

- **Runtime & Language:** Node.js 22 LTS (`.nvmrc` + `engines`), TypeScript 5.8 ESM with strict type checking (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, zero `any`).
- **Web Framework:** Express 5.3 + EJS server-rendered templates with clean partials.
- **Styling & Design Tokens:** Tailwind CSS v4 compiled via CLI (`styles/input.css` &rarr; `public/css/style.css`). All theme tokens strictly match `design-reference/blog-ui-template.html`. Zero inline `style=""` attributes.
- **Database Architecture:** Dual SQLite databases managed via `better-sqlite3` in WAL mode:
  - `data/vulnerable.db`: Stores plaintext passwords for SQLi/auth demonstrations.
  - `data/secure.db`: Stores bcrypt password hashes (`bcryptjs`).
- **Validation & Security:** Zod for type-safe environment and request body schemas, Helmet in secure mode with strict Content Security Policy (`default-src 'self'`), session CSRF token verification, and failed-login IP rate limiting.
- **Localization:** 100% Vietnamese UI (`<html lang="vi">`) with all user-facing strings centralized in `src/i18n/vi.ts`. Code, logs, and documentation remain in English.
- **Automated Verification:** Vitest + Supertest testing suite with 50 passing tests across unit and E2E attack vectors. ESLint 10 flat config with `strictTypeChecked` (`--max-warnings 0`), Prettier.

---

## Seed Accounts & Credentials

Running `npm run seed` populates both databases with 3 seed users and 9 realistic Vietnamese student developer blog posts:

| Username  | Password   | Role                  | Email                    |
| :-------- | :--------- | :-------------------- | :----------------------- |
| **admin** | `admin123` | Quản trị viên (Admin) | `admin@campusblog.local` |
| **alice** | `alice123` | Thành viên (Member)   | `alice@campusblog.local` |
| **bob**   | `bob123`   | Thành viên (Member)   | `bob@campusblog.local`   |

---

## Quickstart

### 1. Requirements & Installation

Requires **Node.js 22 LTS**. If you use `nvm`:

```bash
nvm use
```

Install pinned production and development dependencies (guaranteed zero vulnerabilities in `npm audit`):

```bash
npm install
```

### 2. Seed Databases & Compile CSS

```bash
npm run seed
npm run build:css
```

### 3. Run the Main Blog Application (Port 3000)

- **Secure Mode (Default):**

  ```bash
  npm start
  # or explicitly:
  SECURITY_MODE=secure npm start
  ```

  Runs at: `http://localhost:3000`

- **Vulnerable Mode:**

  ```bash
  SECURITY_MODE=vulnerable npm start
  ```

  Runs at: `http://localhost:3000`

- **Show Mode Badge (Optional):**
  ```bash
  SHOW_MODE_BADGE=1 npm start
  ```
  Renders a discrete fixed badge in the bottom-right corner indicating current mode.

### 4. Run the Attacker Server (Port 4000)

Start the standalone attacker server in a separate terminal:

```bash
npm run attacker
```

Attacker pages run at: `http://localhost:4000`

- **Phishing Demo:** `http://localhost:4000/phishing.html` (submits to `/capture`)
- **Captured Passwords Dashboard:** `http://localhost:4000/captured`
- **CSRF Auto-Submit Demo:** `http://localhost:4000/csrf.html` (targets `POST http://localhost:3000/profile/email`)

---

## Classroom Lecture Demonstration

Detailed step-by-step instructions and payloads for live classroom walkthroughs are documented in [docs/ATTACKS.md](docs/ATTACKS.md):

1. **SQL Injection (SQLi):**
   - Auth Bypass: `admin' --` in `POST /login`
   - Search Expansion: `' OR '1'='1` in `/search`
2. **Cross-Site Scripting (XSS):**
   - Reflected: `<script>alert(document.cookie)</script>` in search bar
   - Stored: `<img src=x onerror=alert('Stored')>` in post comments
3. **Cross-Site Request Forgery (CSRF):**
   - Auto-submitting prize giveaway on `:4000/csrf.html` updating email without consent
4. **Broken Authentication & Session Management:**
   - Plaintext passwords vs bcrypt hashes in SQLite
   - Missing `HttpOnly` / `SameSite` cookie flags vs strict flags
   - Brute force protection (HTTP 429 after 5 failed attempts)
5. **Phishing & Credential Interception:**
   - Deceptive Vietnamese login page harvesting credentials to `/captured`
6. **Missing Security Headers:**
   - CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`

---

## Quality & Verification Pipeline

Run the zero-warnings verification contract:

```bash
# Run all linter, typecheck, format, and unit + E2E test checks
npm run check

# Run tests only
npm test

# Capture high-resolution headless Chromium screenshots of all views
npm run screenshot
```

All 13 visual views are saved to `docs/screenshots/` (`01-home-light.png` through `13-attacker-captured.png`).
