from datetime import datetime, timedelta, timezone

import jwt
from pwdlib import PasswordHash


ALGORITHM = "HS256"
password_hash = PasswordHash.recommended()
DUMMY_PASSWORD_HASH = password_hash.hash("not-a-real-password")


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(password: str, stored_hash: str) -> bool:
    return password_hash.verify(password, stored_hash)


def create_access_token(
    *, user_id: int, role: str, secret_key: str, expires_minutes: int
) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)
    return jwt.encode(
        {"sub": str(user_id), "role": role, "exp": expires_at},
        secret_key,
        algorithm=ALGORITHM,
    )
