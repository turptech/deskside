import { demoData } from "@/demo-data"
import type { KnowledgeArticle } from "@/features/knowledge-articles/types"

export const knowledgeArticleFixtures: KnowledgeArticle[] =
  demoData.knowledge_articles.map((article) => ({
    id: article.id,
    companyId: article.company_id,
    siteId: article.site_id,
    contactId: article.contact_id,
    assetId: article.asset_id,
    title: article.title,
    body: article.body,
    createdAt: article.created_at,
    updatedAt: article.updated_at,
  }))
