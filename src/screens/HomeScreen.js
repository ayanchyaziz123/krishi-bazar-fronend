import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { X, PackageSearch, SlidersHorizontal } from 'lucide-react'
import Product from '../components/Product'
import Loader from '../components/Loader'
import Message from '../components/Message'
import Paginate from '../components/Paginate'
import { listProducts } from '../actions/productActions'
import ShopFilters from '../components/ShopFilters'
import { Container, cn } from '../components/ui'
import { useSiteContent } from '../components/siteContent'
import OrderStatusBar from '../components/shop/OrderStatusBar'
import {
    CategoriesSection, HeroSection, ProductsSection, PromoSection, SectionHeading, SlidesSection, TextImageSection, ViewAll,
} from '../components/SiteSections'

const SECTIONS = {
    hero: HeroSection, slides: SlidesSection, categories: CategoriesSection, products: ProductsSection,
    promo: PromoSection, text_image: TextImageSection,
}

// The home page, built from the sections chosen in the website editor.
// A search shows only the product list, as search results.
function HomeScreen({ history }) {
    const site = useSiteContent()
    const dispatch = useDispatch()
    const { error, loading, products, page, pages } = useSelector(state => state.productList)
    const [filtersOpen, setFiltersOpen] = useState(false)

    const keyword = history.location.search
    const params = new URLSearchParams(keyword)
    const activeKeyword = params.get('keyword')
    const filtered = ['sort', 'min_price', 'max_price', 'in_stock'].some((k) => params.get(k))

    useEffect(() => {
        dispatch(listProducts(keyword))
    }, [dispatch, keyword])

    const catalogSection = site.sections.find((x) => x.type === 'catalog') || {}
    const visible = activeKeyword
        ? [{ ...catalogSection, id: 'catalog', type: 'catalog', hidden: false }]
        : site.sections.filter((x) => !x.hidden)

    const catalog = (
        <section id="products" key="catalog">
            <SectionHeading
                title={activeKeyword ? 'Search results' : catalogSection.title}
                subtitle={activeKeyword ? <>Showing products matching “{activeKeyword}”</> : catalogSection.subtitle}
                action={activeKeyword
                    ? <Link to="/" className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800">{activeKeyword} <X className="h-3.5 w-3.5" /></Link>
                    : <ViewAll />}
            />

            <button type="button" onClick={() => setFiltersOpen((o) => !o)} aria-expanded={filtersOpen}
                className={cn('mb-4 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ring-1 lg:hidden',
                    filtered ? 'bg-brand-50 text-brand-700 ring-brand-200' : 'bg-white text-slate-700 ring-slate-200')}>
                <SlidersHorizontal className="h-4 w-4" /> Sort and filter{filtered ? ' · on' : ''}
            </button>

            <div className="grid gap-8 lg:grid-cols-[12rem_1fr]">
                <aside className={cn('space-y-6 lg:sticky lg:top-24 lg:block lg:self-start', !filtersOpen && 'hidden')}>
                    <ShopFilters />
                </aside>

                <div>
                    {loading ? <Loader />
                        : error ? <Message variant='danger'>{error}</Message>
                            : products.length === 0 ? (
                                <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                                    <PackageSearch className="h-10 w-10 text-slate-300" />
                                    <p className="mt-3 font-semibold text-slate-900">No products found</p>
                                    <p className="mt-1 text-sm text-slate-500">Try another search or clear the filter.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
                                        {products.map(product => (
                                            <Product key={product._id} product={product} />
                                        ))}
                                    </div>
                                    <Paginate page={page} pages={pages} keyword={keyword} />
                                </>
                            )
                    }
                </div>
            </div>
        </section>
    )

    return (
        <Container className="space-y-8 sm:space-y-12">
            {!activeKeyword && <OrderStatusBar />}
            {visible.map((section) => {
                if (section.type === 'catalog') return catalog
                const Section = SECTIONS[section.type]
                return Section ? <Section key={section.id} section={section} /> : null
            })}
        </Container>
    )
}

export default HomeScreen
