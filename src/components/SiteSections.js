import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Link, useHistory } from 'react-router-dom'
import { ArrowRight, Sprout } from 'lucide-react'
import Product from './Product'
import { useCategories } from './categories'
import { isExternal } from './siteContent'
import { cn } from './ui'
import SlideShow from './shop/SlideShow'

// Each home page section the website editor can add. They only read their settings,
// so the same look works for any store, in that store's colour.

function SmartLink({ to, className, children }) {
    if (!to) return null
    if (isExternal(to)) return <a href={to} className={className} target="_blank" rel="noreferrer">{children}</a>
    return <Link to={to} className={className}>{children}</Link>
}

export function SectionHeading({ title, subtitle, action }) {
    if (!title && !subtitle && !action) return null
    return (
        <div className="mb-4 flex items-end justify-between gap-4 sm:mb-5">
            <div className="min-w-0">
                {title && <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{title}</h2>}
                {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
            </div>
            {action}
        </div>
    )
}

// "View All" in the top corner of a row, as in the shop's design.
export const ViewAll = ({ to = '/categories', children = 'View All' }) => (
    <SmartLink to={to} className="shrink-0 text-sm font-semibold text-blue-600 hover:text-blue-700 sm:text-base">{children}</SmartLink>
)

export function HeroSection({ section: s }) {
    return (
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-800 via-brand-700 to-brand-900 px-8 py-14 text-white shadow-xl shadow-brand-900/20 sm:px-12 sm:py-20">
            {s.image ? (
                <>
                    <img src={s.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/10" />
                </>
            ) : (
                <>
                    <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-brand-400/20 blur-3xl" />
                    <Sprout className="pointer-events-none absolute -bottom-6 right-6 h-56 w-56 text-white/5" strokeWidth={1.25} />
                </>
            )}
            <div className="relative max-w-xl">
                {s.badge && <p className="mb-5 inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold ring-1 ring-white/20">{s.badge}</p>}
                <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-5xl">{s.title || 'Your headline'}</h1>
                {s.text && <p className="mt-4 text-white/85">{s.text}</p>}
                {(s.button_label || s.second_label) && (
                    <div className="mt-8 flex flex-wrap items-center gap-4">
                        {s.button_label && (
                            <SmartLink to={s.button_link || '/'} className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-brand-800 transition hover:bg-brand-50">
                                {s.button_label} <ArrowRight className="h-4 w-4" />
                            </SmartLink>
                        )}
                        {s.second_label && <SmartLink to={s.second_link || '/'} className="text-sm font-semibold text-white/90 hover:text-white">{s.second_label}</SmartLink>}
                    </div>
                )}
            </div>
        </section>
    )
}

// Square category tiles in a row that scrolls sideways on a phone. Each opens the
// Category page on that category.
export function CategoriesSection({ section: s }) {
    const history = useHistory()
    const all = useCategories()
    const chosen = s.categories && s.categories.length ? s.categories : null
    const shown = chosen ? chosen.map((k) => all.find((c) => c.keyword === k)).filter(Boolean) : all
    return (
        <section>
            <SectionHeading title={s.title} subtitle={s.subtitle} />
            <div className="-mx-4 flex snap-x gap-2.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
                {shown.map(({ keyword, label, icon: Icon }) => (
                    <button key={keyword} type="button" onClick={() => history.push(`/categories?c=${encodeURIComponent(keyword)}`)}
                        className="group flex h-[6.5rem] w-[6.5rem] shrink-0 snap-start flex-col items-center justify-center gap-2.5 rounded-2xl bg-[#f6f6f9] px-2 text-center transition hover:bg-brand-50 sm:h-28 sm:w-32">
                        <span className="relative flex h-10 w-10 items-center justify-center">
                            <span className="absolute bottom-0 right-0 h-5 w-5 rounded-full bg-brand-500/60" />
                            <Icon className="relative h-9 w-9 text-slate-900 transition group-hover:scale-110" strokeWidth={1.6} />
                        </span>
                        <span className="line-clamp-1 text-sm font-semibold text-slate-900">{label}</span>
                    </button>
                ))}
            </div>
        </section>
    )
}

// Banner photos that change every few seconds, each opening its link when tapped.
export function SlidesSection({ section: s }) {
    const slides = (s.slides || []).filter((x) => x.image)
    if (!slides.length) return null
    return (
        <section>
            <SectionHeading title={s.title} subtitle={s.subtitle} />
            <SlideShow items={slides} render={(slide) => {
                const img = <img src={slide.image} alt={slide.alt || ''} className="aspect-[16/8] w-full object-cover sm:aspect-[16/6]" />
                return slide.link ? <SmartLink to={slide.link} className="block">{img}</SmartLink> : img
            }} />
        </section>
    )
}

// Every online product, fetched once and shared by the rows that pick by hand.
let allProducts = null
const getAllProducts = () => {
    if (!allProducts) allProducts = axios.get('/api/products/all/').then((r) => (Array.isArray(r.data) ? r.data : r.data.products || [])).catch(() => { allProducts = null; return [] })
    return allProducts
}

function useRowProducts(s) {
    const [products, setProducts] = useState(null)
    const key = `${s.source}|${s.category}|${(s.product_ids || []).join(',')}|${s.limit}`
    useEffect(() => {
        let alive = true
        const limit = s.limit || 4
        const take = (list) => alive && setProducts((list || []).slice(0, limit))
        if (s.source === 'picked') {
            getAllProducts().then((list) => {
                const byId = Object.fromEntries(list.map((p) => [p._id, p]))
                take((s.product_ids || []).map((id) => byId[id]).filter(Boolean))
            })
        } else if (s.source === 'offers') {
            axios.get('/api/products/offer/').then((r) => take(r.data)).catch(() => take([]))
        } else if (s.source === 'top_rated') {
            axios.get('/api/products/top/').then((r) => take(r.data)).catch(() => take([]))
        } else {
            const params = new URLSearchParams({ sort: 'newest', page_size: limit })
            if (s.source === 'category' && s.category) params.set('category', s.category)
            axios.get(`/api/products/?${params}`).then((r) => take(r.data.products)).catch(() => take([]))
        }
        return () => { alive = false }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key])
    return products
}

export function ProductsSection({ section: s }) {
    const products = useRowProducts(s)
    if (products && products.length === 0 && !s.title) return null
    return (
        <section>
            <SectionHeading title={s.title} subtitle={s.subtitle}
                action={s.link_label && <ViewAll to={s.link || '/categories'}>{s.link_label}</ViewAll>} />
            {!products ? (
                <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                    {Array.from({ length: Math.min(s.limit || 4, 4) }).map((_, i) => <div key={i} className="h-72 animate-pulse rounded-2xl bg-slate-100" />)}
                </div>
            ) : products.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-slate-300 px-6 py-10 text-center text-sm text-slate-500">
                    {s.source === 'picked' ? 'Choose products for this row in the website editor.' : 'No products to show here yet.'}
                </p>
            ) : (
                <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                    {products.map((p) => <Product key={p._id} product={p} />)}
                </div>
            )}
        </section>
    )
}

export function PromoSection({ section: s }) {
    const style = {
        brand: 'bg-gradient-to-r from-brand-600 to-brand-800 text-white',
        dark: 'bg-slate-950 text-white',
        light: 'bg-brand-50 text-slate-900 ring-1 ring-inset ring-brand-100',
    }[s.style || 'brand']
    const light = s.style === 'light'
    return (
        <section className={cn('grid overflow-hidden rounded-3xl md:grid-cols-2', style)}>
            <div className="flex flex-col justify-center p-8 sm:p-12">
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{s.title || 'Promotion title'}</h2>
                {s.text && <p className={cn('mt-3', light ? 'text-slate-600' : 'text-white/80')}>{s.text}</p>}
                {s.button_label && (
                    <SmartLink to={s.button_link || '/'} className={cn('mt-6 inline-flex w-fit items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition',
                        light ? 'bg-brand-600 text-white hover:bg-brand-700' : 'bg-white text-slate-900 hover:bg-slate-100')}>
                        {s.button_label} <ArrowRight className="h-4 w-4" />
                    </SmartLink>
                )}
            </div>
            {s.image ? <img src={s.image} alt="" className="h-56 w-full object-cover md:h-full" /> : <div className="hidden md:block" />}
        </section>
    )
}

export function TextImageSection({ section: s }) {
    return (
        <section className="grid items-center gap-8 md:grid-cols-2">
            {s.image && <img src={s.image} alt="" className={cn('w-full rounded-3xl object-cover shadow-sm', s.image_side === 'left' ? 'md:order-first' : 'md:order-last')} style={{ maxHeight: 420 }} />}
            <div className={cn(!s.image && 'md:col-span-2 max-w-2xl')}>
                {s.title && <h2 className="text-2xl font-bold tracking-tight text-slate-900">{s.title}</h2>}
                {s.subtitle && <p className="mt-1 text-sm font-semibold uppercase tracking-wider text-brand-700">{s.subtitle}</p>}
                {(s.text || '').split(/\n{2,}/).filter(Boolean).map((para, i) => (
                    <p key={i} className="mt-4 whitespace-pre-line leading-relaxed text-slate-600">{para}</p>
                ))}
                {s.button_label && (
                    <SmartLink to={s.button_link || '/'} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-800">
                        {s.button_label} <ArrowRight className="h-4 w-4" />
                    </SmartLink>
                )}
            </div>
        </section>
    )
}
