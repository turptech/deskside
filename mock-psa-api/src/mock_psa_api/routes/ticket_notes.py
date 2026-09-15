from typing import Annotated

from fastapi import APIRouter, Header, HTTPException, Query, status
from sqlalchemy.exc import IntegrityError
from sqlmodel import select

from mock_psa_api.dependencies import CurrentUser, DatabaseSession
from mock_psa_api.models import Ticket, TicketNote, TicketNoteType, utc_now
from mock_psa_api.schemas import TicketNoteCreate, TicketNoteRead

router = APIRouter(prefix="/tickets/{ticket_id}/notes", tags=["ticket notes"])


def get_ticket_or_404(ticket_id: int, session: DatabaseSession) -> Ticket:
    ticket = session.get(Ticket, ticket_id)
    if ticket is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found",
        )
    return ticket


def get_ticket_note_or_404(
    ticket_id: int,
    note_id: int,
    session: DatabaseSession,
) -> TicketNote:
    note = session.exec(
        select(TicketNote).where(
            TicketNote.id == note_id,
            TicketNote.ticket_id == ticket_id,
        )
    ).first()
    if note is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket note not found",
        )
    return note


def normalize_idempotency_key(idempotency_key: str | None) -> str | None:
    if idempotency_key is None:
        return None
    normalized_key = idempotency_key.strip()
    if not normalized_key:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Idempotency-Key cannot be blank",
        )
    return normalized_key


def find_idempotent_note(
    user_id: int,
    idempotency_key: str,
    session: DatabaseSession,
) -> TicketNote | None:
    return session.exec(
        select(TicketNote).where(
            TicketNote.user_id == user_id,
            TicketNote.idempotency_key == idempotency_key,
        )
    ).first()


def return_idempotent_note_or_conflict(
    existing_note: TicketNote,
    ticket_id: int,
    note: TicketNoteCreate,
) -> TicketNote:
    if (
        existing_note.ticket_id == ticket_id
        and existing_note.type == note.type
        and existing_note.body == note.body
    ):
        return existing_note
    raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail="Idempotency-Key already used with different note data",
    )


@router.post("", response_model=TicketNoteRead, status_code=status.HTTP_201_CREATED)
def create_ticket_note(
    ticket_id: int,
    note: TicketNoteCreate,
    session: DatabaseSession,
    current_user: CurrentUser,
    idempotency_key: Annotated[
        str | None,
        Header(alias="Idempotency-Key", min_length=1, max_length=255),
    ] = None,
) -> TicketNote:
    ticket = get_ticket_or_404(ticket_id, session)
    user_id = current_user.id
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )

    normalized_key = normalize_idempotency_key(idempotency_key)
    if normalized_key is not None:
        existing_note = find_idempotent_note(user_id, normalized_key, session)
        if existing_note is not None:
            return return_idempotent_note_or_conflict(existing_note, ticket_id, note)

    now = utc_now()
    database_note = TicketNote(
        ticket_id=ticket_id,
        user_id=user_id,
        contact_id=None,
        type=note.type,
        body=note.body,
        created_at=now,
        idempotency_key=normalized_key,
    )
    ticket.updated_at = now
    session.add(ticket)
    session.add(database_note)
    try:
        session.commit()
    except IntegrityError as error:
        session.rollback()
        if normalized_key is not None:
            existing_note = find_idempotent_note(user_id, normalized_key, session)
            if existing_note is not None:
                return return_idempotent_note_or_conflict(
                    existing_note,
                    ticket_id,
                    note,
                )
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ticket note could not be created",
        ) from error
    session.refresh(database_note)
    return database_note


@router.get("", response_model=list[TicketNoteRead])
def list_ticket_notes(
    ticket_id: int,
    session: DatabaseSession,
    _: CurrentUser,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=100),
    note_type: Annotated[TicketNoteType | None, Query(alias="type")] = None,
    user_id: int | None = Query(default=None, gt=0),
    contact_id: int | None = Query(default=None, gt=0),
) -> list[TicketNote]:
    get_ticket_or_404(ticket_id, session)
    statement = select(TicketNote).where(TicketNote.ticket_id == ticket_id)
    if note_type is not None:
        statement = statement.where(TicketNote.type == note_type)
    if user_id is not None:
        statement = statement.where(TicketNote.user_id == user_id)
    if contact_id is not None:
        statement = statement.where(TicketNote.contact_id == contact_id)
    statement = (
        statement.order_by(TicketNote.created_at, TicketNote.id)
        .offset(offset)
        .limit(limit)
    )
    return list(session.exec(statement).all())


@router.get("/{note_id}", response_model=TicketNoteRead)
def get_ticket_note(
    ticket_id: int,
    note_id: int,
    session: DatabaseSession,
    _: CurrentUser,
) -> TicketNote:
    get_ticket_or_404(ticket_id, session)
    return get_ticket_note_or_404(ticket_id, note_id, session)
