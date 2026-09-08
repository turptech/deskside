from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session

from mock_psa_api.config import Settings, get_settings
from mock_psa_api.database import get_session
from mock_psa_api.models import User
from mock_psa_api.security import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

DatabaseSession = Annotated[Session, Depends(get_session)]


def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    session: DatabaseSession,
    settings: Annotated[Settings, Depends(get_settings)],
) -> User:
    user_id = decode_access_token(token, settings.jwt_secret_key)
    user = session.get(User, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
