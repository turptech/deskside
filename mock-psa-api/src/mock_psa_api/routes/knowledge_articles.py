from fastapi import APIRouter, HTTPException, Query, Response, status
from sqlalchemy.exc import IntegrityError
from sqlmodel import select

from mock_psa_api.dependencies import CurrentUser, DatabaseSession
from mock_psa_api.models import (
    Asset,
    Company,
    Contact,
    KnowledgeArticle,
    Site,
    utc_now,
)
from mock_psa_api.schemas import (
    KnowledgeArticleCreate,
    KnowledgeArticleRead,
    KnowledgeArticleUpdate,
)

router = APIRouter(prefix="/knowledge-articles", tags=["knowledge articles"])


def get_knowledge_article_or_404(
    knowledge_article_id: int,
    session: DatabaseSession,
) -> KnowledgeArticle:
    article = session.get(KnowledgeArticle, knowledge_article_id)
    if article is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Knowledge article not found",
        )
    return article


def validate_article_target(
    company_id: int | None,
    site_id: int | None,
    contact_id: int | None,
    asset_id: int | None,
    session: DatabaseSession,
) -> None:
    targets = (company_id, site_id, contact_id, asset_id)
    if sum(target is not None for target in targets) > 1:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Knowledge article can reference only one entity",
        )

    references = (
        (Company, company_id, "Company not found"),
        (Site, site_id, "Site not found"),
        (Contact, contact_id, "Contact not found"),
        (Asset, asset_id, "Asset not found"),
    )
    for model, reference_id, missing_detail in references:
        if reference_id is not None and session.get(model, reference_id) is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=missing_detail,
            )


@router.post(
    "",
    response_model=KnowledgeArticleRead,
    status_code=status.HTTP_201_CREATED,
)
def create_knowledge_article(
    article: KnowledgeArticleCreate,
    session: DatabaseSession,
    _: CurrentUser,
) -> KnowledgeArticle:
    validate_article_target(
        article.company_id,
        article.site_id,
        article.contact_id,
        article.asset_id,
        session,
    )
    now = utc_now()
    database_article = KnowledgeArticle.model_validate(article)
    database_article.created_at = now
    database_article.updated_at = now
    session.add(database_article)
    session.commit()
    session.refresh(database_article)
    return database_article


@router.get("", response_model=list[KnowledgeArticleRead])
def list_knowledge_articles(
    session: DatabaseSession,
    _: CurrentUser,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=100),
    company_id: int | None = Query(default=None, gt=0),
    site_id: int | None = Query(default=None, gt=0),
    contact_id: int | None = Query(default=None, gt=0),
    asset_id: int | None = Query(default=None, gt=0),
) -> list[KnowledgeArticle]:
    statement = select(KnowledgeArticle)
    if company_id is not None:
        statement = statement.where(KnowledgeArticle.company_id == company_id)
    if site_id is not None:
        statement = statement.where(KnowledgeArticle.site_id == site_id)
    if contact_id is not None:
        statement = statement.where(KnowledgeArticle.contact_id == contact_id)
    if asset_id is not None:
        statement = statement.where(KnowledgeArticle.asset_id == asset_id)
    statement = statement.order_by(KnowledgeArticle.id).offset(offset).limit(limit)
    return list(session.exec(statement).all())


@router.get("/{knowledge_article_id}", response_model=KnowledgeArticleRead)
def get_knowledge_article(
    knowledge_article_id: int,
    session: DatabaseSession,
    _: CurrentUser,
) -> KnowledgeArticle:
    return get_knowledge_article_or_404(knowledge_article_id, session)


@router.put("/{knowledge_article_id}", response_model=KnowledgeArticleRead)
def replace_knowledge_article(
    knowledge_article_id: int,
    replacement: KnowledgeArticleCreate,
    session: DatabaseSession,
    _: CurrentUser,
) -> KnowledgeArticle:
    article = get_knowledge_article_or_404(knowledge_article_id, session)
    validate_article_target(
        replacement.company_id,
        replacement.site_id,
        replacement.contact_id,
        replacement.asset_id,
        session,
    )
    article.sqlmodel_update(replacement.model_dump())
    article.updated_at = utc_now()
    session.add(article)
    session.commit()
    session.refresh(article)
    return article


@router.patch("/{knowledge_article_id}", response_model=KnowledgeArticleRead)
def update_knowledge_article(
    knowledge_article_id: int,
    update: KnowledgeArticleUpdate,
    session: DatabaseSession,
    _: CurrentUser,
) -> KnowledgeArticle:
    article = get_knowledge_article_or_404(knowledge_article_id, session)
    update_data = update.model_dump(exclude_unset=True)
    company_id = update_data.get("company_id", article.company_id)
    site_id = update_data.get("site_id", article.site_id)
    contact_id = update_data.get("contact_id", article.contact_id)
    asset_id = update_data.get("asset_id", article.asset_id)
    validate_article_target(company_id, site_id, contact_id, asset_id, session)
    article.sqlmodel_update(update_data)
    article.updated_at = utc_now()
    session.add(article)
    session.commit()
    session.refresh(article)
    return article


@router.delete(
    "/{knowledge_article_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_knowledge_article(
    knowledge_article_id: int,
    session: DatabaseSession,
    _: CurrentUser,
) -> Response:
    article = get_knowledge_article_or_404(knowledge_article_id, session)
    session.delete(article)
    try:
        session.commit()
    except IntegrityError as error:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Knowledge article cannot be deleted while it is referenced",
        ) from error
    return Response(status_code=status.HTTP_204_NO_CONTENT)
