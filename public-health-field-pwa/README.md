# Public Health Field Operations PWA

Standalone React + Vite + TypeScript PWA frontend for public health field officers. It is designed to integrate with the existing main system through its API and does not replace the main system.

## Run locally

Requirements: Node.js 20+ recommended.

```bash
npm install
npm run dev
```

Open the URL printed by Vite.

## Build

```bash
npm run build
npm run preview
```

## API integration

1. Copy `.env.example` to `.env.local`.
2. Set `VITE_API_BASE_URL` to the existing system's API base URL.
3. Keep `VITE_USE_MOCKS=true` while developing UI with sample data.
4. Match endpoint paths and response schemas in `src/api.ts` to the actual API documentation.
5. Only set `VITE_USE_MOCKS=false` after endpoint, authentication, CORS, authorization, and error-handling behavior have been verified.

The example endpoint paths in `src/api.ts` are placeholders, not claims about the existing backend.

## Current prototype behavior

- Responsive desktop and mobile layouts.
- Navigation between home, tasks, establishments, map, reports, documents, and profile.
- Search and filters.
- Establishment details drawer.
- Field report form with photo file selection and optional geolocation.
- Local pending report queue using localStorage for prototype demonstration.
- Online/offline status indicator.
- PWA manifest and service worker through `vite-plugin-pwa`.

## Important prototype limitations

- Data is sample data and is not an official record.
- The map is a UI mockup, not a real GIS map.
- The sample report queue is not a complete offline sync engine. It does not yet implement IndexedDB, conflict resolution, durable photo blobs, or idempotency keys.
- Photos currently record filenames in the prototype; actual secure upload must be implemented against the verified API.
- Authentication and authorization must integrate with the main system before production.
- Sample form names and permit data are illustrative, not official government templates.
- PWA installation and service worker behavior should be tested in a production-like HTTPS environment.

## Production checklist

- Confirm existing API routes, auth mechanism, CORS policy, and data contracts.
- Add an API adapter for the verified endpoints.
- Implement secure authentication and server-side permission checks.
- Implement IndexedDB-based offline drafts, safe queueing, idempotency, conflict handling, and sync retries.
- Add private photo uploads and controlled document downloads.
- Replace map mockup with an approved mapping provider.
- Add tests for online/offline flows, upload failure, and synchronization.
