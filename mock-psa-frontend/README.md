# Mock PSA Frontend

React UX skeleton for DeskSide's mock professional services automation
application. It establishes authentication, the ticket queue, read-only ticket,
company, site, contact, asset, and knowledge workspaces, and an application shell
that will eventually host live service-desk and agentic-assistance workflows.

## Current scope

- Responsive three-column workspace with collapsible navigation and assistant
  panels
- API-backed login, current-tab session restoration, protected routes, and logout
- Live read-only ticket queue with loaded-page counters, local search, status filtering, and Load more
- Live ticket details with API-resolved customer context, description, notes, and time entries
- A searchable company directory and company overviews with demo-related records
- Read-only site profiles with company context and explicitly assigned tickets
- Searchable contact directory, company filtering, and read-only contact profiles
- Searchable asset inventory with company/type/status filters and read-only asset profiles
- Searchable knowledge library with read-only article bodies and single-target context
- Light, dark, and system color themes
- Root redirect, ticket/company/site/contact/asset/knowledge routes, and not-found states
- Component tests and frontend quality checks

Authentication and Ticket reads are the live API integrations. Company, Site,
Contact, Asset, and Knowledge pages remain synthetic and read-only; there is no
entity CRUD, audio control, or agent runtime. The records in
`src/features/tickets/fixtures.ts` remain a synthetic sample for those other
pages, but neither live Ticket page uses them as its ticket data source.

Ticket details are also read-only: there are no edit controls, note composers,
timers, or saved changes. They request `/tickets/{ticket_id}`, its Company,
Contact, optional Site and Asset, and all pages of nested Notes and Time Entries.
The API has no general technician lookup, so live tickets show `Technician #ID`
instead of a synthetic name. Ticket Type is omitted because the API does not
model it. `detail-fixtures.ts` remains solely for the other synthetic pages.

Company, Site, Contact, and Asset pages are also read-only. The Company API currently
has only an ID and name, so the profile does not invent company-level address,
phone, or status fields. Company contacts and sites come from their canonical
fixture modules; related tickets and assets reflect canonical synthetic fixtures.
These are not a complete inventory or live counts. One company has no related
demo records, one site has no assigned demo tickets, and one contact has no
linked demo tickets. Two assets have no linked tickets. Contact status and
preferences, and asset purchase and warranty fields, are omitted because the
API does not model them.

Knowledge articles are also synthetic and read-only. They use only the current
API's title, body, optional single Company/Site/Contact/Asset target, and
created/updated timestamps. Bodies are rendered as plain text with paragraph
breaks preserved; there is no author, publication status, category, editor,
or Markdown/HTML interpretation.

## Technology

- React and TypeScript
- Vite
- shadcn/ui with Radix primitives and Tailwind CSS
- React Router in declarative mode
- OpenAPI-generated types, openapi-fetch, openapi-react-query, and TanStack Query
- Vitest and React Testing Library
- ESLint and Prettier

## Development

Requires a current Node.js release compatible with the locked Vite version,
npm, and a running Mock PSA API with a seeded user. In separate terminals:

```console
cd mock-psa-api
uv run fastapi dev
```

```console
cd mock-psa-frontend
npm install
npm run dev
```

Vite prints the local URL, normally <http://localhost:5173>. The ticket queue is
available after signing in at `/login`; authenticated visits to `/` redirect to
`/tickets`. Vite proxies `/api/*` to `http://127.0.0.1:8000/*` during development,
so no development CORS configuration is required. A production host must provide
the equivalent same-origin `/api` reverse proxy.

The bearer token is stored in `sessionStorage`: refreshes in the same tab restore
the session through `GET /me`, while closing the tab signs the user out. The API's
JWT expiration remains authoritative. Logout removes the local token; this
stateless API does not revoke already-issued tokens server-side.

Ticket summaries link to
`/tickets/:ticketId` (for example, `/tickets/1048`). Missing or invalid ticket IDs
render a ticket-not-found state inside the workspace.
The queue fetches 100 tickets at a time from `/tickets` and offers Load more when
a full page is returned. Search, status filtering, sorting, and counters apply
to loaded tickets only; the API currently provides no total count or text-search
endpoint. An empty or unavailable API response never falls back to demo tickets.
Live Ticket relationship labels come from their GET endpoints. Links to matching
synthetic profile IDs are labeled “demo preview”; unknown IDs remain display-only.

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

