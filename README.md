# Divine Office Reader (성무일도 리더)

몽골어 성무일도(시간전례) 텍스트를 구조화된 목차와 함께 제공하는 반응형 웹 이북 리더.

**Live:** https://divine-office-reader.vercel.app

## Tech Stack

- Next.js 16 (App Router) / React 19 / TypeScript / Tailwind CSS 4
- Vitest (unit + data quality) / Playwright (E2E)
- Deployed on Vercel

## Getting Started

```bash
npm install
npm run dev          # http://localhost:3000
npm run build:data   # Rebuild content JSON from source
npm test             # Vitest unit tests
npx playwright test  # E2E tests
```

## Project Structure

```
app/                 # Next.js App Router (layout, page, API routes)
components/          # Top-level shell component (ReaderShell)
modules/             # Feature modules
  ├── content/       #   Content rendering and lazy loading
  ├── navigation/    #   Sidebar, breadcrumb, active section
  ├── settings/      #   Font, dark mode, persistence
  ├── prayer-flow/   #   Prayer flow guide
  ├── data-pipeline/ #   Build-time data processing
  └── shared/        #   Types and constants
public/data/         # Generated content JSON files
docs/                # PRD, test plans, UX scenarios
```

## Documentation

- [PRD (modular)](docs/prd/README.md) — product requirements by module
- [Traceability Matrix](docs/TRACEABILITY-MATRIX.md) — feature-to-test mapping
- [E2E Test Plan](docs/E2E-TEST-PLAN.md) — Playwright test specifications
- [UX Scenarios](docs/UX-SCENARIOS.md) — persona-based usage scenarios
- [Prayer Guide](docs/PRAYER-GUIDE.md) — liturgical order mapping
