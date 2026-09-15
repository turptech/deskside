from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Header, HTTPException, Query, Response, status
from pydantic import AwareDatetime
from sqlalchemy.exc import IntegrityError
from sqlmodel import select

from mock_psa_api.dependencies import CurrentUser, DatabaseSession
from mock_psa_api.models import Ticket, TicketNote, TimeEntry, utc_now
from mock_psa_api.schemas import TimeEntryCreate, TimeEntryRead, TimeEntryUpdate

router = APIRouter(
    prefix="/tickets/{ticket_id}/time-entries",
    tags=["time entries"],
)


def get_ticket_or_404(ticket_id: int, session: DatabaseSession) -> Ticket:
    ticket = session.get(Ticket, ticket_id)
    if ticket is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found",
        )
    return ticket


def get_time_entry_or_404(
    ticket_id: int,
    time_entry_id: int,
    session: DatabaseSession,
) -> TimeEntry:
    time_entry = session.exec(
        select(TimeEntry).where(
            TimeEntry.id == time_entry_id,
            TimeEntry.ticket_id == ticket_id,
        )
    ).first()
    if time_entry is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Time entry not found",
        )
    return time_entry


def validate_ticket_note_link(
    ticket_id: int,
    user_id: int,
    ticket_note_id: int | None,
    session: DatabaseSession,
    *,
    time_entry_id: int | None = None,
) -> None:
    if ticket_note_id is None:
        return

    ticket_note = session.get(TicketNote, ticket_note_id)
    if ticket_note is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket note not found",
        )
    if ticket_note.ticket_id != ticket_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ticket note does not belong to Ticket",
        )
    if ticket_note.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ticket note does not belong to User",
        )

    statement = select(TimeEntry.id).where(TimeEntry.ticket_note_id == ticket_note_id)
    if time_entry_id is not None:
        statement = statement.where(TimeEntry.id != time_entry_id)
    if session.exec(statement).first() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ticket note already has a time entry",
        )


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


def find_idempotent_time_entry(
    user_id: int,
    idempotency_key: str,
    session: DatabaseSession,
) -> TimeEntry | None:
    return session.exec(
        select(TimeEntry).where(
            TimeEntry.user_id == user_id,
            TimeEntry.idempotency_key == idempotency_key,
        )
    ).first()


def as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)


def return_idempotent_time_entry_or_conflict(
    existing_time_entry: TimeEntry,
    ticket_id: int,
    time_entry: TimeEntryCreate,
) -> TimeEntry:
    if (
        existing_time_entry.ticket_id == ticket_id
        and existing_time_entry.ticket_note_id == time_entry.ticket_note_id
        and as_utc(existing_time_entry.started_at) == as_utc(time_entry.started_at)
        and existing_time_entry.duration_minutes == time_entry.duration_minutes
        and existing_time_entry.description == time_entry.description
        and existing_time_entry.billable == time_entry.billable
    ):
        return existing_time_entry
    raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail="Idempotency-Key already used with different time entry data",
    )


def get_integrity_conflict(
    ticket_note_id: int | None,
    session: DatabaseSession,
    *,
    time_entry_id: int | None = None,
) -> HTTPException:
    if ticket_note_id is not None:
        statement = select(TimeEntry.id).where(
            TimeEntry.ticket_note_id == ticket_note_id
        )
        if time_entry_id is not None:
            statement = statement.where(TimeEntry.id != time_entry_id)
        if session.exec(statement).first() is not None:
            return HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Ticket note already has a time entry",
            )
    return HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail="Time entry could not be saved",
    )


@router.post("", response_model=TimeEntryRead, status_code=status.HTTP_201_CREATED)
def create_time_entry(
    ticket_id: int,
    time_entry: TimeEntryCreate,
    session: DatabaseSession,
    current_user: CurrentUser,
    idempotency_key: Annotated[
        str | None,
        Header(alias="Idempotency-Key", min_length=1, max_length=255),
    ] = None,
) -> TimeEntry:
    ticket = get_ticket_or_404(ticket_id, session)
    user_id = current_user.id
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )

    normalized_key = normalize_idempotency_key(idempotency_key)
    if normalized_key is not None:
        existing_time_entry = find_idempotent_time_entry(
            user_id,
            normalized_key,
            session,
        )
        if existing_time_entry is not None:
            return return_idempotent_time_entry_or_conflict(
                existing_time_entry,
                ticket_id,
                time_entry,
            )

    validate_ticket_note_link(
        ticket_id,
        user_id,
        time_entry.ticket_note_id,
        session,
    )
    now = utc_now()
    database_time_entry = TimeEntry(
        ticket_id=ticket_id,
        user_id=user_id,
        ticket_note_id=time_entry.ticket_note_id,
        started_at=time_entry.started_at,
        duration_minutes=time_entry.duration_minutes,
        description=time_entry.description,
        billable=time_entry.billable,
        created_at=now,
        updated_at=now,
        idempotency_key=normalized_key,
    )
    ticket.updated_at = now
    session.add(ticket)
    session.add(database_time_entry)
    try:
        session.commit()
    except IntegrityError as error:
        session.rollback()
        if normalized_key is not None:
            existing_time_entry = find_idempotent_time_entry(
                user_id,
                normalized_key,
                session,
            )
            if existing_time_entry is not None:
                return return_idempotent_time_entry_or_conflict(
                    existing_time_entry,
                    ticket_id,
                    time_entry,
                )
        raise get_integrity_conflict(time_entry.ticket_note_id, session) from error
    session.refresh(database_time_entry)
    return database_time_entry


