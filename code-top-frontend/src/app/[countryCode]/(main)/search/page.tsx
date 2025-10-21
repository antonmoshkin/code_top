import { Suspense } from "react"

import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import { getRegion } from "@lib/data/regions"

type Props = {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<{ q?: string; page?: string }>
}

export default async function SearchPage(props: Props) {
  const params = await props.params
  const searchParams = await props.searchParams

  const region = await getRegion(params.countryCode)
  const q = (searchParams.q || "").trim()
  const page = searchParams.page ? parseInt(searchParams.page) : 1

  return (
    <div className="content-container py-6">
      <div className="mb-6">
        <h1 className="text-2xl-semi">Поиск</h1>
        {q && <p className="text-ui-fg-muted">Результаты для: “{q}”</p>}
      </div>
      <Suspense fallback={<SkeletonProductGrid />}>
        <PaginatedProducts
          sortBy="created_at"
          page={page}
          countryCode={params.countryCode}
          q={q}
        />
      </Suspense>
    </div>
  )
}


