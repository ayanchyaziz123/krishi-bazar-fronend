import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useHistory, useLocation } from 'react-router-dom'
import { PackageSearch } from 'lucide-react'
import Product from '../components/Product'
import { Container, Skeleton, cn } from '../components/ui'
import { useCategories } from '../components/categories'
import { SectionHeading } from '../components/SiteSections'

// Categories down the left, that category's products on the right: what's on offer
// first, then everything else in it.
function CategoryScreen() {
    const categories = useCategories()
    const history = useHistory()
    const { search } = useLocation()
    const selected = new URLSearchParams(search).get('c') || ''
    const [products, setProducts] = useState(null)

    const current = categories.find((c) => c.keyword === selected)

    useEffect(() => {
        let alive = true
        setProducts(null)
        const params = new URLSearchParams({ page_size: 100, sort: 'newest' })
        if (selected) params.set('category', selected)
        axios.get(`/api/products/?${params}`)
            .then(({ data }) => alive && setProducts(data.products || []))
            .catch(() => alive && setProducts([]))
        return () => { alive = false }
    }, [selected])

    const groups = useMemo(() => {
        if (!products) return []
        const offers = products.filter((p) => p.is_offer && p.offer_percentage > 0)
        const label = current ? current.label : 'products'
        return [
            offers.length ? { title: 'On offer', items: offers } : null,
            { title: current ? `All ${label}` : 'All products', items: products },
        ].filter(Boolean)
    }, [products, current])

    const choose = (keyword) => history.replace(keyword ? `/categories?c=${encodeURIComponent(keyword)}` : '/categories')
    const tab = (active) => cn(
        'block w-full rounded-r-2xl px-4 py-4 text-left text-[15px] leading-snug transition sm:rounded-2xl',
        active ? 'bg-brand-600 font-semibold text-white shadow-sm' : 'bg-white text-slate-800 hover:bg-slate-50'
    )

    return (
        <Container className="!px-0 sm:!px-6 lg:!px-8">
            <h1 className="mb-5 hidden text-2xl font-bold tracking-tight text-slate-900 md:block">Category</h1>
            <div className="grid grid-cols-[7.5rem_1fr] gap-3 sm:grid-cols-[12rem_1fr] sm:gap-6">
                <nav aria-label="Categories" className="self-start sm:sticky sm:top-24">
                    <ul className="space-y-2">
                        <li><button type="button" onClick={() => choose('')} className={tab(!selected)} aria-current={!selected}>All products</button></li>
                        {categories.map((c) => (
                            <li key={c.keyword}>
                                <button type="button" onClick={() => choose(c.keyword)} className={tab(c.keyword === selected)} aria-current={c.keyword === selected}>
                                    {c.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="min-w-0 space-y-8 pr-3 sm:pr-0">
                    {!products ? (
                        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />)}
                        </div>
                    ) : products.length === 0 ? (
                        <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-14 text-center">
                            <PackageSearch className="h-10 w-10 text-slate-300" />
                            <p className="mt-3 font-semibold text-slate-900">Nothing here yet</p>
                            <p className="mt-1 text-sm text-slate-500">There are no products in this category right now.</p>
                        </div>
                    ) : groups.map((g) => (
                        <section key={g.title}>
                            <SectionHeading title={g.title} />
                            <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
                                {g.items.map((p) => <Product key={p._id} product={p} compact />)}
                            </div>
                        </section>
                    ))}
                </div>
            </div>
        </Container>
    )
}

export default CategoryScreen
