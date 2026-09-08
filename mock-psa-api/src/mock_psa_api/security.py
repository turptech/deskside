from datetime import UTC, datetime, timedelta

import jwt
from fastapi import HTTPException, status
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
    expires_at = datetime.now(UTC) + timedelta(minutes=expires_minutes)
    return jwt.encode(
        {"sub": str(user_id), "role": role, "exp": expires_at},
        secret_key,
        algorithm=ALGORITHM,
    )


def decode_access_token(token: str, secret_key: str) -> int:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, secret_key, algorithms=[ALGORITHM])
        subject = payload.get("sub")
        if subject is None:
            raise credentials_error
        return int(subject)
    except (jwt.InvalidTokenError, TypeError, ValueError) as error:
        raise credentials_error from error
