import { ArrowRight, Building2, Search } from "lucide-react"
import { useMemo, useState } from "react"
import { Link } from "react-router"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { companyOverviews } from "@/features/companies/fixtures"

export function CompanyDirectoryPage() {
  const [search, setSearch] = useState("")
  const visibleCompanies = useMemo(() => {
    const query = search.trim().toLowerCase()
    return companyOverviews.filter(({ company }) =>
      `${company.id} ${company.name}`.toLowerCase().includes(query),
    )
  }, [search])

  return (
    <section className="@container mx-auto w-full max-w-[100rem] p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-semibold tracking-widest text-primary uppercase">
            Customer workspace
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Companies
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Explore the organizations represented in this synthetic service
            desk.
          </p>
        </div>
        <Badge
          variant="outline"
          className="w-fit font-normal text-muted-foreground"
        >
          Synthetic demo data
        </Badge>
      </div>

      <div className="mt-6 rounded-xl border bg-card p-4 shadow-xs">
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Search companies"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search company name or ID"
            className="pl-9"
          />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Showing {visibleCompanies.length} of {companyOverviews.length}{" "}
          companies
          <span className="ml-2">
            · Related counts reflect this demo sample
          </span>
        </p>
      </div>

      {visibleCompanies.length === 0 ? (
        <div className="mt-5 flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed bg-card px-6 text-center">
          <Building2 className="size-6 text-muted-foreground" />
          <h2 className="mt-4 text-sm font-semibold">No companies found</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Try another company name or ID.
          </p>
          <Button
            variant="outline"
            className="mt-5"
            onClick={() => setSearch("")}
          >
            Clear company search
          </Button>
        </div>
      ) : (
        <div className="mt-5 grid gap-4 @min-[40rem]:grid-cols-2">
          {visibleCompanies.map(
            ({ company, tickets, contacts, sites, assets }) => (
              <Card key={company.id} className="min-w-0 shadow-xs">
                <CardHeader className="border-b">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Building2 className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-[11px] text-muted-foreground">
                        COMPANY #{company.id}
                      </p>
                      <h2 className="wrap-anywhere text-sm font-semibold">
                        <Link
                          to={`/companies/${company.id}`}
                          className="rounded-sm underline-offset-4 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          aria-label={`Open company #${company.id}: ${company.name}`}
                        >
                          {company.name}
                        </Link>
                      </h2>
                    </div>
                    <ArrowRight
                      className="size-4 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-2 gap-4 text-xs sm:grid-cols-4">
                    {[
                      ["Tickets", tickets.length],
                      ["Contacts", contacts.length],
                      ["Sites", sites.length],
                      ["Assets", assets.length],
                    ].map(([label, count]) => (
                      <div key={label}>
                        <dt className="text-muted-foreground">{label}</dt>
                        <dd className="mt-1 font-semibold">{count}</dd>
                      </div>
                    ))}
                  </dl>
                </CardContent>
              </Card>
            ),
          )}
        </div>
      )}
    </section>
  )
}
