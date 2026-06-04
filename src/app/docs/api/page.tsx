/**
 * /docs/api — OpenAPI 레퍼런스(읽기 전용 브라우저).
 *
 * 캐노니컬 스펙(src/lib/openapi.ts)을 토큰 기반 UI로 렌더한다.
 * 외부 의존성·CSP 변경 없이(Swagger UI/Scalar 미도입) right-size로 API 문서를 제공.
 * 기계 판독 JSON은 /api/openapi, 원문은 docs/api/openapi.yaml.
 */
import type { Metadata } from 'next'

import { openApiDocument, openApiPaths, type HttpMethod } from '@/lib/openapi'

export const metadata: Metadata = {
  title: 'API Reference — KWG Directory',
  robots: { index: false, follow: false },
}

const METHOD_ORDER: HttpMethod[] = ['get', 'post', 'patch', 'put', 'delete']

// 메서드별 토큰 기반 색(임의 hex 없이 semantic 토큰 사용)
const METHOD_TONE: Record<HttpMethod, string> = {
  get: 'text-[var(--color-state-info)]',
  post: 'text-[var(--color-state-success)]',
  patch: 'text-[var(--color-state-warning)]',
  put: 'text-[var(--color-state-warning)]',
  delete: 'text-[var(--color-state-danger)]',
}

export default function ApiDocsPage() {
  const tags = openApiDocument.tags
  const paths = Object.entries(openApiPaths)

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <header className="mb-10">
        <h1 className="mb-2 text-3xl font-bold text-[var(--color-text)]">
          {openApiDocument.info.title}
        </h1>
        <p className="mb-4 text-[var(--color-text-muted)]">{openApiDocument.info.description}</p>
        <p className="flex flex-wrap gap-3 text-sm">
          <span className="text-[var(--color-text-muted)]">v{openApiDocument.info.version}</span>
          <a
            href="/api/openapi"
            className="font-medium text-[var(--color-text-link)] underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
          >
            openapi.json
          </a>
        </p>
      </header>

      {tags.map((tag) => {
        const tagPaths = paths.filter(([, ops]) =>
          Object.values(ops ?? {}).some((op) => op?.tags?.includes(tag.name))
        )
        if (tagPaths.length === 0) return null

        return (
          <section key={tag.name} className="mb-12" aria-labelledby={`tag-${tag.name}`}>
            <h2
              id={`tag-${tag.name}`}
              className="mb-1 text-xl font-semibold text-[var(--color-text)]"
            >
              {tag.name}
            </h2>
            <p className="mb-4 text-sm text-[var(--color-text-muted)]">{tag.description}</p>

            <div className="space-y-3">
              {tagPaths.map(([path, ops]) =>
                METHOD_ORDER.filter((m) => ops?.[m] && ops[m]!.tags?.includes(tag.name)).map((m) => {
                  const op = ops![m]!
                  return (
                    <article
                      key={`${m}-${path}`}
                      className="rounded-lg border border-[var(--color-border-subtle)] p-4"
                    >
                      <div className="flex flex-wrap items-baseline gap-3">
                        <span className={`font-mono text-sm font-bold uppercase ${METHOD_TONE[m]}`}>
                          {m}
                        </span>
                        <code className="font-mono text-sm text-[var(--color-text)]">{path}</code>
                        {op.security && (
                          <span className="rounded bg-[var(--color-bg-surface-muted)] px-1.5 py-0.5 text-xs text-[var(--color-text-muted)]">
                            auth
                          </span>
                        )}
                      </div>
                      <p className="mt-1.5 text-sm text-[var(--color-text-muted)]">{op.summary}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {Object.keys(op.responses).map((code) => (
                          <span
                            key={code}
                            className="font-mono text-xs text-[var(--color-text-faint)]"
                          >
                            {code}
                          </span>
                        ))}
                      </div>
                    </article>
                  )
                })
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}
