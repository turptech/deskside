import { BookOpenText, FilterX, Search } from "lucide-react"
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
import {
  formatArticleTimestamp,
  getArticleExcerpt,
} from "@/features/knowledge-articles/article-format"
import {
  articleRecords,
  targetTypeLabels,
} from "@/features/knowledge-articles/article-records"
import { knowledgeArticleFixtures } from "@/features/knowledge-articles/fixtures"

export function ArticleDirectoryPage() {
  const [search, setSearch] = useState("")
  const [targetFilter, setTargetFilter] = useState("all")
  const visibleArticles = useMemo(() => {
    const query = search.trim().toLowerCase()
    return articleRecords.filter(({ article, target, targetType }) => {
      const searchableText = [
        article.id,
        article.title,
        article.body,
        target?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      return (
        (targetFilter === "all" || targetType === targetFilter) &&
        searchableText.includes(query)
      )
    })
  }, [search, targetFilter])

  const clearFilters = () => {
    setSearch("")
    setTargetFilter("all")
  }

  return (
    <section className="@container mx-auto w-full max-w-[100rem] p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-semibold tracking-widest text-primary uppercase">
            Service desk reference
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Knowledge library
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Practical notes for common support situations and customer context.
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
                aria-label="Search knowledge articles"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search title, body, or target"
                className="pl-9"
              />
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <Select value={targetFilter} onValueChange={setTargetFilter}>
                <SelectTrigger
                  aria-label="Filter articles by target type"
                  className="min-w-0 flex-1 @min-[38rem]:w-44"
                >
                  <SelectValue placeholder="All targets" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All targets</SelectItem>
                  {Object.entries(targetTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(search || targetFilter !== "all") && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearFilters}
                  aria-label="Reset article filters"
                >
                  <FilterX />
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/20 px-4 py-2 text-[11px] text-muted-foreground">
            <span>
              Showing {visibleArticles.length} of{" "}
              {knowledgeArticleFixtures.length} articles
            </span>
            <span>Most recently updated</span>
          </div>

          {visibleArticles.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
              <BookOpenText className="size-6 text-muted-foreground" />
              <h2 className="mt-4 text-sm font-semibold">No articles found</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Try another search or target type.
              </p>
              <Button variant="outline" className="mt-5" onClick={clearFilters}>
                Clear article filters
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table aria-label="Knowledge article directory">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Article</TableHead>
                    <TableHead className="hidden @min-[38rem]:table-cell">
                      Target
                    </TableHead>
                    <TableHead className="hidden @min-[52rem]:table-cell">
                      Updated
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleArticles.map(({ article, target, targetType }) => (
                    <TableRow key={article.id}>
                      <TableCell className="min-w-0 whitespace-normal">
                        <p className="font-mono text-[11px] text-primary">
                          ARTICLE #{article.id}
                        </p>
                        <Link
                          to={`/knowledge-articles/${article.id}`}
                          aria-label={`Open article #${article.id}: ${article.title}`}
                          className="mt-1 inline-block rounded-sm font-medium underline-offset-4 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {article.title}
                        </Link>
                        <p className="mt-1 wrap-anywhere text-xs leading-relaxed text-muted-foreground">
                          {getArticleExcerpt(article.body)}
                        </p>
                        <p className="mt-2 wrap-anywhere text-xs text-muted-foreground @min-[38rem]:hidden">
                          {targetTypeLabels[targetType]}
                          {target ? ` · ${target.name}` : ""}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground @min-[52rem]:hidden">
                          Updated {formatArticleTimestamp(article.updatedAt)}
                        </p>
                      </TableCell>
                      <TableCell className="hidden min-w-0 whitespace-normal @min-[38rem]:table-cell">
                        <Badge variant="secondary" className="font-normal">
                          {targetTypeLabels[targetType]}
                        </Badge>
                        <p className="mt-1 wrap-anywhere text-xs text-muted-foreground">
                          {target?.name ?? "Available across the workspace"}
                        </p>
                      </TableCell>
                      <TableCell className="hidden whitespace-nowrap text-xs text-muted-foreground @min-[52rem]:table-cell">
                        {formatArticleTimestamp(article.updatedAt)}
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
        Read-only synthetic workspace · Articles reflect this demo sample
      </p>
    </section>
  )
}
