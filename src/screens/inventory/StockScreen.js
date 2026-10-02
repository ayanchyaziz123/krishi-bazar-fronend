import React, { useEffect, useMemo, useState } from 'react'
import { Search, SlidersHorizontal, History, PackagePlus, AlertTriangle, CalendarClock, Coins, Pencil } from 'lucide-react'
import AdminLayout from '../../admin_components/AdminLayout'
import { Alert, Badge, Button, Card, Field, Input, Modal, Select, Spinner, Table, Td, Th, cn, formatTk } from '../../components/ui'
import { useAdminGuard, inventoryApi, errorText, formatDateTime } from '../../inventory/api'

const UNIT_SUGGESTIONS = ['piece', 'kg', '500 g pack', '250 g pack', '100 g pack', 'jar', 'packet', 'litre', 'dozen', 'bundle']

// Stock overview: what is on the shelves, what is running low, and why stock changed.
function StockScreen({ history }) {
    const { userInfo, isAdmin } = useAdminGuard(history)
    const api = useMemo(() => inventoryApi(userInfo), [userInfo])

    const [products, setProducts] = useState([])
    const [summary, setSummary] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [query, setQuery] = useState('')
    const [filter, setFilter] = useState('all')

    const [editing, setEditing] = useState(null)
    const [adjusting, setAdjusting] = useState(null)
    const [historyFor, setHistoryFor] = useState(null)

    const load = () => {
        setLoading(true)
        Promise.all([api.get('products/'), api.get('summary/')])
            .then(([p, s]) => { setProducts(p); setSummary(s); setError('') })
            .catch((e) => setError(errorText(e)))
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        if (isAdmin) load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAdmin])

    const expiringIds = new Set((summary ? summary.expiring : []).map((e) => e.product))

    const visible = products.filter((p) => {
        if (query && !`${p.name} ${p.category}`.toLowerCase().includes(query.toLowerCase())) return false
        if (filter === 'low') return p.low_stock
        if (filter === 'out') return p.countInStock <= 0
        if (filter === 'expiring') return expiringIds.has(p._id)
        if (filter === 'nocost') return p.cost_price === null
        return true
    })

    const onSaved = (updated) => {
        setProducts((list) => list.map((p) => (p._id === updated._id ? updated : p)))
        api.get('summary/').then(setSummary).catch(() => {})
    }

    return (
        <AdminLayout
            title="Stock"
            subtitle="Everything on the shelves. Counter sales and online orders both take from this stock."
            action={<Button to="/admin/receive"><PackagePlus className="h-4 w-4" /> Receive stock</Button>}
        >
            {error && <Alert variant="danger" className="mb-4">{error}</Alert>}
            {loading && !summary ? <Spinner /> : summary && (
                <>
                    <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <StatCard icon={Coins} label="Stock value at buying price" value={formatTk(summary.stock_value)}
                            note={summary.missing_cost_price ? `${summary.missing_cost_price} items have no buying price` : 'All items priced'}
                            onClick={summary.missing_cost_price ? () => setFilter('nocost') : undefined} />
                        <StatCard icon={AlertTriangle} label="Low or out of stock" value={summary.low_stock.length}
                            tone={summary.low_stock.length ? 'amber' : 'slate'} onClick={() => setFilter('low')} note="At or below reorder level" />
                        <StatCard icon={CalendarClock} label="Expiring within 7 days" value={summary.expiring.length}
                            tone={summary.expiring.length ? 'red' : 'slate'} onClick={() => setFilter('expiring')} note="Batches still on the shelf" />
                        <StatCard icon={Coins} label="Customer dues" value={formatTk(summary.dues.total)}
                            note={`${summary.dues.count} unpaid ${summary.dues.count === 1 ? 'bill' : 'bills'}`} onClick={() => history.push('/admin/sales')} />
                    </div>

                    {summary.expiring.length > 0 && filter === 'expiring' && (
                        <Alert variant="warning" className="mb-4">
                            {summary.expiring.map((e, i) => (
                                <span key={i} className="mr-4 inline-block">
                                    <strong>{e.name}</strong>: batch of {e.batch_qty} {e.unit} {e.days_left < 0 ? `expired ${-e.days_left} days ago` : e.days_left === 0 ? 'expires today' : `expires in ${e.days_left} days`}
                                </span>
                            ))}
                        </Alert>
                    )}
                </>
            )}

            <div className="mb-4 flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search items" className="pl-10" />
                </div>
                <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="sm:w-56">
                    <option value="all">All items</option>
                    <option value="low">Low or out of stock</option>
                    <option value="out">Out of stock</option>
                    <option value="expiring">Expiring soon</option>
                    <option value="nocost">No buying price</option>
                </Select>
            </div>

            <Table>
                <thead>
                    <tr>
                        <Th>Item</Th>
                        <Th className="text-right">In stock</Th>
                        <Th className="text-right">Warn at</Th>
                        <Th className="text-right">Buying price</Th>
                        <Th className="text-right">Selling price</Th>
                        <Th></Th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {visible.map((p) => {
                        const margin = p.cost_price !== null && p.selling_price > 0
                            ? Math.round(((p.selling_price - p.cost_price) / p.selling_price) * 100) : null
                        return (
                            <tr key={p._id} className="hover:bg-slate-50/60">
                                <Td>
                                    <div className="flex items-center gap-3">
                                        {p.image && <img src={p.image} alt="" className="h-10 w-10 rounded-lg object-cover" />}
                                        <div>
                                            <p className="font-semibold text-slate-900">{p.name}</p>
                                            <p className="text-xs text-slate-500">{p.category} · per {p.unit}</p>
                                        </div>
                                    </div>
                                </Td>
                                <Td className="text-right">
                                    <span className={cn('font-semibold', p.countInStock <= 0 ? 'text-rose-600' : p.low_stock ? 'text-amber-600' : 'text-slate-900')}>
                                        {p.countInStock}
                                    </span> <span className="text-xs text-slate-500">{p.unit}</span>
                                    {expiringIds.has(p._id) && <div><Badge variant="red">Expiring</Badge></div>}
                                </Td>
                                <Td className="text-right">{p.reorder_level}</Td>
                                <Td className="text-right">
                                    {p.cost_price === null ? <Badge variant="amber">Not set</Badge> : formatTk(p.cost_price)}
                                    {margin !== null && <div className={cn('text-xs', margin < 0 ? 'font-semibold text-rose-600' : 'text-slate-500')}>{margin}% margin</div>}
                                </Td>
                                <Td className="text-right">
                                    {formatTk(p.selling_price)}
                                    {p.is_offer && <div className="text-xs text-slate-500">{p.offer_percentage}% off {formatTk(p.price)}</div>}
                                </Td>
                                <Td className="text-right">
                                    <div className="flex justify-end gap-1">
                                        <Button variant="ghost" size="sm" onClick={() => setEditing(p)}><Pencil className="h-3.5 w-3.5" /> Edit</Button>
                                        <Button variant="ghost" size="sm" onClick={() => setAdjusting(p)}><SlidersHorizontal className="h-3.5 w-3.5" /> Adjust</Button>
                                        <Button variant="ghost" size="sm" onClick={() => setHistoryFor(p)}><History className="h-3.5 w-3.5" /> History</Button>
                                    </div>
                                </Td>
                            </tr>
                        )
                    })}
                    {visible.length === 0 && !loading && (
                        <tr><Td colSpan={6} className="py-10 text-center text-slate-500">No items match.</Td></tr>
                    )}
                </tbody>
            </Table>

            {editing && <EditModal api={api} product={editing} onClose={() => setEditing(null)} onSaved={onSaved} />}
            {adjusting && <AdjustModal api={api} product={adjusting} onClose={() => setAdjusting(null)} onSaved={onSaved} />}
            {historyFor && <HistoryModal api={api} product={historyFor} onClose={() => setHistoryFor(null)} />}
        </AdminLayout>
    )
}

