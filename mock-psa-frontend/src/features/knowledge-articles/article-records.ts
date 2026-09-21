import { assetFixtures } from "@/features/assets/fixtures"
import { companyFixtures } from "@/features/companies/fixtures"
import { contactFixtures, getContactName } from "@/features/contacts/fixtures"
import { knowledgeArticleFixtures } from "@/features/knowledge-articles/fixtures"
import type { KnowledgeTargetType } from "@/features/knowledge-articles/types"
import { siteFixtures } from "@/features/sites/fixtures"

export const targetTypeLabels: Record<KnowledgeTargetType, string> = {
  general: "General",
  company: "Company",
  site: "Site",
  contact: "Contact",
  asset: "Asset",
}

/** Resolve only the article's one direct target; do not infer other relationships. */
export const articleRecords = knowledgeArticleFixtures
  .map((article) => {
    const targets = [
      article.companyId,
      article.siteId,
      article.contactId,
      article.assetId,
    ].filter((id) => id !== null)
    if (targets.length > 1)
      throw new Error(`Article ${article.id} has multiple synthetic targets`)

    const target = (() => {
      if (article.companyId !== null) {
        const company = companyFixtures.find(
          ({ id }) => id === article.companyId,
        )
        if (!company)
          throw new Error(`Invalid Company target for article ${article.id}`)
        return {
          type: "company" as const,
          name: company.name,
          href: `/companies/${company.id}`,
        }
      }
      if (article.siteId !== null) {
        const site = siteFixtures.find(({ id }) => id === article.siteId)
        if (!site)
          throw new Error(`Invalid Site target for article ${article.id}`)
        return {
          type: "site" as const,
          name: site.name,
          href: `/sites/${site.id}`,
        }
      }
      if (article.contactId !== null) {
        const contact = contactFixtures.find(
          ({ id }) => id === article.contactId,
        )
        if (!contact)
          throw new Error(`Invalid Contact target for article ${article.id}`)
        return {
          type: "contact" as const,
          name: getContactName(contact),
          href: `/contacts/${contact.id}`,
        }
      }
      if (article.assetId !== null) {
        const asset = assetFixtures.find(({ id }) => id === article.assetId)
        if (!asset)
          throw new Error(`Invalid Asset target for article ${article.id}`)
        return {
          type: "asset" as const,
          name: asset.name,
          href: `/assets/${asset.id}`,
        }
      }
      return null
    })()

    return { article, target, targetType: target?.type ?? ("general" as const) }
  })
  .sort(
    (a, b) =>
      Date.parse(b.article.updatedAt) - Date.parse(a.article.updatedAt) ||
      b.article.id - a.article.id,
  )
