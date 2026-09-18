# Mock PSA Frontend

Static React UX skeleton for DeskSide's mock professional services automation
application. It establishes the ticket queue, read-only details, and application shell
that will eventually host live service-desk and agentic-assistance workflows.

## Current scope

- Responsive three-column workspace with collapsible navigation and assistant
  panels
- Synthetic ticket queue, summary counters, search, and status filtering
- Ticket details with customer context, description, notes, and time entries
- Light, dark, and system color themes
- Root redirect, ticket route, and not-found route
- Component tests and frontend quality checks

This increment intentionally contains no API requests, authentication, CRUD,
audio controls, or agent runtime. The records in `src/features/tickets/fixtures.ts`
are synthetic demo data.

Ticket details are also read-only: there are no edit controls, note composers,
timers, or saved changes. `src/features/tickets/detail-fixtures.ts` supplies all
eight detail records and references queue fixtures for shared identity and labels.
Contact addresses use reserved `.example` domains. Ticket Type is omitted because
the current API does not model it.

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
available at `/tickets`; `/` redirects there. Ticket summaries link to
`/tickets/:ticketId` (for example, `/tickets/1048`). Missing or invalid ticket IDs
render a ticket-not-found state inside the workspace.

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
├── features/tickets/    Queue/detail views, activity, display types, and fixtures
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

Detail cards use the center pane's width, not the viewport width, to switch
between two columns and a stacked layout. Description and activity are full-width.
The All, Notes, and Time entries tabs filter a newest-first feed: notes use their
creation timestamp, and time entries use their start timestamp. Logged and billable
time totals always include all time entries, regardless of the selected tab.
All detail timestamps use a fixed UTC display; fixture timestamps are static,
not a live clock. Queue relative-time labels remain illustrative demo copy.

## Planned API integration

When the static queue is replaced, generate TypeScript types from the FastAPI
OpenAPI document and use `openapi-fetch`, `openapi-react-query`, and TanStack
Query. Keep an adapter between API response types and `TicketSummary` because
the current frontend view model contains resolved company, contact, and assignee
labels that the wire model represents as related IDs.

The same boundary applies to `TicketDetail`, `TicketNote`, and `TicketTimeEntry`:
these are frontend-only display models, not handwritten API DTOs. A future detail
adapter should compose the ticket endpoint, resolved company/contact/technician
and optional site/asset relationships, and the nested
`/tickets/{ticket_id}/notes` and `/tickets/{ticket_id}/time-entries` endpoints.
Keep notes and time entries as distinct entities; the unified activity feed is
only a presentation. Replace fixture lookup with queries without moving wire
models into UI components.

Use a same-origin `/api` development proxy or gateway when that integration is
added; this skeleton does not require CORS or any change to `mock-psa-api`.

Evaluate an AI-specific component layer only after the ticket-agent event and
approval contracts are defined. The current assistant area is intentionally an
honest empty state rather than simulated agent behavior.
