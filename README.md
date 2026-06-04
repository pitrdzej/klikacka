# Klikacka — local development & deploy

- Local dev (inside `klikacka`):

```bash
cd klikacka
npm install
npm run dev
```

- Build and preview:

```bash
cd klikacka
npm run build
npm run preview
```

- Deploy to GitHub Pages:

Push to `main`. The workflow in `.github/workflows/pages.yml` builds the app and publishes `dist` to GitHub Pages.

In GitHub, set `Settings -> Pages -> Build and deployment -> Source` to `GitHub Actions`.

- Manual local deploy helper (copies generated assets from `dist` to repository root):

```bash
npm run deploy
```

Notes:
- The `assets/`, `sounds/` and `bosses/` folders in the repository root are generated only by the manual `deploy` script. GitHub Pages uses the workflow output from `dist`.
- `klikacka/vite.config.ts` uses a relative `base` so built files work both when served from root and when copied into subfolders.
