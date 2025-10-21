"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"

export default function SearchBar({ placeholder }: { placeholder?: string }) {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const countryCode = (params as { countryCode?: string })?.countryCode || ""

  const inputRef = useRef<HTMLInputElement | null>(null)
  const [query, setQuery] = useState<string>("")

  useEffect(() => {
    const currentQ = searchParams?.get("q") || ""
    setQuery(currentQ)
  }, [searchParams])

  const navigate = useCallback(
    (q: string) => {
      const trimmed = q.trim()
      const base = `/${countryCode || ""}/search`
      const target = trimmed.length > 0 ? `${base}?q=${encodeURIComponent(trimmed)}` : base
      router.push(target)
    },
    [router, countryCode]
  )

  const onSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      navigate(query)
    },
    [navigate, query]
  )

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        setQuery("")
        inputRef.current?.blur()
      }
    },
    []
  )

  return (
    <form onSubmit={onSubmit} className="hidden small:flex items-center max-w-md w-full">
      <div className="relative w-full">
        <input
          ref={inputRef}
          type="search"
          inputMode="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder || "Поиск товаров"}
          aria-label="Search"
          className="w-full h-9 px-3 pr-10 rounded-md border border-ui-border-base bg-transparent text-ui-fg-base placeholder-ui-fg-muted focus:outline-none focus:ring-2 focus:ring-ui-fg-interactive"
        />
        <button
          type="submit"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2 rounded-sm text-ui-fg-subtle hover:text-ui-fg-base"
          aria-label="Submit search"
        >
          🔍
        </button>
      </div>
    </form>
  )
}


