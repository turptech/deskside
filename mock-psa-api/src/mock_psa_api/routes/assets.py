from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, Response, status
from sqlmodel import select

from mock_psa_api.dependencies import CurrentUser, DatabaseSession
from mock_psa_api.models import Asset, AssetStatus, AssetType, Company, Contact, Site
from mock_psa_api.schemas import AssetCreate, AssetRead, AssetUpdate

router = APIRouter(prefix="/assets", tags=["assets"])


def get_asset_or_404(asset_id: int, session: DatabaseSession) -> Asset:
    asset = session.get(Asset, asset_id)
    if asset is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found",
        )
    return asset


def validate_asset_assignment(
    company_id: int,
    site_id: int | None,
    contact_id: int | None,
    session: DatabaseSession,
) -> None:
    if session.get(Company, company_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found",
        )

    if site_id is not None and contact_id is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Asset cannot be assigned to both a Site and a Contact",
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

    if contact_id is not None:
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


@router.post("", response_model=AssetRead, status_code=status.HTTP_201_CREATED)
def create_asset(
    asset: AssetCreate,
    session: DatabaseSession,
    _: CurrentUser,
) -> Asset:
    validate_asset_assignment(
        asset.company_id,
        asset.site_id,
        asset.contact_id,
        session,
    )
    database_asset = Asset.model_validate(asset)
    session.add(database_asset)
    session.commit()
    session.refresh(database_asset)
    return database_asset


@router.get("", response_model=list[AssetRead])
def list_assets(
    session: DatabaseSession,
    _: CurrentUser,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=100),
    company_id: int | None = Query(default=None, gt=0),
    site_id: int | None = Query(default=None, gt=0),
    contact_id: int | None = Query(default=None, gt=0),
    asset_type: AssetType | None = None,
    asset_status: Annotated[AssetStatus | None, Query(alias="status")] = None,
) -> list[Asset]:
    statement = select(Asset)
    if company_id is not None:
        statement = statement.where(Asset.company_id == company_id)
    if site_id is not None:
        statement = statement.where(Asset.site_id == site_id)
    if contact_id is not None:
        statement = statement.where(Asset.contact_id == contact_id)
    if asset_type is not None:
        statement = statement.where(Asset.asset_type == asset_type)
    if asset_status is not None:
        statement = statement.where(Asset.status == asset_status)
    statement = statement.order_by(Asset.id).offset(offset).limit(limit)
    return list(session.exec(statement).all())


@router.get("/{asset_id}", response_model=AssetRead)
def get_asset(
    asset_id: int,
    session: DatabaseSession,
    _: CurrentUser,
) -> Asset:
    return get_asset_or_404(asset_id, session)


@router.put("/{asset_id}", response_model=AssetRead)
def replace_asset(
    asset_id: int,
    replacement: AssetCreate,
    session: DatabaseSession,
    _: CurrentUser,
) -> Asset:
    asset = get_asset_or_404(asset_id, session)
    validate_asset_assignment(
        replacement.company_id,
        replacement.site_id,
        replacement.contact_id,
        session,
    )
    asset.sqlmodel_update(replacement.model_dump())
    session.add(asset)
    session.commit()
    session.refresh(asset)
    return asset


@router.patch("/{asset_id}", response_model=AssetRead)
def update_asset(
    asset_id: int,
    update: AssetUpdate,
    session: DatabaseSession,
    _: CurrentUser,
) -> Asset:
    asset = get_asset_or_404(asset_id, session)
    update_data = update.model_dump(exclude_unset=True)
    company_id = update_data.get("company_id", asset.company_id)
    site_id = update_data.get("site_id", asset.site_id)
    contact_id = update_data.get("contact_id", asset.contact_id)
    validate_asset_assignment(company_id, site_id, contact_id, session)
    asset.sqlmodel_update(update_data)
    session.add(asset)
    session.commit()
    session.refresh(asset)
    return asset


@router.delete("/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_asset(
    asset_id: int,
    session: DatabaseSession,
    _: CurrentUser,
) -> Response:
    asset = get_asset_or_404(asset_id, session)
    session.delete(asset)
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
