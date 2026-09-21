import { ArrowLeft, BookOpenText, CalendarClock, Link2 } from "lucide-react"
import type { ReactNode } from "react"
import { Link, useParams } from "react-router"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatArticleTimestamp } from "@/features/knowledge-articles/article-format"
import {
  articleRecords,
  targetTypeLabels,
} from "@/features/knowledge-articles/article-records"

function DetailField({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1.5 wrap-anywhere text-sm font-medium">{children}</dd>
    </div>
  )
}

export function ArticleDetailPage() {
  const { articleId } = useParams()
  const record =
    articleId && /^[1-9]\d*$/.test(articleId)
      ? articleRecords.find(({ article }) => String(article.id) === articleId)
      : undefined

  if (!record) {
    return (
      <section className="flex min-h-96 flex-col items-center justify-center px-6 text-center">
        <div className="flex size-12 items-center justify-center rounded-2xl border bg-card">
          <BookOpenText className="size-5 text-muted-foreground" />
        </div>
        <h1 className="mt-5 text-xl font-semibold">Article not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This article is not part of the synthetic demo library.
        </p>
        <Button asChild variant="outline" className="mt-5">
          <Link to="/knowledge-articles">
            <ArrowLeft />
            Back to knowledge
          </Link>
        </Button>
      </section>
    )
  }

  const { article, target, targetType } = record
  return (
    <section className="@container mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <Link
          to="/knowledge-articles"
          className="inline-flex items-center gap-2 rounded-sm text-xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-3.5" />
          Back to knowledge
        </Link>
        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          <span className="font-mono text-xs font-semibold text-primary">
            ARTICLE #{article.id}
          </span>
          <Badge
            variant="outline"
            className="font-normal text-muted-foreground"
          >
            Synthetic demo data
          </Badge>
        </div>
        <h1 className="mt-3 wrap-anywhere text-2xl font-semibold tracking-tight sm:text-3xl">
          {article.title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Read-only service desk reference
        </p>
      </div>

      <div className="grid gap-5 @min-[40rem]:grid-cols-2">
        <Card className="min-w-0 shadow-xs">
          <CardHeader className="border-b">
            <CardTitle>
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <CalendarClock className="size-4 text-muted-foreground" />
                Article details
              </h2>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-5">
              <DetailField label="Article ID">#{article.id}</DetailField>
              <DetailField label="Created">
                {formatArticleTimestamp(article.createdAt)}
              </DetailField>
              <DetailField label="Updated">
                {formatArticleTimestamp(article.updatedAt)}
              </DetailField>
            </dl>
          </CardContent>
        </Card>

        <Card className="min-w-0 shadow-xs">
          <CardHeader className="border-b">
            <CardTitle>
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <Link2 className="size-4 text-muted-foreground" />
                Context
              </h2>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-5">
              <DetailField label="Target type">
                {targetTypeLabels[targetType]}
              </DetailField>
              <DetailField label="Target">
                {target ? (
                  <Link
                    to={target.href}
                    className="rounded-sm text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {target.name}
                  </Link>
                ) : (
                  "Available across the workspace"
                )}
              </DetailField>
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card className="min-w-0 shadow-xs">
        <CardHeader className="border-b">
          <CardTitle>
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <BookOpenText className="size-4 text-muted-foreground" />
              Body
            </h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="wrap-anywhere whitespace-pre-wrap text-sm leading-7 text-foreground">
            {article.body}
          </div>
        </CardContent>
      </Card>

      <p className="text-center text-[11px] text-muted-foreground">
        Read-only synthetic workspace · Article text is displayed as plain text
      </p>
    </section>
  )
}