Assets are available from the sidebar at `/assets`. Local search matches ID,
name, asset tag, serial number, hostname, manufacturer, model, company, site,
and contact; company, type, and status filters can be combined. `/assets/:assetId`
shows every currently supported Asset field, linked Company and optional Site
or Contact assignment, and explicitly related tickets. Company, Site, Contact,
and Ticket Detail pages link to these profiles where an Asset is referenced.
Missing or invalid Asset IDs render an in-shell not-found state.

Knowledge is available from the sidebar at `/knowledge-articles`. Local search
matches article ID, title, body, and target name, and a target-type filter narrows
the demo sample. `/knowledge-articles/:articleId` shows the full plain-text body,
UTC audit timestamps, and a link to the one direct target when present. Missing
or invalid IDs render an in-shell article-not-found state.

## Quality checks

```console
npm run check
npm run build
npm run api:generate
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
├── features/auth/      Login, logout, session state, and route guards
├── features/contacts/  Contact directory/detail, display types, and fixtures
├── features/assets/    Asset directory/detail, display types, and fixtures
├── features/knowledge-articles/ Article directory/detail, display types, and fixtures
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
All detail timestamps use a fixed UTC display; the queue calculates relative
time from live API timestamps.

## API boundary

`npm run api:generate` regenerates the checked-in `src/api/generated-schema.ts`
directly from the sibling FastAPI application's OpenAPI schema. It requires
`uv` and the API's Python dependencies, but not a running database or server.
Run it whenever an API schema changes, then include the generated diff. The
frontend build itself does not require the API process.

`TicketSummary`, `TicketDetail`, `TicketNote`, and `TicketTimeEntry` remain
frontend-only display projections, not handwritten API DTOs. The ticket API
adapter resolves relationship IDs and keeps Notes and Time Entries distinct;
the combined activity feed is presentation only. The API's GET paths are plural
(`/tickets` and `/tickets/{ticket_id}`), exposed same-origin through `/api`.
Authenticated `401` responses clear the tab session. Non-auth failures show a
retry state rather than stale synthetic records.

`CompanySummary`, `CompanyOverview`, `SiteDetail`, `ContactDetail`, and
`AssetDetail` are
likewise frontend-only projections, not API wire types. Site and Contact
fixtures carry stable IDs and the fields supported by their current APIs.
Ticket summaries reference canonical contacts by `contactId`, and ticket detail
email/phone fields resolve from the same fixture. Company and Site contact lists
use explicit `companyId` and `siteId` assignments, not inferred ticket context:
Priya Shah belongs to Main practice even though one of her tickets is at Branch
practice. A future adapter can load `/sites/{site_id}` and
`/tickets?site_id=...` for Site details, and `/contacts`,
`/contacts/{contact_id}`, and `/tickets?contact_id=...` for Contact pages.

The Asset fixtures are the sole source of Asset identity and profile fields.
Ticket details resolve linked Assets by ID; Company, Site, and Contact views
derive Asset lists only from their explicit assignment IDs. An Asset may be
assigned to a Site or Contact, but not both. A ticket's Site or Contact does not
imply the Asset's assignment. A future adapter can load `/assets`,
`/assets/{asset_id}`, `/assets?company_id=...`, `/assets?site_id=...`,
`/assets?contact_id=...`, and `/tickets?asset_id=...`. The directory's text
search currently covers only the loaded synthetic sample; it is not an API
search contract.

`KnowledgeArticle` is a frontend-only view model, not a handwritten API DTO.
Its fixture module is the sole source of article identity and text; resolved
target labels and links are display projections. A future adapter can load
`/knowledge-articles` and `/knowledge-articles/{id}`, use the API's
`company_id`, `site_id`, `contact_id`, or `asset_id` list filters for contextual
views, and resolve the one referenced entity separately. Directory text search
and target-type filtering currently cover only the loaded synthetic sample;
they are not server-side search contracts.

The demo assigns stable `companyId` values to ticket summaries and assembles
company-related ticket and Asset sample lists from their respective canonical
fixtures. A
future adapter can load `/companies/{company_id}` plus `/tickets`, `/contacts`,
`/sites`, and `/assets` filtered by `company_id`; those separate responses should
not be treated as additional fields on `CompanyRead`.

Entity API integration should reuse the authenticated request helper so bearer
tokens and `401` session invalidation remain centralized. The same-origin `/api`
development proxy is already configured; production should provide the same
gateway path.

Evaluate an AI-specific component layer only after the ticket-agent event and
approval contracts are defined. The current assistant area is intentionally an
honest empty state rather than simulated agent behavior.
