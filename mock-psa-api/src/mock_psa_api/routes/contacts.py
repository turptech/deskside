from fastapi import APIRouter, HTTPException, Query, Response, status
from sqlalchemy.exc import IntegrityError
from sqlmodel import select

from mock_psa_api.dependencies import CurrentUser, DatabaseSession
from mock_psa_api.models import Asset, Company, Contact, KnowledgeArticle, Site, Ticket
from mock_psa_api.schemas import ContactCreate, ContactRead, ContactUpdate

router = APIRouter(prefix="/contacts", tags=["contacts"])


def get_contact_or_404(contact_id: int, session: DatabaseSession) -> Contact:
    contact = session.get(Contact, contact_id)
    if contact is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found",
        )
    return contact


def validate_company_and_site(
    company_id: int,
    site_id: int | None,
    session: DatabaseSession,
) -> None:
    if session.get(Company, company_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found",
        )

    if site_id is None:
        return

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


def ensure_company_change_allowed(
    contact: Contact,
    company_id: int,
    session: DatabaseSession,
) -> None:
    if contact.company_id == company_id:
        return

    referenced_ticket = session.exec(
        select(Ticket.id).where(Ticket.contact_id == contact.id)
    ).first()
    if referenced_ticket is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Contact cannot change Company while it has tickets",
        )

    referenced_asset = session.exec(
        select(Asset.id).where(Asset.contact_id == contact.id)
    ).first()
    if referenced_asset is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Contact cannot change Company while it has assets",
        )


@router.post("", response_model=ContactRead, status_code=status.HTTP_201_CREATED)
def create_contact(
    contact: ContactCreate,
    session: DatabaseSession,
    _: CurrentUser,
) -> Contact:
    validate_company_and_site(contact.company_id, contact.site_id, session)
    database_contact = Contact.model_validate(contact)
    session.add(database_contact)
    session.commit()
    session.refresh(database_contact)
    return database_contact


@router.get("", response_model=list[ContactRead])
def list_contacts(
    session: DatabaseSession,
    _: CurrentUser,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=100),
    company_id: int | None = Query(default=None, gt=0),
    site_id: int | None = Query(default=None, gt=0),
) -> list[Contact]:
    statement = select(Contact)
    if company_id is not None:
        statement = statement.where(Contact.company_id == company_id)
    if site_id is not None:
        statement = statement.where(Contact.site_id == site_id)
    statement = statement.order_by(Contact.id).offset(offset).limit(limit)
    return list(session.exec(statement).all())


@router.get("/{contact_id}", response_model=ContactRead)
def get_contact(
    contact_id: int,
    session: DatabaseSession,
    _: CurrentUser,
) -> Contact:
    return get_contact_or_404(contact_id, session)


@router.put("/{contact_id}", response_model=ContactRead)
def replace_contact(
    contact_id: int,
    replacement: ContactCreate,
    session: DatabaseSession,
    _: CurrentUser,
) -> Contact:
    contact = get_contact_or_404(contact_id, session)
    validate_company_and_site(
        replacement.company_id,
        replacement.site_id,
        session,
    )
    ensure_company_change_allowed(contact, replacement.company_id, session)
    contact.sqlmodel_update(replacement.model_dump())
    session.add(contact)
    session.commit()
    session.refresh(contact)
    return contact


@router.patch("/{contact_id}", response_model=ContactRead)
def update_contact(
    contact_id: int,
    update: ContactUpdate,
    session: DatabaseSession,
    _: CurrentUser,
) -> Contact:
    contact = get_contact_or_404(contact_id, session)
    update_data = update.model_dump(exclude_unset=True)
    company_id = update_data.get("company_id", contact.company_id)
    site_id = update_data.get("site_id", contact.site_id)
    validate_company_and_site(company_id, site_id, session)
    ensure_company_change_allowed(contact, company_id, session)
    contact.sqlmodel_update(update_data)
    session.add(contact)
    session.commit()
    session.refresh(contact)
    return contact


@router.delete("/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contact(
    contact_id: int,
    session: DatabaseSession,
    _: CurrentUser,
) -> Response:
    contact = get_contact_or_404(contact_id, session)
    referenced_ticket = session.exec(
        select(Ticket.id).where(Ticket.contact_id == contact_id)
    ).first()
    if referenced_ticket is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Contact cannot be deleted while it has tickets",
        )

    referenced_asset = session.exec(
        select(Asset.id).where(Asset.contact_id == contact_id)
    ).first()
    if referenced_asset is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Contact cannot be deleted while it has assets",
        )

    referenced_article = session.exec(
        select(KnowledgeArticle.id).where(KnowledgeArticle.contact_id == contact_id)
    ).first()
    if referenced_article is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Contact cannot be deleted while it has knowledge articles",
        )

    session.delete(contact)
    try:
        session.commit()
    except IntegrityError as error:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Contact cannot be deleted while it is referenced",
        ) from error
    return Response(status_code=status.HTTP_204_NO_CONTENT)