@router.get("", response_model=list[TimeEntryRead])
def list_time_entries(
    ticket_id: int,
    session: DatabaseSession,
    _: CurrentUser,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=100),
    user_id: int | None = Query(default=None, gt=0),
    ticket_note_id: int | None = Query(default=None, gt=0),
    billable: bool | None = None,
    started_at_from: Annotated[AwareDatetime | None, Query()] = None,
    started_at_to: Annotated[AwareDatetime | None, Query()] = None,
) -> list[TimeEntry]:
    get_ticket_or_404(ticket_id, session)
    if (
        started_at_from is not None
        and started_at_to is not None
        and started_at_from > started_at_to
    ):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="started_at_from cannot be after started_at_to",
        )

    statement = select(TimeEntry).where(TimeEntry.ticket_id == ticket_id)
    if user_id is not None:
        statement = statement.where(TimeEntry.user_id == user_id)
    if ticket_note_id is not None:
        statement = statement.where(TimeEntry.ticket_note_id == ticket_note_id)
    if billable is not None:
        statement = statement.where(TimeEntry.billable == billable)
    if started_at_from is not None:
        statement = statement.where(
            TimeEntry.started_at >= started_at_from.astimezone(UTC)
        )
    if started_at_to is not None:
        statement = statement.where(
            TimeEntry.started_at <= started_at_to.astimezone(UTC)
        )
    statement = (
        statement.order_by(TimeEntry.started_at, TimeEntry.id)
        .offset(offset)
        .limit(limit)
    )
    return list(session.exec(statement).all())


@router.get("/{time_entry_id}", response_model=TimeEntryRead)
def get_time_entry(
    ticket_id: int,
    time_entry_id: int,
    session: DatabaseSession,
    _: CurrentUser,
) -> TimeEntry:
    get_ticket_or_404(ticket_id, session)
    return get_time_entry_or_404(ticket_id, time_entry_id, session)


@router.put("/{time_entry_id}", response_model=TimeEntryRead)
def replace_time_entry(
    ticket_id: int,
    time_entry_id: int,
    replacement: TimeEntryCreate,
    session: DatabaseSession,
    _: CurrentUser,
) -> TimeEntry:
    ticket = get_ticket_or_404(ticket_id, session)
    time_entry = get_time_entry_or_404(ticket_id, time_entry_id, session)
    validate_ticket_note_link(
        ticket_id,
        time_entry.user_id,
        replacement.ticket_note_id,
        session,
        time_entry_id=time_entry_id,
    )
    time_entry.sqlmodel_update(replacement.model_dump())
    now = utc_now()
    time_entry.updated_at = now
    ticket.updated_at = now
    session.add(ticket)
    session.add(time_entry)
    try:
        session.commit()
    except IntegrityError as error:
        session.rollback()
        raise get_integrity_conflict(
            replacement.ticket_note_id,
            session,
            time_entry_id=time_entry_id,
        ) from error
    session.refresh(time_entry)
    return time_entry


@router.patch("/{time_entry_id}", response_model=TimeEntryRead)
def update_time_entry(
    ticket_id: int,
    time_entry_id: int,
    update: TimeEntryUpdate,
    session: DatabaseSession,
    _: CurrentUser,
) -> TimeEntry:
    ticket = get_ticket_or_404(ticket_id, session)
    time_entry = get_time_entry_or_404(ticket_id, time_entry_id, session)
    update_data = update.model_dump(exclude_unset=True)
    ticket_note_id = update_data.get(
        "ticket_note_id",
        time_entry.ticket_note_id,
    )
    validate_ticket_note_link(
        ticket_id,
        time_entry.user_id,
        ticket_note_id,
        session,
        time_entry_id=time_entry_id,
    )
    time_entry.sqlmodel_update(update_data)
    now = utc_now()
    time_entry.updated_at = now
    ticket.updated_at = now
    session.add(ticket)
    session.add(time_entry)
    try:
        session.commit()
    except IntegrityError as error:
        session.rollback()
        raise get_integrity_conflict(
            ticket_note_id,
            session,
            time_entry_id=time_entry_id,
        ) from error
    session.refresh(time_entry)
    return time_entry


@router.delete("/{time_entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_time_entry(
    ticket_id: int,
    time_entry_id: int,
    session: DatabaseSession,
    _: CurrentUser,
) -> Response:
    ticket = get_ticket_or_404(ticket_id, session)
    time_entry = get_time_entry_or_404(ticket_id, time_entry_id, session)
    ticket.updated_at = utc_now()
    session.add(ticket)
    session.delete(time_entry)
    try:
        session.commit()
    except IntegrityError as error:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Time entry cannot be deleted while it is referenced",
        ) from error
    return Response(status_code=status.HTTP_204_NO_CONTENT)