function StatCard({ icon: Icon, label, value, note, tone = 'slate', onClick }) {
    const tones = { slate: 'bg-slate-100 text-slate-600', amber: 'bg-amber-100 text-amber-700', red: 'bg-rose-100 text-rose-700' }
    return (
        <Card className={cn('p-4', onClick && 'cursor-pointer transition hover:border-brand-300')} onClick={onClick}>
            <div className="flex items-center gap-3">
                <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl', tones[tone])}><Icon className="h-4 w-4" /></span>
                <p className="text-sm text-slate-500">{label}</p>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
            {note && <p className="text-xs text-slate-500">{note}</p>}
        </Card>
    )
}

function EditModal({ api, product, onClose, onSaved }) {
    const [unit, setUnit] = useState(product.unit)
    const [cost, setCost] = useState(product.cost_price === null ? '' : String(product.cost_price))
    const [reorder, setReorder] = useState(String(product.reorder_level))
    const [error, setError] = useState('')
    const [saving, setSaving] = useState(false)

    const save = (e) => {
        e.preventDefault()
        setSaving(true)
        api.patch(`products/${product._id}/`, { unit, cost_price: cost, reorder_level: reorder })
            .then((p) => { onSaved(p); onClose() })
            .catch((err) => { setError(errorText(err)); setSaving(false) })
    }

    return (
        <Modal show onClose={onClose} title={`Edit ${product.name}`}>
            <form onSubmit={save} className="space-y-4">
                <Field label="Sold per" id="unit" hint="Stock is counted in whole units. For loose rice use kg, for spices use a pack size.">
                    <Input id="unit" list="unit-suggestions" value={unit} onChange={(e) => setUnit(e.target.value)} required />
                    <datalist id="unit-suggestions">{UNIT_SUGGESTIONS.map((u) => <option key={u} value={u} />)}</datalist>
                </Field>
                <Field label="Buying price per unit" id="cost" hint="Updated automatically each time you receive stock.">
                    <Input id="cost" type="number" min="0" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} />
                </Field>
                <Field label="Warn when stock falls to" id="reorder">
                    <Input id="reorder" type="number" min="0" step="1" value={reorder} onChange={(e) => setReorder(e.target.value)} required />
                </Field>
                <p className="text-xs text-slate-500">Change the selling price, photos and description on the Products page.</p>
                {error && <Alert variant="danger">{error}</Alert>}
                <Button type="submit" block disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
            </form>
        </Modal>
    )
}

