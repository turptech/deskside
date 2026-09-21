import { assetFixtures } from "@/features/assets/fixtures"
import { companyFixtures } from "@/features/companies/fixtures"
import { contactFixtures, getContactName } from "@/features/contacts/fixtures"
import { siteFixtures } from "@/features/sites/fixtures"

/** Resolved labels remain a frontend projection, separate from Asset API fields. */
export const assetRecords = assetFixtures
  .map((asset) => {
    const company = companyFixtures.find(({ id }) => id === asset.companyId)
    const site =
      asset.siteId === null
        ? null
        : siteFixtures.find(({ id }) => id === asset.siteId)
    const contact =
      asset.contactId === null
        ? null
        : contactFixtures.find(({ id }) => id === asset.contactId)

    if (
      !company ||
      (asset.siteId !== null && (!site || site.companyId !== company.id)) ||
      (asset.contactId !== null &&
        (!contact || contact.companyId !== company.id)) ||
      (asset.siteId !== null && asset.contactId !== null)
    )
      throw new Error(`Invalid synthetic relationship for asset ${asset.id}`)

    return {
      asset,
      company,
      site,
      contact,
      assignment:
        site?.name ?? (contact ? getContactName(contact) : "Unassigned"),
    }
  })
  .sort((a, b) => a.asset.id - b.asset.id)
