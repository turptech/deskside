# Mock PSA API

## Development

From the repository root, enter the API project, create the PostgreSQL database,
then copy and update the local configuration:

```console
cd mock-psa-api
createdb mock_psa
cp .env.example .env
```

`DATABASE_URL` contains the PostgreSQL credentials. Generate a JWT secret with
`openssl rand -hex 32` and use it for `JWT_SECRET_KEY`. The `.env` file is ignored
by Git; `.env.example` documents the required values.

### Reloadable demo data

The frontend and API loader share the versioned synthetic records in
[`../demo-fixtures/psa.json`](../demo-fixtures/psa.json). The frontend still
renders local fixtures; this does not connect its screens to the API.

For a separate, disposable local PostgreSQL database, create `mock_psa_demo`
once and set `DATABASE_URL` in `mock-psa-api/.env` to its local connection URL
(for example, `postgresql+psycopg://localhost/mock_psa_demo`). Keep the normal
development database separate. Then, from `mock-psa-api`, run:

```console
createdb mock_psa_demo
uv run python -m mock_psa_api.load_demo --check
uv run python -m mock_psa_api.load_demo --reset
```

`--check` validates all fixture records and relationships without connecting
to the database. `--reset` validates first, then replaces **all PSA records**
in `mock_psa_demo` with the committed baseline. It refuses any non-local host,
non-PostgreSQL database, or database with another name. Changes to demo PSA
records are intentionally discarded on the next reset. Existing non-fixture
User accounts are retained, so you can create your normal login with
`seed_user` below before or after loading. The three fixture technician users
are recreated with random, undisclosed passwords on each reset; use your own
login for the API and Swagger. Fixture loading never runs at application startup.

Create a user (the password is entered without echoing it):

```console
uv run python -m mock_psa_api.seed_user tech@example.com --role technician
```

The application uses SQLModel and creates its tables at startup. Start
the development server with:

```console
uv run fastapi dev
```

Then open <http://127.0.0.1:8000/>.

Log in with the seeded credentials:

```console
curl -X POST http://127.0.0.1:8000/login \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'username=tech@example.com' \
  --data-urlencode 'password=your-password'
```

The response contains a signed bearer token with the user's ID in `sub`, their
role, and a 30-minute expiration by default.

Use that token to validate the session and retrieve the safe current-user view:

```console
curl http://127.0.0.1:8000/me \
  -H 'Authorization: Bearer your-access-token'
```

`GET /me` returns only the user's ID, email, and role. Missing, malformed,
expired, or deleted-user tokens return `401`. The API uses stateless bearer
tokens, so logout is performed by removing the token in the client; there is no
server-side logout or token revocation endpoint.

Run the tests with:

```console
uv run pytest
```