const ADJUST_REASONS = {
    wastage: { label: 'Wastage or damage', qtyLabel: 'How many to remove', hint: 'Rotten fruit, broken jars, spoiled goods.' },
    return: { label: 'Customer return', qtyLabel: 'How many came back', hint: 'Goods returned in sellable condition.' },
    correction: { label: 'Stock count correction', qtyLabel: 'Stock counted on the shelf', hint: 'Enter the real count. The difference is recorded.' },
}

function AdjustModal({ api, product, onClose, onSaved }) {
    const [reason, setReason] = useState('wastage')
    const [qty, setQty] = useState('')
    const [note, setNote] = useState('')
    const [error, setError] = useState('')
    const [saving, setSaving] = useState(false)
    const info = ADJUST_REASONS[reason]

    const save = (e) => {
        e.preventDefault()
        setSaving(true)
        api.post('adjust/', { product: product._id, reason, qty, note })
            .then((p) => { onSaved(p); onClose() })
            .catch((err) => { setError(errorText(err)); setSaving(false) })
    }

    return (
        <Modal show onClose={onClose} title={`Adjust ${product.name}`}>
            <form onSubmit={save} className="space-y-4">
                <p className="text-sm text-slate-600">Now in stock: <strong>{product.countInStock} {product.unit}</strong></p>
                <Field label="Reason" id="reason" hint={info.hint}>
                    <Select id="reason" value={reason} onChange={(e) => setReason(e.target.value)}>
                        {Object.entries(ADJUST_REASONS).map(([value, r]) => <option key={value} value={value}>{r.label}</option>)}
                    </Select>
                </Field>
                <Field label={`${info.qtyLabel} (${product.unit})`} id="qty">
                    <Input id="qty" type="number" min="0" step="1" value={qty} onChange={(e) => setQty(e.target.value)} required />
                </Field>
                <Field label="Note" id="note">
                    <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" />
                </Field>
                {error && <Alert variant="danger">{error}</Alert>}
                <Button type="submit" block disabled={saving}>{saving ? 'Saving…' : 'Save adjustment'}</Button>
            </form>
        </Modal>
    )
}

function HistoryModal({ api, product, onClose }) {
    const [moves, setMoves] = useState(null)
    const [error, setError] = useState('')

    useEffect(() => {
        api.get(`movements/?product=${product._id}`).then(setMoves).catch((e) => setError(errorText(e)))
    }, [api, product._id])

    return (
        <Modal show onClose={onClose} title={`${product.name} history`}>
            {error ? <Alert variant="danger">{error}</Alert> : !moves ? <Spinner /> : moves.length === 0 ? (
                <p className="text-sm text-slate-500">No stock changes recorded yet. Changes appear here from now on.</p>
            ) : (
                <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto text-sm">
                    {moves.map((m) => (
                        <li key={m.id} className="flex items-center justify-between gap-3 py-2">
                            <div>
                                <p className="font-medium text-slate-900">{m.reason_label}</p>
                                <p className="text-xs text-slate-500">{formatDateTime(m.createdAt)}{m.note ? ` · ${m.note}` : ''}{m.by ? ` · ${m.by}` : ''}</p>
                            </div>
                            <div className="text-right">
                                <p className={cn('font-semibold', m.change > 0 ? 'text-emerald-600' : 'text-rose-600')}>{m.change > 0 ? '+' : ''}{m.change}</p>
                                <p className="text-xs text-slate-500">left {m.stock_after}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </Modal>
    )
}

export default StockScreen
