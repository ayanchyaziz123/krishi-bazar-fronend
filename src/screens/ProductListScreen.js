import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight, Package, Layers, ArrowUp, ArrowDown, ChevronsUpDown, Image as ImageIcon, Store, Globe, MessageCircle, Copy, X } from 'lucide-react'
import AdminLayout from '../admin_components/AdminLayout'
import { Alert, Badge, Button, Card, EmptyState, Input, Modal, Select, Skeleton, StatusPill, Textarea, cn, finalPrice, formatINR, toast } from '../components/ui'
import { shopUrl } from '../components/shopSlug'
import { activeBusinessInfo } from '../admin_components/roles'
import { useStoreBrand } from '../components/storeBrand'
import { useCategories } from '../components/categories'

const errorText = (e) => (e.response && e.response.data && e.response.data.detail) || e.message

const CHANNELS = [
    { value: '', label: 'Sold anywhere' },
    { value: 'both', label: 'Shop and online' },
    { value: 'shop_only', label: 'Shop only' },
    { value: 'online_only', label: 'Online only' },
    { value: 'hidden', label: 'Not for sale' },
]

const TABS = [
    { value: '', label: 'All', count: 'all' },
    { value: 'low', label: 'Low stock', count: 'low' },
    { value: 'out', label: 'Out of stock', count: 'out' },
    { value: 'combo', label: 'Combos', count: 'combo' },
    { value: 'hidden', label: 'Not for sale', count: 'hidden' },
]

const PLACEHOLDER = /placeholder/

