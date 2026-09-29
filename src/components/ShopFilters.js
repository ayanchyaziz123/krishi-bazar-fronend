import React from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { cn } from './ui'

const SORTS = [
    { value: 'newest', label: 'Newest' },
    { value: 'price_asc', label: 'Price: low to high' },
    { value: 'price_desc', label: 'Price: high to low' },
    { value: 'rating', label: 'Top rated' },
]

const PRICES = [
    { id: 'all', label: 'Any price' },
    { id: 'u200', label: 'Under ৳200', max: 200 },
    { id: '200-500', label: '৳200 – ৳500', min: 200, max: 500 },
    { id: 'o500', label: 'Over ৳500', min: 500 },
]

function Option({ active, onClick, children, round }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-left text-sm transition lg:px-2',
                active ? 'bg-brand-50 font-semibold text-brand-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            )}
        >
            <span className={cn(
                'hidden h-4 w-4 shrink-0 items-center justify-center border lg:flex',
                round ? 'rounded-full' : 'rounded',
                active ? 'border-brand-600 bg-brand-600' : 'border-slate-300 bg-white'
            )}>
                {active && <span className={cn('h-1.5 w-1.5 bg-white', round ? 'rounded-full' : 'rounded-sm')} />}
            </span>
            {children}
        </button>
    )
}

function Group({ title, children }) {
    return (
        <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</h4>
            <div className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">{children}</div>
        </div>
    )
}

// Sort, price and stock filters. They live in the URL, so they survive paging and sharing.
function ShopFilters() {
    const history = useHistory()
    const location = useLocation()
    const params = new URLSearchParams(location.search)

    const sort = params.get('sort') || 'newest'
    const min = params.get('min_price') || ''
    const max = params.get('max_price') || ''
    const inStock = params.get('in_stock') === '1'
    const priceId = (PRICES.find((p) => String(p.min || '') === min && String(p.max || '') === max) || PRICES[0]).id

    const update = (changes) => {
        const next = new URLSearchParams(location.search)
        Object.entries(changes).forEach(([k, v]) => (v === '' || v == null ? next.delete(k) : next.set(k, v)))
        next.delete('page')
        const qs = next.toString()
        history.push(qs ? `/?${qs}` : '/')
    }

    const hasFilters = sort !== 'newest' || min || max || inStock

    return (
        <div className="space-y-6">
            <Group title="Sort by">
                {SORTS.map((s) => (
                    <Option key={s.value} round active={sort === s.value} onClick={() => update({ sort: s.value === 'newest' ? '' : s.value })}>
                        {s.label}
                    </Option>
                ))}
            </Group>

            <Group title="Price">
                {PRICES.map((p) => (
                    <Option key={p.id} round active={priceId === p.id} onClick={() => update({ min_price: p.min || '', max_price: p.max || '' })}>
                        {p.label}
                    </Option>
                ))}
            </Group>

            <Group title="Availability">
                <Option active={inStock} onClick={() => update({ in_stock: inStock ? '' : '1' })}>
                    In stock only
                </Option>
            </Group>

            {hasFilters && (
                <button
                    type="button"
                    onClick={() => update({ sort: '', min_price: '', max_price: '', in_stock: '' })}
                    className="text-sm font-semibold text-brand-600 hover:text-brand-700"
                >
                    Clear filters
                </button>
            )}
        </div>
    )
}

export default ShopFilters
