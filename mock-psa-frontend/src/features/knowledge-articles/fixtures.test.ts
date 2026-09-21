import { articleRecords } from "@/features/knowledge-articles/article-records"
import { knowledgeArticleFixtures } from "@/features/knowledge-articles/fixtures"

describe("synthetic knowledge articles", () => {
  it("has stable identities, required text, UTC timestamps, and at most one target", () => {
    expect(knowledgeArticleFixtures).toHaveLength(6)
    expect(new Set(knowledgeArticleFixtures.map(({ id }) => id)).size).toBe(6)
    for (const article of knowledgeArticleFixtures) {
      expect(article.title.trim()).not.toBe("")
      expect(article.body.trim()).not.toBe("")
      expect(article.createdAt).toMatch(/Z$/)
      expect(article.updatedAt).toMatch(/Z$/)
      expect(Date.parse(article.createdAt)).toBeLessThanOrEqual(
        Date.parse(article.updatedAt),
      )
      expect(
        [
          article.companyId,
          article.siteId,
          article.contactId,
          article.assetId,
        ].filter((id) => id !== null).length,
      ).toBeLessThanOrEqual(1)
    }
  })

  it("resolves every supported target without inferring other relationships", () => {
    expect(
      articleRecords.map(({ article, targetType, target }) => ({
        id: article.id,
        type: targetType,
        href: target?.href ?? null,
      })),
    ).toEqual([
      { id: 5, type: "asset", href: "/assets/1" },
      { id: 2, type: "company", href: "/companies/1" },
      { id: 6, type: "company", href: "/companies/3" },
      { id: 1, type: "general", href: null },
      { id: 3, type: "site", href: "/sites/5" },
      { id: 4, type: "contact", href: "/contacts/7" },
    ])
  })
})