// Every product in the store, with tabs, search, filters, sorting and paging kept in the
// address bar so a filtered list can be bookmarked or shared.
function ProductListScreen({ history, location }) {
    const { userInfo } = useSelector((state) => state.userLogin)
    const auth = useMemo(() => ({ headers: { Authorization: `Bearer ${userInfo.token}` } }), [userInfo])
    const categories = useCategories()

    const params = new URLSearchParams(location.search)
    const filters = {
        keyword: params.get('keyword') || '',
        category: params.get('category') || '',
        channel: params.get('channel') || '',
        status: params.get('status') || '',
        sort: params.get('sort') || 'name',
        page_size: params.get('page_size') || '25',
        page: Number(params.get('page')) || 1,
    }

    const [search, setSearch] = useState(filters.keyword)
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [deleting, setDeleting] = useState(null)
    const [reload, setReload] = useState(0)
    // Products picked to share on WhatsApp, kept while moving between pages and filters.
    const [picked, setPicked] = useState({})
    const [sharing, setSharing] = useState(false)
    const pickedList = Object.values(picked)
    const togglePick = (p) => setPicked((now) => {
        const next = { ...now }
        if (next[p._id]) delete next[p._id]
        else next[p._id] = p
        return next
    })
    const pagePicked = data ? data.products.filter((p) => picked[p._id]).length : 0
    const pickPage = () => setPicked((now) => {
        const next = { ...now }
        const all = data.products.every((p) => next[p._id])
        data.products.forEach((p) => { if (all) delete next[p._id]; else next[p._id] = p })
        return next
    })

    // Change one or more filters; any change other than the page goes back to page 1.
    const update = (changes) => {
        const next = new URLSearchParams(location.search)
        Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)))
        if (!('page' in changes)) next.delete('page')
        history.replace({ search: next.toString() })
    }

    // Search as the user types, after a short pause.
    useEffect(() => {
        if (search === filters.keyword) return undefined
        const timer = setTimeout(() => update({ keyword: search.trim() }), 300)
        return () => clearTimeout(timer)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search])

    useEffect(() => {
        const query = new URLSearchParams({ scope: 'all', sort: filters.sort, page_size: filters.page_size, page: filters.page })
        ;['keyword', 'category', 'channel', 'status'].forEach((k) => filters[k] && query.set(k, filters[k]))
        setLoading(true)
        axios.get(`/api/products/?${query}`, auth)
            .then((res) => { setData(res.data); setError('') })
            .catch((e) => setError(errorText(e)))
            .finally(() => setLoading(false))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.search, auth, reload])

    const filtered = filters.keyword || filters.category || filters.channel
    const counts = (data && data.counts) || {}
    const edit = (p) => history.push(`/admin/product/${p._id}/edit`)
    const first = data ? (data.page - 1) * Number(filters.page_size) + 1 : 0
    const last = data ? Math.min(data.page * Number(filters.page_size), data.count) : 0

    // Click a column heading to sort by it; click again to flip the order.
    const sortBy = (asc, desc) => update({ sort: filters.sort === asc ? desc : asc })
    const SortHead = ({ asc, desc, children, className }) => {
        const on = filters.sort === asc || filters.sort === desc
        const Icon = !on ? ChevronsUpDown : filters.sort === asc ? ArrowUp : ArrowDown
        return (
            <th className={cn('px-3 py-2.5', className)} aria-sort={on ? (filters.sort === asc ? 'ascending' : 'descending') : 'none'}>
                <button type="button" onClick={() => sortBy(asc, desc)}
                    className={cn('inline-flex items-center gap-1 uppercase tracking-wider hover:text-slate-900', on && 'text-slate-900')}>
                    {children} <Icon className="h-3.5 w-3.5" />
                </button>
            </th>
        )
    }

    return (
        <AdminLayout
            title="Products"
            subtitle="Everything sold at the counter and in your online shop."
            action={(
                <div className="flex flex-wrap gap-2">
                    <Button to="/admin/product/new?combo=1" variant="secondary"><Layers className="h-4 w-4" /> New combo</Button>
                    <Button to="/admin/product/new"><Plus className="h-4 w-4" /> New product</Button>
                </div>
            )}
        >
            {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

            <Card className="overflow-hidden rounded-xl">
                {/* Tabs */}
                <div className="flex gap-1 overflow-x-auto border-b border-slate-200 px-3" role="tablist" aria-label="Show">
                    {TABS.map((t) => {
                        const on = filters.status === t.value
                        const n = counts[t.count]
                        const warn = (t.value === 'low' || t.value === 'out') && n > 0
                        return (
                            <button key={t.value} type="button" role="tab" aria-selected={on} onClick={() => update({ status: t.value })}
                                className={cn('-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition',
                                    on ? 'border-brand-600 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800')}>
                                {t.label}
                                {n != null && (
                                    <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold',
                                        warn ? (t.value === 'out' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800') : on ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600')}>
                                        {n}
                                    </span>
                                )}
                            </button>
                        )
                    })}
                </div>

                {/* Search and filters */}
                <div className="flex flex-col gap-2 border-b border-slate-100 p-3 lg:flex-row">
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, category or counter code" className="pl-10" aria-label="Search products" />
                    </div>
                    <div className="grid grid-cols-3 gap-2 lg:flex">
                        <Select value={filters.category} onChange={(e) => update({ category: e.target.value })} aria-label="Category" className="lg:!w-40">
                            <option value="">All categories</option>
                            {categories.map((c) => <option key={c.keyword} value={c.keyword}>{c.label}</option>)}
                        </Select>
                        <Select value={filters.channel} onChange={(e) => update({ channel: e.target.value })} aria-label="Where it's sold" className="lg:!w-44">
                            {CHANNELS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </Select>
                        <Select value={filters.sort} onChange={(e) => update({ sort: e.target.value })} aria-label="Sort" className="lg:!w-44">
                            <option value="name">Name A–Z</option>
                            <option value="newest">Newest first</option>
                            <option value="price_asc">Price, low to high</option>
                            <option value="price_desc">Price, high to low</option>
                            <option value="stock_asc">Stock, low to high</option>
                            <option value="stock_desc">Stock, high to low</option>
                        </Select>
                    </div>
                </div>

                {filtered && data && (
                    <div className="flex items-center justify-between bg-slate-50 px-5 py-2 text-xs text-slate-600">
                        <span>{data.count} {data.count === 1 ? 'product matches' : 'products match'}</span>
                        <button type="button" className="font-semibold text-brand-700 hover:underline" onClick={() => { setSearch(''); history.replace({ search: filters.status ? `status=${filters.status}` : '' }) }}>
                            Clear filters
                        </button>
                    </div>
                )}

                {!data ? <ListSkeleton /> : data.products.length === 0 ? (
                    filtered || filters.status ? (
                        <EmptyState icon={Search} compact title="Nothing here">
                            {filters.status && !filtered ? 'No products under this tab right now.' : 'No products match. Try another search or clear the filters.'}
                        </EmptyState>
                    ) : (
                        <EmptyState icon={Package} title="No products yet"
                            action={<Button to="/admin/product/new"><Plus className="h-4 w-4" /> Add your first product</Button>}>
                            Add what you sell, with its price, photo and stock. It can then be sold at the counter and in your online shop.
                        </EmptyState>
                    )
                ) : (
                    <div className={cn('transition-opacity', loading && 'opacity-60')}>
                        {/* Phones: one card per product */}
                        <ul className="divide-y divide-slate-100 md:hidden">
                            {data.products.map((p) => (
                                <li key={p._id} className={cn('flex items-center', picked[p._id] && 'bg-brand-50/60')}>
                                    <label className="flex self-stretch items-center pl-4 pr-1">
                                        <input type="checkbox" checked={Boolean(picked[p._id])} onChange={() => togglePick(p)} aria-label={`Pick ${p.name} to share`}
                                            className="h-4 w-4 rounded border-slate-300 accent-brand-600" />
                                    </label>
                                    <button type="button" onClick={() => edit(p)} className="flex min-w-0 flex-1 items-center gap-3 py-3 pl-2 pr-4 text-left hover:bg-slate-50">
                                        <Thumb product={p} />
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-sm font-medium text-slate-900">{p.name}</span>
                                            <span className="block truncate text-xs text-slate-500">{p.category}{p.code ? ` · ${p.code}` : ''}</span>
                                            <span className="mt-1 block"><StockStatus product={p} /></span>
                                        </span>
                                        <span className="shrink-0 text-right">
                                            <span className="block text-sm font-semibold text-slate-900">{formatINR(p.shop_price ?? p.price)}</span>
                                            <span className="block text-xs text-slate-500">{stockText(p)}</span>
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>

                        {/* Larger screens: table */}
                        <div className="hidden overflow-x-auto md:block">
                            <table className="w-full text-sm">
                                <thead className="border-b border-slate-200 bg-slate-50/70 text-left text-xs font-semibold text-slate-500">
                                    <tr>
                                        <th className="w-10 py-2.5 pl-5">
                                            <input type="checkbox" checked={pagePicked > 0 && pagePicked === data.products.length} onChange={pickPage}
                                                ref={(el) => { if (el) el.indeterminate = pagePicked > 0 && pagePicked < data.products.length }}
                                                aria-label="Pick every product on this page" title="Pick every product on this page" className="h-4 w-4 rounded border-slate-300 accent-brand-600" />
                                        </th>
                                        <SortHead asc="name" desc="name" className="pl-2">Product</SortHead>
                                        <th className="px-3 py-2.5 uppercase tracking-wider">Category</th>
                                        <SortHead asc="price_asc" desc="price_desc" className="text-right">Price</SortHead>
                                        <SortHead asc="stock_asc" desc="stock_desc" className="text-right">Stock</SortHead>
                                        <th className="px-3 py-2.5 uppercase tracking-wider">Sold at</th>
                                        <th className="px-5 py-2.5"><span className="sr-only">Actions</span></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {data.products.map((p) => (
                                        <tr key={p._id} className={cn('group cursor-pointer transition hover:bg-slate-50', picked[p._id] && 'bg-brand-50/60')}
                                            onClick={(e) => { if (!e.target.closest('a, button, label, input')) edit(p) }}>
                                            <td className="py-3 pl-5">
                                                <input type="checkbox" checked={Boolean(picked[p._id])} onChange={() => togglePick(p)} aria-label={`Pick ${p.name} to share`}
                                                    className="h-4 w-4 rounded border-slate-300 accent-brand-600" />
                                            </td>
                                            <td className="py-3 pl-2 pr-3">
                                                <div className="flex items-center gap-3">
                                                    <Thumb product={p} />
                                                    <div className="min-w-0">
                                                        <Link to={`/admin/product/${p._id}/edit`} className="block max-w-xs truncate font-medium text-slate-900 hover:text-brand-700">{p.name}</Link>
                                                        <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-slate-500">
                                                            {p.is_combo && <span className="rounded bg-violet-50 px-1.5 py-px font-semibold text-violet-700 ring-1 ring-violet-600/20">Combo</span>}
                                                            {p.code && <span>Code {p.code}</span>}
                                                            {p.weight && !p.is_combo && <span>{p.code ? '· ' : ''}{p.weight}</span>}
                                                            {p.is_combo && p.combo && <span>{p.combo.items.length} products inside</span>}
                                                            {p.sold_by_weight && <span>· loose</span>}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 text-slate-600">{p.category}</td>
                                            <td className="px-3 py-3 text-right">
                                                <span className="font-semibold text-slate-900">{formatINR(p.shop_price ?? p.price)}</span>
                                                {p.online_price != null && Number(p.online_price) !== Number(p.shop_price) && (
                                                    <span className="block text-xs text-slate-500">Online {formatINR(p.online_price)}</span>
                                                )}
                                                {p.is_offer && p.offer_percentage > 0 && <span className="block text-xs font-medium text-emerald-700">{p.offer_percentage}% off</span>}
                                            </td>
                                            <td className="px-3 py-3 text-right">
                                                <span className="block font-medium tabular-nums text-slate-900">{stockText(p)}</span>
                                                <span className="mt-0.5 inline-block"><StockStatus product={p} /></span>
                                            </td>
                                            <td className="px-3 py-3"><SoldIn product={p} /></td>
                                            <td className="px-5 py-3 text-right">
                                                <div className="inline-flex gap-1 opacity-70 transition group-hover:opacity-100">
                                                    <Button to={`/admin/product/${p._id}/edit`} variant="ghost" size="icon" aria-label={`Edit ${p.name}`} title="Edit"><Pencil className="h-4 w-4" /></Button>
                                                    <button type="button" onClick={() => setDeleting(p)} aria-label={`Delete ${p.name}`} title="Delete"
                                                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {data && data.count > 0 && (
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 text-sm">
                        <div className="flex items-center gap-3 text-slate-500">
                            <span>{first}–{last} of {data.count}</span>
                            <Select value={filters.page_size} onChange={(e) => update({ page_size: e.target.value })} aria-label="Rows per page" className="!h-8 !w-auto text-xs">
                                {['10', '25', '50', '100'].map((n) => <option key={n} value={n}>{n} per page</option>)}
                            </Select>
                        </div>
                        {data.pages > 1 && (
                            <div className="flex items-center gap-1">
                                <Button variant="secondary" size="sm" disabled={data.page <= 1} onClick={() => update({ page: String(data.page - 1) })} aria-label="Previous page">
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="px-2 text-slate-600">Page {data.page} of {data.pages}</span>
                                <Button variant="secondary" size="sm" disabled={data.page >= data.pages} onClick={() => update({ page: String(data.page + 1) })} aria-label="Next page">
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </Card>

            {pickedList.length > 0 && (
                <div className="sticky bottom-4 z-30 mx-auto mt-4 flex max-w-xl items-center gap-3 rounded-xl bg-slate-900 px-4 py-3 text-white shadow-lg">
                    <span className="text-sm font-medium">{pickedList.length} picked</span>
                    <button type="button" onClick={() => setPicked({})} className="text-sm text-slate-300 underline-offset-2 hover:text-white hover:underline">Clear</button>
                    <button type="button" onClick={() => setSharing(true)}
                        className="ml-auto inline-flex h-9 items-center gap-2 rounded-lg bg-[#25D366] px-4 text-sm font-semibold text-slate-900 hover:bg-[#20bd5a]">
                        <MessageCircle className="h-4 w-4" /> Share on WhatsApp
                    </button>
                </div>
            )}

            {sharing && (
                <ShareProducts products={pickedList} userInfo={userInfo} onRemove={togglePick}
                    onClose={() => setSharing(false)} onSent={() => { setSharing(false); setPicked({}) }} />
            )}

            {deleting && (
                <DeleteProduct product={deleting} auth={auth} onClose={() => setDeleting(null)}
                    onDeleted={() => { toast.success(`${deleting.name} was deleted.`); setDeleting(null); setReload((n) => n + 1) }} />
            )}
        </AdminLayout>
    )
}

// What a customer pays: the online price for products sold online (their link opens in the
// shop), else the counter price. Either way less any offer.
const sharePrice = (p) => {
    const online = p.sell_online !== false
    const base = Number(online ? p.price : (p.shop_price ?? p.price)) || 0
    const offer = p.is_offer && p.offer_percentage > 0
    return { now: offer ? finalPrice({ ...p, price: base }) : base, was: offer ? base : null, online }
}

const productMessage = (products, shopName, slug) => {
    const lines = [shopName ? `*${shopName}*` : '', products.length === 1 ? 'Have a look at this:' : 'Have a look at these:', '']
    products.forEach((p, i) => {
        const { now, was, online } = sharePrice(p)
        const unit = p.sold_by_weight ? `/${p.unit || 'kg'}` : ''
        const pack = p.weight && !p.sold_by_weight ? ` (${p.weight})` : ''
        lines.push(`${i + 1}. *${p.name.trim()}*${pack}`)
        lines.push(`   ${formatINR(now)}${unit}${was ? ` ~${formatINR(was)}~ ${p.offer_percentage}% off` : ''}`)
        if (online) lines.push(`   ${shopUrl(slug, `/product/${p._id}`)}`)
        lines.push('')
    })
    if (products.some((p) => p.sell_online !== false)) lines.push(`Order online: ${shopUrl(slug)}`)
    lines.push('Reply here to order.')
    return lines.filter((l, i) => l || i > 0).join('\n')
}

// Write the WhatsApp message for the picked products, change it if wanted, then open WhatsApp
// (to one customer's number, or to choose a chat or group there).
function ShareProducts({ products, userInfo, onRemove, onClose, onSent }) {
    const business = activeBusinessInfo(userInfo) || {}
    // The name customers see on the website, else the business name.
    const brand = useStoreBrand()
    const shopName = (brand && brand.name) || business.name
    const [text, setText] = useState(() => productMessage(products, shopName, business.slug))
    const [phone, setPhone] = useState('')
    const [edited, setEdited] = useState(false)
    // Rewrite the message when a product is taken out, unless the user has changed it.
    useEffect(() => {
        if (!edited) setText(productMessage(products, shopName, business.slug))
        if (products.length === 0) onClose()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [products.length])

    const digits = phone.replace(/\D/g, '')
    const number = digits.length === 10 ? `91${digits}` : digits
    const phoneOk = digits === '' || (digits.length >= 10 && digits.length <= 13)
    const offline = products.filter((p) => p.sell_online === false).length
    const open = () => {
        window.open(`https://wa.me/${number}?text=${encodeURIComponent(text)}`, '_blank', 'noopener')
        onSent()
    }
    const copy = () => {
        navigator.clipboard.writeText(text).then(() => toast.success('Message copied. Paste it in WhatsApp.'), () => toast.error('Could not copy. Select the text and copy it.'))
    }

    return (
        <Modal show onClose={onClose} title="Share on WhatsApp">
            <div className="space-y-4">
                <div className="flex flex-wrap gap-1.5">
                    {products.map((p) => (
                        <span key={p._id} className="inline-flex max-w-full items-center gap-1 rounded-full bg-slate-100 py-1 pl-3 pr-1 text-xs font-medium text-slate-700">
                            <span className="truncate">{p.name}</span>
                            <button type="button" onClick={() => onRemove(p)} aria-label={`Take out ${p.name}`} className="rounded-full p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"><X className="h-3.5 w-3.5" /></button>
                        </span>
                    ))}
                </div>
                <div>
                    <label htmlFor="share-text" className="mb-1.5 flex items-center justify-between text-sm font-medium text-slate-700">
                        Message
                        {edited && <button type="button" className="text-xs font-semibold text-brand-700 hover:underline" onClick={() => { setText(productMessage(products, shopName, business.slug)); setEdited(false) }}>Start again</button>}
                    </label>
                    <Textarea id="share-text" rows={10} value={text} onChange={(e) => { setText(e.target.value); setEdited(true) }} className="font-mono text-[13px] leading-relaxed" />
                    <p className="mt-1.5 text-xs text-slate-500">
                        Words between *stars* show in bold in WhatsApp.
                        {offline > 0 && ` ${offline === 1 ? 'One product is' : `${offline} products are`} not in your online shop, so ${offline === 1 ? 'it has' : 'they have'} the counter price and no link.`}
                    </p>
                </div>
                <div>
                    <label htmlFor="share-phone" className="mb-1.5 block text-sm font-medium text-slate-700">Customer's WhatsApp number <span className="font-normal text-slate-500">(optional)</span></label>
                    <Input id="share-phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98765 43210" />
                    <p className={cn('mt-1.5 text-xs', phoneOk ? 'text-slate-500' : 'text-rose-600')}>
                        {phoneOk ? 'Leave it empty to pick a chat or group in WhatsApp.' : 'Enter a 10-digit mobile number, or leave it empty.'}
                    </p>
                </div>
                <div className="flex flex-col-reverse gap-2 sm:flex-row">
                    <Button variant="secondary" onClick={copy}><Copy className="h-4 w-4" /> Copy message</Button>
                    <button type="button" onClick={open} disabled={!phoneOk || !text.trim()}
                        className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#25D366] sm:flex-1 px-4 text-sm font-semibold text-slate-900 hover:bg-[#20bd5a] disabled:opacity-50">
                        <MessageCircle className="h-4 w-4" /> Open WhatsApp
                    </button>
                </div>
            </div>
        </Modal>
    )
}

const stockText = (p) => {
    const n = Number(p.stock_exact ?? p.countInStock) || 0
    if (p.is_combo) return `${n} can make`
    return `${n.toLocaleString('en-IN', { maximumFractionDigits: 3 })} ${p.unit === 'piece' || !p.unit ? 'pc' : p.unit}`
}

function Thumb({ product }) {
    const src = product.image && !PLACEHOLDER.test(product.image) ? product.image : null
    return (
        <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white">
            {src ? <img src={src} alt="" className="h-full w-full object-contain p-0.5" loading="lazy" />
                : product.is_combo ? <Layers className="h-5 w-5 text-violet-400" /> : <ImageIcon className="h-5 w-5 text-slate-300" />}
        </span>
    )
}

function ListSkeleton() {
    return (
        <div className="divide-y divide-slate-100">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3">
                    <Skeleton className="h-11 w-11 rounded-lg" />
                    <div className="flex-1 space-y-1.5"><Skeleton className="h-3.5 w-48" /><Skeleton className="h-3 w-24" /></div>
                    <Skeleton className="h-4 w-16" />
                </div>
            ))}
        </div>
    )
}

function DeleteProduct({ product, auth, onClose, onDeleted }) {
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)
    const remove = () => {
        setBusy(true)
        axios.delete(`/api/products/delete/${product._id}/`, auth)
            .then(onDeleted)
            .catch((e) => { setError(errorText(e)); setBusy(false) })
    }
    return (
        <Modal show onClose={onClose} title={`Delete ${product.name}?`} size="sm">
            <p className="text-sm text-slate-600">
                It disappears from the shop and the counter, and its stock history is removed. Past sales keep its name.
                {' '}If you only want to stop selling it, turn off "Shop counter" and "Website" under Where it's sold on its edit page instead.
            </p>
            {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
            <div className="mt-5 flex gap-2">
                <Button block variant="secondary" autoFocus onClick={onClose}>Keep it</Button>
                <Button block variant="danger" disabled={busy} onClick={remove}>Delete</Button>
            </div>
        </Modal>
    )
}

function StockStatus({ product }) {
    const stock = Number(product.stock_exact ?? product.countInStock) || 0
    if (product.is_combo) return stock > 0 ? <StatusPill tone="green">Can sell</StatusPill> : <StatusPill tone="red">A part is out</StatusPill>
    if (stock <= 0) return <StatusPill tone="red">Out of stock</StatusPill>
    if (stock <= (product.reorder_level ?? 5)) return <StatusPill tone="amber">Low stock</StatusPill>
    return <StatusPill tone="green">In stock</StatusPill>
}

// Where a product is sold: an icon for the counter and one for the website, dimmed when off.
function SoldIn({ product }) {
    const online = product.sell_online !== false
    const shop = product.sell_in_shop !== false
    if (!online && !shop) return <Badge variant="red">Not for sale</Badge>
    const chip = (on, Icon, label) => (
        <span title={`${label}: ${on ? 'yes' : 'no'}`}
            className={cn('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium', on ? 'bg-slate-100 text-slate-700' : 'text-slate-300 line-through')}>
            <Icon className="h-3.5 w-3.5" />{label}
        </span>
    )
    return <span className="inline-flex gap-1">{chip(shop, Store, 'Counter')}{chip(online, Globe, 'Online')}</span>
}

export default ProductListScreen
