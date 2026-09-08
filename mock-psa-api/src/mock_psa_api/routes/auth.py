from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from mock_psa_api.config import Settings, get_settings
from mock_psa_api.database import get_session
from mock_psa_api.models import User
from mock_psa_api.schemas import LoginRequest, TokenResponse
from mock_psa_api.security import (
    DUMMY_PASSWORD_HASH,
    create_access_token,
    verify_password,
)

router = APIRouter(tags=["authentication"])


@router.post("/login", response_model=TokenResponse)
def login(
    credentials: LoginRequest,
    session: Annotated[Session, Depends(get_session)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> TokenResponse:
    email = str(credentials.email).lower()
    user = session.exec(select(User).where(User.email == email)).first()

    if user is None:
        verify_password(credentials.password, DUMMY_PASSWORD_HASH)
    if user is None or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(
        user_id=user.id,
        role=user.role,
        secret_key=settings.jwt_secret_key,
        expires_minutes=settings.access_token_expire_minutes,
    )
    return TokenResponse(access_token=token)
