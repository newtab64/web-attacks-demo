# Web Attacks and Countermeasures Demo Blog

An educational, realistic community blog website built for demonstrating **Common Website Attacks and Countermeasures** in university computer science and cybersecurity courses.

The site is designed to look and feel like an authentic student developer community blog with **zero visible mentions of "vulnerable" or "attack" in the UI**.

---

## Tech Stack & Architecture

- **Backend:** Node.js + Express
- **Database:** SQLite (`better-sqlite3`)
- **Views:** EJS server-rendered templates
- **Styling:** Vanilla CSS (`public/style.css`)
- **Session:** `cookie-session`
- **Hashing:** `bcryptjs`
- **Simplicity:** No React, TypeScript, ORM, Docker, or build steps. The entire codebase is readable in under 10 minutes.

---

## Seed Accounts & Credentials

The seed script creates three accounts (all passwords stored with bcrypt hashes and available in plaintext for dual-mode demonstration):

| Username | Password | Role | Email |
| :--- | :--- | :--- | :--- |
| **admin** | `admin123` | Administrator | `admin@campusblog.local` |
| **alice** | `alice123` | User | `alice@campusblog.local` |
| **bob** | `bob123` | User | `bob@campusblog.local` |

---

## Quickstart

### 1. Install & Seed
```bash
npm install
npm run seed
```

### 2. Run the Main Blog Application (Port 3000)

- **Secure Mode (Default):**
  ```bash
  npm start
  # or explicitly:
  SECURITY_MODE=secure npm start
  ```
  App runs at: `http://localhost:3000`

- **Vulnerable Mode:**
  ```bash
  SECURITY_MODE=vulnerable npm start
  ```
  App runs at: `http://localhost:3000`

### 3. Run the Attacker Server (Port 4000)

For the Phishing and CSRF demonstrations, start the attacker server in a separate terminal:
```bash
node attacker/server.js
```
Attacker pages run at: `http://localhost:4000`
- Phishing demo: `http://localhost:4000/phishing.html`
- CSRF demo: `http://localhost:4000/csrf.html`

---

## Automated Verification Suite

Run all unit and route tests:
```bash
npm test
```

Run the end-to-end verification script testing all 5 attack vectors across both vulnerable and secure modes:
```bash
npm run test:attacks
```

---

## Demonstration Script

For step-by-step lecture instructions, exact copy-paste payloads, and explanations of what happens in each mode, see [ATTACKS.md](ATTACKS.md).
