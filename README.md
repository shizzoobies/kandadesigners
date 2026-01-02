# Kanda Designers — Dual Hub Astro Starter (Alex + Kristina)

## Run
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
npm run preview
```

## Content
- People profiles: `src/content/people/*.md`
- Projects: `src/content/projects/*.md` (use `person: alex | kristina`)

## Cloudflare Pages
- Build command: `npm run build`
- Output directory: `dist`
- Recommended env var: `NODE_VERSION=20`

## CMS (Decap) — edit content in the browser

This project includes Decap CMS at `/admin`.

### 1) Create a GitHub OAuth App
GitHub → Settings → Developer settings → OAuth Apps → New OAuth App

- **Homepage URL:** `https://kandadesigners.com`
- **Authorization callback URL:** `https://kandadesigners.com/api/callback`

Copy the **Client ID** and **Client Secret**.

### 2) Add Cloudflare Pages env vars
Cloudflare Pages → Project → Settings → Environment variables

- `GITHUB_CLIENT_ID` = (from GitHub)
- `GITHUB_CLIENT_SECRET` = (from GitHub)

Add to both **Production** and **Preview**.

### 3) Update the CMS config
Edit: `public/admin/config.yml`

Set:
- `backend.repo: YOUR_GITHUB_USERNAME/YOUR_REPO_NAME`
- (optional) `branch: main`

### 4) Deploy, then login
Go to:
`https://kandadesigners.com/admin`

Click **Login with GitHub** and edit content with forms.
