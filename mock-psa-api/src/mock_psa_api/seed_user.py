import argparse
from getpass import getpass

from sqlmodel import Session, select

from mock_psa_api.database import create_tables, get_engine
from mock_psa_api.models import User
from mock_psa_api.security import hash_password


def main() -> None:
    parser = argparse.ArgumentParser(description="Create a local Mock PSA user.")
    parser.add_argument("email")
    parser.add_argument("--role", default="technician")
    args = parser.parse_args()

    email = args.email.strip().lower()
    password = getpass("Password: ")
    if not password:
        raise SystemExit("Password cannot be empty.")

    create_tables()
    with Session(get_engine()) as session:
        if session.exec(select(User).where(User.email == email)).first() is not None:
            raise SystemExit(f"User already exists: {email}")

        session.add(
            User(email=email, password_hash=hash_password(password), role=args.role)
        )
        session.commit()

    print(f"Created {args.role} user: {email}")


if __name__ == "__main__":
    main()
