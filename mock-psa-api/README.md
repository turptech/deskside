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

Create a user (the password is entered without echoing it):

```console
uv run python -m mock_psa_api.seed_user tech@example.com --role technician
```

The application uses SQLModel and creates the `users` table at startup. Start
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

Run the tests with:

```console
uv run pytest
```
