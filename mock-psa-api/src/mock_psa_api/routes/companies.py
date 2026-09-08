from fastapi import APIRouter, HTTPException, Query, Response, status
from sqlmodel import select

from mock_psa_api.dependencies import CurrentUser, DatabaseSession
from mock_psa_api.models import Company
from mock_psa_api.schemas import CompanyCreate, CompanyRead, CompanyUpdate

router = APIRouter(prefix="/companies", tags=["companies"])


def get_company_or_404(company_id: int, session: DatabaseSession) -> Company:
    company = session.get(Company, company_id)
    if company is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found",
        )
    return company


@router.post("", response_model=CompanyRead, status_code=status.HTTP_201_CREATED)
def create_company(
    company: CompanyCreate,
    session: DatabaseSession,
    _: CurrentUser,
) -> Company:
    database_company = Company.model_validate(company)
    session.add(database_company)
    session.commit()
    session.refresh(database_company)
    return database_company


@router.get("", response_model=list[CompanyRead])
def list_companies(
    session: DatabaseSession,
    _: CurrentUser,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=100),
) -> list[Company]:
    statement = select(Company).order_by(Company.id).offset(offset).limit(limit)
    return list(session.exec(statement).all())


@router.get("/{company_id}", response_model=CompanyRead)
def get_company(
    company_id: int,
    session: DatabaseSession,
    _: CurrentUser,
) -> Company:
    return get_company_or_404(company_id, session)


@router.put("/{company_id}", response_model=CompanyRead)
def replace_company(
    company_id: int,
    replacement: CompanyCreate,
    session: DatabaseSession,
    _: CurrentUser,
) -> Company:
    company = get_company_or_404(company_id, session)
    company.sqlmodel_update(replacement.model_dump())
    session.add(company)
    session.commit()
    session.refresh(company)
    return company


@router.patch("/{company_id}", response_model=CompanyRead)
def update_company(
    company_id: int,
    update: CompanyUpdate,
    session: DatabaseSession,
    _: CurrentUser,
) -> Company:
    company = get_company_or_404(company_id, session)
    company.sqlmodel_update(update.model_dump(exclude_unset=True))
    session.add(company)
    session.commit()
    session.refresh(company)
    return company


@router.delete("/{company_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_company(
    company_id: int,
    session: DatabaseSession,
    _: CurrentUser,
) -> Response:
    company = get_company_or_404(company_id, session)
    session.delete(company)
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
