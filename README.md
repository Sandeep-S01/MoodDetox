# MoodDetox

MoodDetox is a client-heavy Next.js game experience built around short reset sessions, lightweight local progression, and optional peer-to-peer multiplayer.

## Requirements

- Node.js 20+
- npm 10+

## Local Development

1. Install dependencies:
   `npm install`
2. Start the development server:
   `npm run dev`

## Production Checks

- Lint:
  `npm run lint`
- Type-check:
  `npm run typecheck`
- Full verification:
  `npm run verify`

## Production Build

1. Create a static production build:
   `npm run build`
2. Deploy the generated static site from:
   `out/`

## GitHub Pages

- This repository includes a GitHub Actions workflow at `.github/workflows/deploy-pages.yml` to deploy the static export to GitHub Pages.
- For the `Sandeep-S01/MoodDetox` project site, the app is built to run under the `/MoodDetox` base path.
- On GitHub, set `Settings > Pages > Source` to `GitHub Actions` if it is not already enabled.
- After the workflow succeeds, the site will be available at:
  `https://sandeep-s01.github.io/MoodDetox/`

## Notes

- The build uses Next.js static export mode.
- Multiplayer relies on PeerJS and browser WebRTC support.
- User progress and settings are stored in local browser storage.
