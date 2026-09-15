# Mock PSA Frontend

Static React UX skeleton for DeskSide's mock professional services automation
application. It establishes the ticket queue and responsive application shell
that will eventually host live service-desk and agentic-assistance workflows.

## Current scope

- Responsive three-column workspace with collapsible navigation and assistant
  panels
- Synthetic ticket queue, summary counters, search, and status filtering
- Light, dark, and system color themes
- Root redirect, ticket route, and not-found route
- Component tests and frontend quality checks

This increment intentionally contains no API requests, authentication, CRUD,
audio controls, or agent runtime. The records in `src/features/tickets/fixtures.ts`
are synthetic demo data.

## Technology

- React and TypeScript
- Vite
- shadcn/ui with Radix primitives and Tailwind CSS
- React Router in declarative mode
- Vitest and React Testing Library
- ESLint and Prettier

## Development

Requires a current Node.js release compatible with the locked Vite version and
npm.

```console
cd mock-psa-frontend
npm install
npm run dev
```

Vite prints the local URL, normally <http://localhost:5173>. The ticket queue is
available at `/tickets`; `/` redirects there.

## Quality checks

```console
npm run check
npm run build
```

Individual commands are also available:

```console
npm run typecheck
npm run lint
npm run format:check
npm run test
npm run test:watch
```

Run `npm run format` to apply Prettier formatting.

## Project structure

```text
src/
├── app/                 Routing, themes, and application-level providers
├── components/
│   ├── layout/          DeskSide shell, navigation, and assistant panel
│   └── ui/              shadcn-generated primitives
├── features/tickets/    Queue view, frontend types, and synthetic fixtures
├── hooks/               Shared responsive hooks
├── pages/               Route-level utility pages
└── test/                Shared test setup
```

Application code should compose the generated files in `components/ui` rather
than adding product behavior to those primitives.

## Responsive behavior

- `xl` and wider: 16-rem navigation, flexible ticket workspace, and 22-rem
  assistant panel
- `md` through `lg`: icon navigation rail and assistant sheet
- Below `md`: navigation and assistant sheets with a full-width ticket workspace

Each pane scrolls independently at desktop sizes.

## Planned API integration

When the static queue is replaced, generate TypeScript types from the FastAPI
OpenAPI document and use `openapi-fetch`, `openapi-react-query`, and TanStack
Query. Keep an adapter between API response types and `TicketSummary` because
the current frontend view model contains resolved company, contact, and assignee
labels that the wire model represents as related IDs.

Use a same-origin `/api` development proxy or gateway when that integration is
added; this skeleton does not require CORS or any change to `mock-psa-api`.

Evaluate an AI-specific component layer only after the ticket-agent event and
approval contracts are defined. The current assistant area is intentionally an
honest empty state rather than simulated agent behavior.
