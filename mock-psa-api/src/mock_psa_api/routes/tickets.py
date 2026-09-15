from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, Response, status
from sqlalchemy.exc import IntegrityError
from sqlmodel import select

from mock_psa_api.dependencies import CurrentUser, DatabaseSession
from mock_psa_api.models import (
    Asset,
    Company,
    Contact,
    Site,
    Ticket,
    TicketNote,
    TicketPriority,
    TicketSource,
    TicketStatus,
    User,
    utc_now,
)
from mock_psa_api.schemas import TicketCreate, TicketRead, TicketUpdate

router = APIRouter(prefix="/tickets", tags=["tickets"])

RESOLVED_STATUSES = {TicketStatus.RESOLVED, TicketStatus.CLOSED}


def get_ticket_or_404(ticket_id: int, session: DatabaseSession) -> Ticket:
    ticket = session.get(Ticket, ticket_id)
    if ticket is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found",
        )
    return ticket


def validate_ticket_references(
    company_id: int,
    contact_id: int,
    site_id: int | None,
    asset_id: int | None,
    assigned_user_id: int | None,
    session: DatabaseSession,
) -> None:
    if session.get(Company, company_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found",
        )

    contact = session.get(Contact, contact_id)
    if contact is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found",
        )
    if contact.company_id != company_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Contact does not belong to Company",
        )

    if site_id is not None:
        site = session.get(Site, site_id)
        if site is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Site not found",
            )
        if site.company_id != company_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Site does not belong to Company",
            )

    if asset_id is not None:
        asset = session.get(Asset, asset_id)
        if asset is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Asset not found",
            )
        if asset.company_id != company_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Asset does not belong to Company",
            )

    if assigned_user_id is not None and session.get(User, assigned_user_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )


def update_lifecycle_timestamps(
    ticket: Ticket,
    new_status: TicketStatus | str,
    now: datetime,
) -> None:
    ticket.updated_at = now
    if new_status in RESOLVED_STATUSES:
        if ticket.resolved_at is None:
            ticket.resolved_at = now
    else:
        ticket.resolved_at = None


@router.post("", response_model=TicketRead, status_code=status.HTTP_201_CREATED)
def create_ticket(
    ticket: TicketCreate,
    session: DatabaseSession,
    _: CurrentUser,
) -> Ticket:
    validate_ticket_references(
        ticket.company_id,
        ticket.contact_id,
        ticket.site_id,
        ticket.asset_id,
        ticket.assigned_user_id,
        session,
    )
    database_ticket = Ticket.model_validate(ticket)
    now = utc_now()
    database_ticket.created_at = now
    update_lifecycle_timestamps(database_ticket, ticket.status, now)
    session.add(database_ticket)
    session.commit()
    session.refresh(database_ticket)
    return database_ticket


@router.get("", response_model=list[TicketRead])
def list_tickets(
    session: DatabaseSession,
    _: CurrentUser,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=100),
    company_id: int | None = Query(default=None, gt=0),
    contact_id: int | None = Query(default=None, gt=0),
    site_id: int | None = Query(default=None, gt=0),
    asset_id: int | None = Query(default=None, gt=0),
    assigned_user_id: int | None = Query(default=None, gt=0),
    ticket_status: Annotated[TicketStatus | None, Query(alias="status")] = None,
    priority: TicketPriority | None = None,
    source: TicketSource | None = None,
) -> list[Ticket]:
    statement = select(Ticket)
    if company_id is not None:
        statement = statement.where(Ticket.company_id == company_id)
    if contact_id is not None:
        statement = statement.where(Ticket.contact_id == contact_id)
    if site_id is not None:
        statement = statement.where(Ticket.site_id == site_id)
    if asset_id is not None:
        statement = statement.where(Ticket.asset_id == asset_id)
    if assigned_user_id is not None:
        statement = statement.where(Ticket.assigned_user_id == assigned_user_id)
    if ticket_status is not None:
        statement = statement.where(Ticket.status == ticket_status)
    if priority is not None:
        statement = statement.where(Ticket.priority == priority)
    if source is not None:
        statement = statement.where(Ticket.source == source)
    statement = statement.order_by(Ticket.id).offset(offset).limit(limit)
    return list(session.exec(statement).all())


@router.get("/{ticket_id}", response_model=TicketRead)
def get_ticket(
    ticket_id: int,
    session: DatabaseSession,
    _: CurrentUser,
) -> Ticket:
    return get_ticket_or_404(ticket_id, session)


@router.put("/{ticket_id}", response_model=TicketRead)
def replace_ticket(
    ticket_id: int,
    replacement: TicketCreate,
    session: DatabaseSession,
    _: CurrentUser,
) -> Ticket:
    ticket = get_ticket_or_404(ticket_id, session)
    validate_ticket_references(
        replacement.company_id,
        replacement.contact_id,
        replacement.site_id,
        replacement.asset_id,
        replacement.assigned_user_id,
        session,
    )
    ticket.sqlmodel_update(replacement.model_dump())
    update_lifecycle_timestamps(ticket, replacement.status, utc_now())
    session.add(ticket)
    session.commit()
    session.refresh(ticket)
    return ticket


@router.patch("/{ticket_id}", response_model=TicketRead)
def update_ticket(
    ticket_id: int,
    update: TicketUpdate,
    session: DatabaseSession,
    _: CurrentUser,
) -> Ticket:
    ticket = get_ticket_or_404(ticket_id, session)
    update_data = update.model_dump(exclude_unset=True)
    company_id = update_data.get("company_id", ticket.company_id)
    contact_id = update_data.get("contact_id", ticket.contact_id)
    site_id = update_data.get("site_id", ticket.site_id)
    asset_id = update_data.get("asset_id", ticket.asset_id)
    assigned_user_id = update_data.get(
        "assigned_user_id",
        ticket.assigned_user_id,
    )
    validate_ticket_references(
        company_id,
        contact_id,
        site_id,
        asset_id,
        assigned_user_id,
        session,
    )
    new_status = update_data.get("status", ticket.status)
    ticket.sqlmodel_update(update_data)
    update_lifecycle_timestamps(ticket, new_status, utc_now())
    session.add(ticket)
    session.commit()
    session.refresh(ticket)
    return ticket


@router.delete("/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ticket(
    ticket_id: int,
    session: DatabaseSession,
    _: CurrentUser,
) -> Response:
    ticket = get_ticket_or_404(ticket_id, session)
    referenced_note = session.exec(
        select(TicketNote.id).where(TicketNote.ticket_id == ticket_id)
    ).first()
    if referenced_note is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ticket cannot be deleted while it has notes",
        )

    session.delete(ticket)
    try:
        session.commit()
    except IntegrityError as error:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ticket cannot be deleted while it is referenced",
        ) from error
    return Response(status_code=status.HTTP_204_NO_CONTENT)
