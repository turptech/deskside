/** Synthetic frontend view model, not the KnowledgeArticle API wire type. */
export type KnowledgeArticle = {
  id: number
  companyId: number | null
  siteId: number | null
  contactId: number | null
  assetId: number | null
  title: string
  body: string
  createdAt: string
  updatedAt: string
}

export type KnowledgeTargetType =
  "general" | "company" | "site" | "contact" | "asset"
