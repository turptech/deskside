import { ContactRound, FilterX, Search } from "lucide-react"
import { useMemo, useState } from "react"
import { Link } from "react-router"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { companyFixtures } from "@/features/companies/fixtures"
import { contactFixtures, getContactName } from "@/features/contacts/fixtures"
import { siteFixtures } from "@/features/sites/fixtures"

const contactRows = contactFixtures
  .map((contact) => {
    const company = companyFixtures.find(({ id }) => id === contact.companyId)
    const site =
      contact.siteId === null
        ? null
        : siteFixtures.find(({ id }) => id === contact.siteId)
    if (
      !company ||
      (contact.siteId !== null && (!site || site.companyId !== company.id))
    )
      throw new Error(
        `Invalid synthetic relationship for contact ${contact.id}`,
      )
    return { contact, company, site }
  })
  .sort((a, b) =>
    getContactName(a.contact).localeCompare(getContactName(b.contact)),
  )

export function ContactDirectoryPage() {
  const [search, setSearch] = useState("")
  const [companyFilter, setCompanyFilter] = useState("all")
  const visibleContacts = useMemo(() => {
    const query = search.trim().toLowerCase()
    return contactRows.filter(({ contact, company, site }) => {
      const matchesCompany =
        companyFilter === "all" || String(company.id) === companyFilter
      const searchableText = [
        contact.id,
        getContactName(contact),
        contact.email,
        company.name,
        site?.name,
      ]
        .join(" ")
        .toLowerCase()
      return matchesCompany && searchableText.includes(query)
    })
  }, [search, companyFilter])

  const clearFilters = () => {
    setSearch("")
    setCompanyFilter("all")
  }

  return (
    <section className="@container mx-auto w-full max-w-[100rem] p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-semibold tracking-widest text-primary uppercase">
            Customer workspace
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Contacts
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Find the people behind customer requests and site operations.
          </p>
        </div>
        <Badge
          variant="outline"
          className="w-fit font-normal text-muted-foreground"
        >
          Synthetic demo data
        </Badge>
      </div>

      <Card className="mt-6 overflow-hidden shadow-xs">
        <CardContent className="p-0">
          <div className="flex flex-col gap-3 border-b p-4 @min-[38rem]:flex-row @min-[38rem]:items-center">
            <div className="relative min-w-0 flex-1 @min-[38rem]:max-w-sm">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Search contacts"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search contact, company, or site"
                className="pl-9"
              />
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <Select value={companyFilter} onValueChange={setCompanyFilter}>
                <SelectTrigger
                  aria-label="Filter by company"
                  className="min-w-0 flex-1 @min-[38rem]:w-52"
                >
                  <SelectValue placeholder="All companies" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All companies</SelectItem>
                  {companyFixtures.map((company) => (
                    <SelectItem key={company.id} value={String(company.id)}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(search || companyFilter !== "all") && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearFilters}
                  aria-label="Reset contact filters"
                >
                  <FilterX />
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/20 px-4 py-2 text-[11px] text-muted-foreground">
            <span>
              Showing {visibleContacts.length} of {contactFixtures.length}{" "}
              contacts
            </span>
            <span>Sorted by name</span>
          </div>

          {visibleContacts.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
              <ContactRound className="size-6 text-muted-foreground" />
              <h2 className="mt-4 text-sm font-semibold">No contacts found</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Try another search or company filter.
              </p>
              <Button variant="outline" className="mt-5" onClick={clearFilters}>
                Clear contact filters
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table aria-label="Contact directory">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Contact</TableHead>
                    <TableHead className="hidden @min-[38rem]:table-cell">
                      Company / Site
                    </TableHead>
                    <TableHead className="hidden @min-[42rem]:table-cell">
                      Email
                    </TableHead>
                    <TableHead className="hidden @min-[52rem]:table-cell">
                      Phone
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleContacts.map(({ contact, company, site }) => (
                    <TableRow key={contact.id}>
                      <TableCell className="min-w-0 whitespace-normal">
                        <p className="font-mono text-[11px] text-primary">
                          CONTACT #{contact.id}
                        </p>
                        <Link
                          to={`/contacts/${contact.id}`}
                          aria-label={`Open contact #${contact.id}: ${getContactName(contact)}`}
                          className="mt-1 inline-block rounded-sm font-medium underline-offset-4 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {getContactName(contact)}
                        </Link>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {contact.jobTitle ?? "Title not provided"}
                        </p>
                        <p className="mt-1 wrap-anywhere text-xs text-muted-foreground @min-[38rem]:hidden">
                          {company.name} · {site?.name ?? "No site"}
                        </p>
                        <p className="wrap-anywhere text-xs text-muted-foreground @min-[42rem]:hidden">
                          {contact.email}
                        </p>
                        {contact.phone && (
                          <p className="text-xs text-muted-foreground @min-[52rem]:hidden">
                            {contact.phone}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="hidden min-w-0 whitespace-normal @min-[38rem]:table-cell">
                        <span className="wrap-anywhere">{company.name}</span>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {site?.name ?? "No site"}
                        </span>
                      </TableCell>
                      <TableCell className="hidden min-w-0 wrap-anywhere @min-[42rem]:table-cell">
                        {contact.email}
                      </TableCell>
                      <TableCell className="hidden whitespace-nowrap @min-[52rem]:table-cell">
                        {contact.phone ?? "Not provided"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      <p className="mt-5 text-center text-[11px] text-muted-foreground">
        Read-only synthetic workspace · Contacts reflect this demo sample
      </p>
    </section>
  )
}
