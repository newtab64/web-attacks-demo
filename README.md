# Trạm Dev: Web Attacks & Countermeasures Demo

**Topic 3 · Web Programming & Applications (503073)**

## The story

Trạm Dev looks like any student developer blog: posts, comments, search, logins. Nothing on screen hints that anything is wrong.

Start it in **vulnerable mode** and walk through what an attacker can do to it:

1. **SQL injection.** Type `quantri' --` as the username and you are logged in as the admin, with no password. Search for `' OR '1'='1` and every post comes back.
2. **XSS.** Post `<img src=x onerror=alert('Stored')>` as a comment. It runs in every visitor's browser.
3. **CSRF.** A student opens a "prize giveaway" page on another site, and their email is changed without them touching anything.
4. **Phishing.** A copy of the login page on `localhost:4000` collects the passwords people type into it.

Now restart in **secure mode** and repeat each step. Same site, same payloads, and every one fails: parameterized queries, escaped output, CSRF tokens, bcrypt hashes, rate limiting and strict security headers.

The point is the contrast: the pages look identical, and only the code underneath differs.

Step-by-step payloads and expected results for each attack are in [docs/ATTACKS.md](docs/ATTACKS.md).

## Run it

Requires Node.js 22.

```bash
npm install
npm run seed          # create both databases
npm start             # secure mode (default) -> http://localhost:3000
```

```bash
SECURITY_MODE=vulnerable npm start   # vulnerable mode
SHOW_MODE_BADGE=1 npm start          # show a small mode badge in the corner
npm run attacker                     # attacker server -> http://localhost:4000
```

The attacker server serves the phishing page (`/phishing.html`), the CSRF page (`/csrf.html`), and a dashboard of captured passwords (`/captured`).

## Test accounts

| Username  | Password     | Role          |
| :-------- | :----------- | :------------ |
| `quantri` | `quantri123` | Administrator |
| `minhanh` | `minhanh123` | Member        |
| `quocbao` | `quocbao123` | Member        |

Vulnerable mode stores these in plaintext (`data/vulnerable.db`). Secure mode stores bcrypt hashes (`data/secure.db`).

## Under the hood

TypeScript, Express, EJS and SQLite, styled with Tailwind. The UI is in Vietnamese with no client-side JavaScript. The code is split into `src/app/web` (pages), `src/app/api` (JSON API under `/api/v1`) and `src/core` (services, database, security middleware).

```bash
npm run check         # types, lint, formatting and all tests
npm run screenshots   # regenerate docs/screenshots
```
