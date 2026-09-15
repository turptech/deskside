from fastapi import APIRouter, HTTPException, Query, Response, status
from sqlalchemy.exc import IntegrityError
from sqlmodel import select

from mock_psa_api.dependencies import CurrentUser, DatabaseSession
from mock_psa_api.models import Asset, Company, Contact, KnowledgeArticle, Site, Ticket
from mock_psa_api.schemas import SiteCreate, SiteRead, SiteUpdate

router = APIRouter(prefix="/sites", tags=["sites"])


def get_site_or_404(site_id: int, session: DatabaseSession) -> Site:
    site = session.get(Site, site_id)
    if site is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Site not found",
        )
    return site


def ensure_company_exists(company_id: int, session: DatabaseSession) -> None:
    if session.get(Company, company_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found",
        )


def ensure_company_change_allowed(
    site: Site,
    company_id: int,
    session: DatabaseSession,
) -> None:
    if site.company_id == company_id:
        return

    referenced_ticket = session.exec(
        select(Ticket.id).where(Ticket.site_id == site.id)
    ).first()
    if referenced_ticket is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Site cannot change Company while it has tickets",
        )

    referenced_contact = session.exec(
        select(Contact.id).where(Contact.site_id == site.id)
    ).first()
    if referenced_contact is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Site cannot change Company while it has contacts",
        )

    referenced_asset = session.exec(
        select(Asset.id).where(Asset.site_id == site.id)
    ).first()
    if referenced_asset is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Site cannot change Company while it has assets",
        )


@router.post("", response_model=SiteRead, status_code=status.HTTP_201_CREATED)
def create_site(
    site: SiteCreate,
    session: DatabaseSession,
    _: CurrentUser,
) -> Site:
    ensure_company_exists(site.company_id, session)
    database_site = Site.model_validate(site)
    session.add(database_site)
    session.commit()
    session.refresh(database_site)
    return database_site


@router.get("", response_model=list[SiteRead])
def list_sites(
    session: DatabaseSession,
    _: CurrentUser,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=100),
    company_id: int | None = Query(default=None, gt=0),
) -> list[Site]:
    statement = select(Site).order_by(Site.id).offset(offset).limit(limit)
    if company_id is not None:
        statement = statement.where(Site.company_id == company_id)
    return list(session.exec(statement).all())


@router.get("/{site_id}", response_model=SiteRead)
def get_site(
    site_id: int,
    session: DatabaseSession,
    _: CurrentUser,
) -> Site:
    return get_site_or_404(site_id, session)


@router.put("/{site_id}", response_model=SiteRead)
def replace_site(
    site_id: int,
    replacement: SiteCreate,
    session: DatabaseSession,
    _: CurrentUser,
) -> Site:
    site = get_site_or_404(site_id, session)
    ensure_company_exists(replacement.company_id, session)
    ensure_company_change_allowed(site, replacement.company_id, session)
    site.sqlmodel_update(replacement.model_dump())
    session.add(site)
    session.commit()
    session.refresh(site)
    return site


@router.patch("/{site_id}", response_model=SiteRead)
def update_site(
    site_id: int,
    update: SiteUpdate,
    session: DatabaseSession,
    _: CurrentUser,
) -> Site:
    site = get_site_or_404(site_id, session)
    update_data = update.model_dump(exclude_unset=True)
    if "company_id" in update_data:
        ensure_company_exists(update_data["company_id"], session)
        ensure_company_change_allowed(site, update_data["company_id"], session)
    site.sqlmodel_update(update_data)
    session.add(site)
    session.commit()
    session.refresh(site)
    return site


@router.delete("/{site_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_site(
    site_id: int,
    session: DatabaseSession,
    _: CurrentUser,
) -> Response:
    site = get_site_or_404(site_id, session)
    referenced_ticket = session.exec(
        select(Ticket.id).where(Ticket.site_id == site_id)
    ).first()
    if referenced_ticket is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Site cannot be deleted while it has tickets",
        )

    referenced_contact = session.exec(
        select(Contact.id).where(Contact.site_id == site_id)
    ).first()
    if referenced_contact is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Site cannot be deleted while it has contacts",
        )

    referenced_asset = session.exec(
        select(Asset.id).where(Asset.site_id == site_id)
    ).first()
    if referenced_asset is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Site cannot be deleted while it has assets",
        )

    referenced_article = session.exec(
        select(KnowledgeArticle.id).where(KnowledgeArticle.site_id == site_id)
    ).first()
    if referenced_article is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Site cannot be deleted while it has knowledge articles",
        )

    session.delete(site)
    try:
        session.commit()
    except IntegrityError as error:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Site cannot be deleted while it is referenced",
        ) from error
    return Response(status_code=status.HTTP_204_NO_CONTENT)
