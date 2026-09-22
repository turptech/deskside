import { demoData } from "@/demo-data"
import type { ContactDetail } from "@/features/contacts/types"

export const contactFixtures: ContactDetail[] = demoData.contacts.map(
  (contact) => ({
    id: contact.id,
    companyId: contact.company_id,
    siteId: contact.site_id,
    firstName: contact.first_name,
    lastName: contact.last_name,
    email: contact.email,
    phone: contact.phone,
    mobilePhone: contact.mobile_phone,
    jobTitle: contact.job_title,
  }),
)

export function getContactName(contact: ContactDetail): string {
  return `${contact.firstName} ${contact.lastName}`
}
