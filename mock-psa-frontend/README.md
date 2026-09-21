# Mock PSA Frontend

Static React UX skeleton for DeskSide's mock professional services automation
application. It establishes the ticket queue, read-only ticket, company, site,
and contact workspaces, and an application shell that will eventually host live
service-desk and agentic-assistance workflows.

## Current scope

- Responsive three-column workspace with collapsible navigation and assistant
  panels
- Synthetic ticket queue, summary counters, search, and status filtering
- Ticket details with customer context, description, notes, and time entries
- A searchable company directory and company overviews with demo-related records
- Read-only site profiles with company context and explicitly assigned tickets
- Searchable contact directory, company filtering, and read-only contact profiles
- Light, dark, and system color themes
- Root redirect, ticket/company/site/contact routes, and not-found states
- Component tests and frontend quality checks

This increment intentionally contains no API requests, authentication, CRUD,
audio controls, or agent runtime. The records in `src/features/tickets/fixtures.ts`
are synthetic demo data.

Ticket details are also read-only: there are no edit controls, note composers,
timers, or saved changes. `src/features/tickets/detail-fixtures.ts` supplies all
eight detail records and references queue fixtures for shared identity and labels.
Contact email addresses use reserved `.example` domains. Ticket Type is omitted because
the current API does not model it.

Company, Site, and Contact pages are also read-only. The Company API currently
has only an ID and name, so the profile does not invent company-level address,
phone, or status fields. Company contacts and sites come from their canonical
fixture modules; related tickets and assets reflect the existing ticket demo.
These are not a complete inventory or live counts. One company has no related
demo records, one site has no assigned demo tickets, and one contact has no
linked demo tickets. Contact status and preferences are omitted because the API
does not model them.

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

Companies are available from the sidebar at `/companies`, where local search
matches name or ID. `/companies/:companyId` opens a synthetic company overview;
the Company field on each ticket detail links to its matching overview. Missing
or invalid company IDs render an in-shell not-found state.

Site links appear on Company and Ticket Detail pages. `/sites/:siteId` opens
a synthetic site profile with its parent company, address, phone, timezone,
and explicitly assigned tickets. Sites have no directory or separate sidebar
entry. Missing or invalid site IDs render an in-shell not-found state.

Contacts are available from the sidebar at `/contacts`. Search matches contact
ID, name, email, company, or site, and a local company filter can narrow the
sample. `/contacts/:contactId` shows the API-supported contact fields, linked
Company and optional Site, and tickets explicitly assigned to that contact.
Company, Site, and Ticket Detail pages link to these profiles. Missing or
invalid contact IDs render an in-shell not-found state.

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
├── features/companies/ Company directory, overview, display types, and fixtures
├── features/contacts/  Contact directory/detail, display types, and fixtures
├── features/sites/     Site detail, display types, and fixtures
├── features/tickets/    Queue/detail views, activity, display types, and fixtures
├── hooks/               Shared responsive hooks
├── pages/               Route-level utility pages
└── test/                Shared test setup
```

Application code should compose the generated files in `components/ui` rather
than adding product behavior to those primitives.

## Responsive behavior

- `xl` and wider: 16-rem navigation, flexible main workspace, and 22-rem
  assistant panel
- `md` through `lg`: icon navigation rail and assistant sheet
- Below `md`: navigation and assistant sheets with a full-width main workspace

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

`CompanySummary`, `CompanyOverview`, `SiteDetail`, and `ContactDetail` are
likewise frontend-only projections, not API wire types. Site and Contact
fixtures carry stable IDs and the fields supported by their current APIs.
Ticket summaries reference canonical contacts by `contactId`, and ticket detail
email/phone fields resolve from the same fixture. Company and Site contact lists
use explicit `companyId` and `siteId` assignments, not inferred ticket context:
Priya Shah belongs to Main practice even though one of her tickets is at Branch
practice. A future adapter can load `/sites/{site_id}` and
`/tickets?site_id=...` for Site details, and `/contacts`,
`/contacts/{contact_id}`, and `/tickets?contact_id=...` for Contact pages.

The demo assigns stable `companyId` values to ticket summaries and assembles
company-related ticket and asset sample lists from ticket fixtures, deduplicating
assets by hostname or name within each company. A
future adapter can load `/companies/{company_id}` plus `/tickets`, `/contacts`,
`/sites`, and `/assets` filtered by `company_id`; those separate responses should
not be treated as additional fields on `CompanyRead`.

Use a same-origin `/api` development proxy or gateway when that integration is
added; this skeleton does not require CORS or any change to `mock-psa-api`.

Evaluate an AI-specific component layer only after the ticket-agent event and
approval contracts are defined. The current assistant area is intentionally an
honest empty state rather than simulated agent behavior.
