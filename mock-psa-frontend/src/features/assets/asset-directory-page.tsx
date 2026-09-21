import { FilterX, HardDrive, Search } from "lucide-react"
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
import { AssetStatusBadge } from "@/features/assets/asset-badges"
import {
  assetStatusLabels,
  assetTypeLabels,
} from "@/features/assets/asset-format"
import { assetFixtures } from "@/features/assets/fixtures"
import { assetRecords } from "@/features/assets/asset-records"
import { companyFixtures } from "@/features/companies/fixtures"
import { getContactName } from "@/features/contacts/fixtures"

export function AssetDirectoryPage() {
  const [search, setSearch] = useState("")
  const [companyFilter, setCompanyFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  const visibleAssets = useMemo(() => {
    const query = search.trim().toLowerCase()
    return assetRecords.filter(({ asset, company, site, contact }) => {
      const searchableText = [
        asset.id,
        asset.name,
        asset.assetTag,
        asset.serialNumber,
        asset.hostname,
        asset.manufacturer,
        asset.model,
        company.name,
        site?.name,
        contact ? getContactName(contact) : null,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      return (
        (companyFilter === "all" ||
          String(asset.companyId) === companyFilter) &&
        (typeFilter === "all" || asset.assetType === typeFilter) &&
        (statusFilter === "all" || asset.status === statusFilter) &&
        searchableText.includes(query)
      )
    })
  }, [search, companyFilter, typeFilter, statusFilter])

  const clearFilters = () => {
    setSearch("")
    setCompanyFilter("all")
    setTypeFilter("all")
    setStatusFilter("all")
  }

  return (
    <section className="@container mx-auto w-full max-w-[100rem] p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-semibold tracking-widest text-primary uppercase">
            Customer workspace
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Assets
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Find devices and infrastructure across the demo customer inventory.
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
          <div className="flex flex-col gap-3 border-b p-4 @min-[44rem]:flex-row @min-[44rem]:flex-wrap @min-[44rem]:items-center">
            <div className="relative min-w-0 flex-1 @min-[44rem]:basis-60">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Search assets"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search asset, tag, or owner"
                className="pl-9"
              />
            </div>
            <div className="grid min-w-0 grid-cols-2 gap-2 @min-[28rem]:grid-cols-3 @min-[44rem]:flex @min-[44rem]:flex-wrap">
              <Select value={companyFilter} onValueChange={setCompanyFilter}>
                <SelectTrigger
                  aria-label="Filter assets by company"
                  className="col-span-2 min-w-0 w-full @min-[28rem]:col-span-1 @min-[44rem]:w-44"
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
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger
                  aria-label="Filter assets by type"
                  className="min-w-0 w-full @min-[44rem]:w-36"
                >
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {Object.entries(assetTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger
                  aria-label="Filter assets by status"
                  className="min-w-0 w-full @min-[44rem]:w-36"
                >
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {Object.entries(assetStatusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(search ||
              companyFilter !== "all" ||
              typeFilter !== "all" ||
              statusFilter !== "all") && (
              <Button
                variant="ghost"
                size="icon"
                onClick={clearFilters}
                aria-label="Reset asset filters"
              >
                <FilterX />
              </Button>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/20 px-4 py-2 text-[11px] text-muted-foreground">
            <span>
              Showing {visibleAssets.length} of {assetFixtures.length} assets
            </span>
            <span>Sorted by Asset ID</span>
          </div>

          {visibleAssets.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
              <HardDrive className="size-6 text-muted-foreground" />
              <h2 className="mt-4 text-sm font-semibold">No assets found</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Try another search or filter combination.
              </p>
              <Button variant="outline" className="mt-5" onClick={clearFilters}>
                Clear asset filters
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table aria-label="Asset directory">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Asset</TableHead>
                    <TableHead className="hidden @min-[38rem]:table-cell">
                      Type / Status
                    </TableHead>
                    <TableHead className="hidden @min-[48rem]:table-cell">
                      Company / Assignment
                    </TableHead>
                    <TableHead className="hidden @min-[60rem]:table-cell">
                      Identifiers
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleAssets.map(({ asset, company, assignment }) => (
                    <TableRow key={asset.id}>
                      <TableCell className="min-w-0 whitespace-normal">
                        <p className="font-mono text-[11px] text-primary">
                          ASSET #{asset.id}
                        </p>
                        <Link
                          to={`/assets/${asset.id}`}
                          aria-label={`Open asset #${asset.id}: ${asset.name}`}
                          className="mt-1 inline-block rounded-sm font-medium underline-offset-4 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {asset.name}
                        </Link>
                        <div className="mt-1 flex flex-wrap items-center gap-2 @min-[38rem]:hidden">
                          <span className="text-xs text-muted-foreground">
                            {assetTypeLabels[asset.assetType]}
                          </span>
                          <AssetStatusBadge status={asset.status} />
                        </div>
                        <p className="mt-1 wrap-anywhere text-xs text-muted-foreground @min-[48rem]:hidden">
                          {company.name} · {assignment}
                        </p>
                        <p className="mt-1 wrap-anywhere font-mono text-xs text-muted-foreground @min-[60rem]:hidden">
                          {asset.assetTag ??
                            asset.hostname ??
                            "No identifier provided"}
                        </p>
                      </TableCell>
                      <TableCell className="hidden min-w-0 whitespace-normal @min-[38rem]:table-cell">
                        <p className="text-sm">
                          {assetTypeLabels[asset.assetType]}
                        </p>
                        <div className="mt-1">
                          <AssetStatusBadge status={asset.status} />
                        </div>
                      </TableCell>
                      <TableCell className="hidden min-w-0 whitespace-normal @min-[48rem]:table-cell">
                        <p className="wrap-anywhere">{company.name}</p>
                        <p className="mt-1 wrap-anywhere text-xs text-muted-foreground">
                          {assignment}
                        </p>
                      </TableCell>
                      <TableCell className="hidden min-w-0 whitespace-normal @min-[60rem]:table-cell">
                        <p className="wrap-anywhere font-mono text-xs">
                          {asset.assetTag ?? "Not provided"}
                        </p>
                        <p className="mt-1 wrap-anywhere font-mono text-xs text-muted-foreground">
                          {asset.hostname ?? "Hostname not provided"}
                        </p>
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
        Read-only synthetic workspace · Assets reflect this demo sample
      </p>
    </section>
  )
}
