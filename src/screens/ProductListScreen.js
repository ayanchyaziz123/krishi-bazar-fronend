import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useSelector } from 'react-redux'
import { Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import AdminLayout from '../admin_components/AdminLayout'
import { Alert, Badge, Button, Card, Input, Modal, Select, Spinner, StatusPill, formatINR, toast } from '../components/ui'
import { useCategories } from '../components/categories'

const errorText = (e) => (e.response && e.response.data && e.response.data.detail) || e.message

const CHANNELS = [
    { value: '', label: 'Sold anywhere' },
    { value: 'both', label: 'Shop and online' },
    { value: 'shop_only', label: 'Shop only' },
    { value: 'online_only', label: 'Online only' },
    { value: 'hidden', label: 'Not for sale' },
]

// Every product in the store, with search, filters and paging kept in the address bar
// so a filtered list can be bookmarked or shared.
function ProductListScreen({ history, location }) {
    const { userInfo } = useSelector((state) => state.userLogin)
    const auth = useMemo(() => ({ headers: { Authorization: `Bearer ${userInfo.token}` } }), [userInfo])
    const categories = useCategories()

    const params = new URLSearchParams(location.search)
    const filters = {
        keyword: params.get('keyword') || '',
        category: params.get('category') || '',
        channel: params.get('channel') || '',
        sort: params.get('sort') || 'name',
        page_size: params.get('page_size') || '25',
        page: Number(params.get('page')) || 1,
    }

    const [search, setSearch] = useState(filters.keyword)
    const [data, setData] = useState(null)
    const [error, setError] = useState('')
    const [deleting, setDeleting] = useState(null)
    const [reload, setReload] = useState(0)

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
        if (filters.keyword) query.set('keyword', filters.keyword)
        if (filters.category) query.set('category', filters.category)
        if (filters.channel) query.set('channel', filters.channel)
        axios.get(`/api/products/?${query}`, auth)
            .then((res) => { setData(res.data); setError('') })
            .catch((e) => setError(errorText(e)))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.search, auth, reload])

    const filtered = filters.keyword || filters.category || filters.channel

    return (
        <AdminLayout
            title="Items"
            subtitle="Everything sold in the shop and online."
            action={<Button to="/admin/product/new"><Plus className="h-4 w-4" /> New item</Button>}
        >
            <div className="mb-4 flex flex-col gap-2 lg:flex-row">
                <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, category or counter code" className="pl-10" aria-label="Search items" />
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:flex">
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
                    </Select>
                    <Select value={filters.page_size} onChange={(e) => update({ page_size: e.target.value })} aria-label="Rows per page" className="lg:!w-36">
                        {['10', '25', '50', '100'].map((n) => <option key={n} value={n}>{n} per page</option>)}
                    </Select>
                </div>
            </div>

            {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

            {!data ? <Spinner /> : (
                <Card className="overflow-hidden rounded-xl">
                    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3 text-sm text-slate-600">
                        <span>{data.count} {data.count === 1 ? 'item' : 'items'}{filtered ? ' match' : ''}</span>
                        {filtered && (
                            <button type="button" className="font-semibold text-brand-700 hover:underline" onClick={() => { setSearch(''); history.replace({ search: '' }) }}>
                                Clear filters
                            </button>
                        )}
                    </div>
                    {data.products.length === 0 ? (
                        <p className="px-5 py-12 text-center text-sm text-slate-500">No items match. Try another search or clear the filters.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    <tr>
                                        <th className="px-5 py-2.5">Item</th>
                                        <th className="px-3 py-2.5">Category</th>
                                        <th className="px-3 py-2.5 text-right">Price</th>
                                        <th className="px-3 py-2.5 text-right">On hand</th>
                                        <th className="px-3 py-2.5">Status</th>
                                        <th className="px-3 py-2.5">Sold in</th>
                                        <th className="px-5 py-2.5" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {data.products.map((p) => (
                                        <tr key={p._id} className="hover:bg-slate-50/60">
                                            <td className="px-5 py-2.5">
                                                <div className="flex items-center gap-3">
                                                    <span className="flex h-10 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-50 p-1">
                                                        <img src={p.image} alt="" className="max-h-full max-w-full object-contain" />
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="truncate font-medium text-slate-900">{p.name}</p>
                                                        <p className="text-xs text-slate-400">
                                                            #{p._id}{p.code ? ` · code ${p.code}` : ''}{p.weight ? ` · ${p.weight}` : ''}{p.sold_by_weight ? ' · by weight' : ''}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2.5 text-slate-600">{p.category}</td>
                                            <td className="px-3 py-2.5 text-right font-medium text-slate-900">
                                                {formatINR(p.shop_price ?? p.price)}
                                                {p.online_price != null && Number(p.online_price) !== Number(p.shop_price) && (
                                                    <span className="block text-xs font-normal text-slate-500">Online {formatINR(p.online_price)}</span>
                                                )}
                                                {p.is_offer && p.offer_percentage > 0 && <span className="block text-xs font-normal text-amber-700">{p.offer_percentage}% off</span>}
                                            </td>
                                            <td className="px-3 py-2.5 text-right text-slate-700">{p.stock_exact ?? p.countInStock} <span className="text-xs text-slate-400">{p.unit === 'piece' ? 'pc' : p.unit}</span></td>
                                            <td className="px-3 py-2.5"><StockStatus product={p} /></td>
                                            <td className="px-3 py-2.5"><SoldIn product={p} /></td>
                                            <td className="px-5 py-2.5 text-right">
                                                <div className="inline-flex gap-1">
                                                    <Button to={`/admin/product/${p._id}/edit`} variant="ghost" size="icon" aria-label={`Edit ${p.name}`}><Pencil className="h-4 w-4" /></Button>
                                                    <Button variant="danger-soft" size="icon" onClick={() => setDeleting(p)} aria-label={`Delete ${p.name}`}><Trash2 className="h-4 w-4" /></Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {data.pages > 1 && (
                        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-sm">
                            <span className="text-slate-500">Page {data.page} of {data.pages}</span>
                            <div className="flex gap-1">
                                <Button variant="secondary" size="sm" disabled={data.page <= 1} onClick={() => update({ page: String(data.page - 1) })}>
                                    <ChevronLeft className="h-4 w-4" /> Previous
                                </Button>
                                <Button variant="secondary" size="sm" disabled={data.page >= data.pages} onClick={() => update({ page: String(data.page + 1) })}>
                                    Next <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>
            )}

            {deleting && (
                <DeleteProduct product={deleting} auth={auth} onClose={() => setDeleting(null)}
                    onDeleted={() => { toast.success(`${deleting.name} was deleted.`); setDeleting(null); setReload((n) => n + 1) }} />
            )}
        </AdminLayout>
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
                {' '}If you only want to stop selling it, untick "Sell on the website" and "Sell at the shop counter" on its edit page instead.
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
    if (stock <= 0) return <StatusPill tone="red">Out of stock</StatusPill>
    if (stock <= (product.reorder_level ?? 5)) return <StatusPill tone="amber">Low stock</StatusPill>
    return <StatusPill tone="green">In stock</StatusPill>
}

// Where a product is sold: both channels, one of them, or neither.
function SoldIn({ product }) {
    const online = product.sell_online !== false
    const shop = product.sell_in_shop !== false
    const label = online && shop ? 'Shop and online' : online ? 'Online only' : shop ? 'Shop only' : 'Not for sale'
    return <Badge variant={online && shop ? 'slate' : online || shop ? 'amber' : 'red'}>{label}</Badge>
}

export default ProductListScreen
