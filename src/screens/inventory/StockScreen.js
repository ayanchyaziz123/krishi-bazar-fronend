import React, { useEffect, useMemo, useState } from 'react'
import { Search, SlidersHorizontal, History, PackagePlus, AlertTriangle, CalendarClock, Coins, Pencil } from 'lucide-react'
import AdminLayout from '../../admin_components/AdminLayout'
import { Alert, Badge, Button, Card, Field, Input, Modal, Select, Spinner, Table, Td, Th, cn, formatINR } from '../../components/ui'
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
                        <StatCard icon={Coins} label="Stock value at buying price" value={formatINR(summary.stock_value)}
                            note={summary.missing_cost_price ? `${summary.missing_cost_price} items have no buying price` : 'All items priced'}
                            onClick={summary.missing_cost_price ? () => setFilter('nocost') : undefined} />
                        <StatCard icon={AlertTriangle} label="Low or out of stock" value={summary.low_stock.length}
                            tone={summary.low_stock.length ? 'amber' : 'slate'} onClick={() => setFilter('low')} note="At or below reorder level" />
                        <StatCard icon={CalendarClock} label="Expiring within 7 days" value={summary.expiring.length}
                            tone={summary.expiring.length ? 'red' : 'slate'} onClick={() => setFilter('expiring')} note="Batches still on the shelf" />
                        {/* Money owed is only sent to roles that handle sales. */}
                        {summary.dues && (
                            <StatCard icon={Coins} label="Customer dues" value={formatINR(summary.dues.total)}
                                note={`${summary.dues.count} unpaid ${summary.dues.count === 1 ? 'bill' : 'bills'}`} onClick={() => history.push('/admin/sales')} />
                        )}
                    </div>

                    {summary.expiring.length > 0 && filter === 'expiring' && (
                        <Alert variant="warning" className="mb-4">
                            {summary.expiring.map((e, i) => (
                                <span key={i} className="mr-4 inline-block">
                                    <strong>{e.name}</strong>{e.batch_no ? ` (batch ${e.batch_no})` : ''}: {e.batch_qty} {e.unit} left {e.days_left < 0 ? `expired ${-e.days_left} days ago` : e.days_left === 0 ? 'expires today' : `expires in ${e.days_left} days`}
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
                        // The shelf average when batches were bought at different prices, otherwise the last price paid.
                        const cost = p.cost_avg ?? p.cost_price
                        const mixed = p.cost_min !== null && p.cost_min !== undefined && p.cost_min !== p.cost_max
                        const margin = cost !== null && cost !== undefined && p.selling_price > 0
                            ? Math.round(((p.selling_price - cost) / p.selling_price) * 100) : null
                        return (
                            <tr key={p._id} className="hover:bg-slate-50/60">
                                <Td>
                                    <div className="flex items-center gap-3">
                                        {p.image && <img src={p.image} alt="" className="h-10 w-10 rounded-lg object-cover" />}
                                        <div>
                                            <p className="font-semibold text-slate-900">{p.name}</p>
                                            <p className="text-xs text-slate-500">
                                                {p.category} · per {p.unit}{p.sold_by_weight ? ' · by weight' : ''}{p.code ? ` · code ${p.code}` : ''}
                                                {!p.sell_online && <span className="ml-1 font-semibold text-amber-700">· shop only</span>}
                                                {!p.sell_in_shop && <span className="ml-1 font-semibold text-amber-700">· online only</span>}
                                            </p>
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
                                    {cost === null || cost === undefined ? <Badge variant="amber">Not set</Badge> : mixed ? (
                                        <span title="Batches on the shelf were bought at different prices. Each sale uses its own batch's price.">
                                            avg {formatINR(cost)}
                                            <span className="block text-xs text-slate-500">{formatINR(p.cost_min)}–{formatINR(p.cost_max)}</span>
                                        </span>
                                    ) : formatINR(cost)}
                                    {margin !== null && <div className={cn('text-xs', margin < 0 ? 'font-semibold text-rose-600' : 'text-slate-500')}>{margin}% margin{mixed ? ' on avg' : ''}</div>}
                                </Td>
                                <Td className="text-right">
                                    {formatINR(p.selling_price)}
                                    {p.is_offer && <div className="text-xs text-slate-500">{p.offer_percentage}% off {formatINR(p.price)}</div>}
                                    {p.online_price !== null && p.online_price !== undefined && <div className="text-xs text-slate-500">Online {formatINR(p.online_price)}</div>}
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
    const tones = { slate: 'bg-slate-100 text-slate-500', amber: 'bg-amber-50 text-amber-600', red: 'bg-rose-50 text-rose-600' }
    const Tag = onClick ? 'button' : 'div'
    return (
        <Card className={cn('p-0', onClick && 'transition-colors hover:border-slate-300')}>
            <Tag type={onClick ? 'button' : undefined} onClick={onClick} className="block w-full p-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
                <div className="flex items-center justify-between gap-2">
                    <p className="text-[13px] font-medium text-slate-500">{label}</p>
                    <span className={cn('flex h-7 w-7 items-center justify-center rounded-md', tones[tone])}><Icon className="h-3.5 w-3.5" /></span>
                </div>
                <p className="figure mt-2 text-[26px] font-semibold leading-tight text-slate-900">{value}</p>
                {note && <p className="mt-1 text-xs text-slate-500">{note}</p>}
            </Tag>
        </Card>
    )
}

// The unit beside a number box, e.g. "kg".
function WithUnit({ unit, children }) {
    return (
        <div className="relative">
            {children}
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">{unit}</span>
        </div>
    )
}

function EditModal({ api, product, onClose, onSaved }) {
    const [unit, setUnit] = useState(product.unit)
    const [loose, setLoose] = useState(Boolean(product.sold_by_weight))
    const [cost, setCost] = useState(product.cost_price === null ? '' : String(product.cost_price))
    // Work the buying price out from a bill: "25.4 kg for ₹2,286" is ₹90 per kg.
    const [fromBill, setFromBill] = useState(false)
    const [billQty, setBillQty] = useState('')
    const [billTotal, setBillTotal] = useState('')
    const worked = Number(billQty) > 0 && billTotal !== '' ? Math.round((Number(billTotal) / Number(billQty)) * 1000) / 1000 : null
    const [reorder, setReorder] = useState(String(product.reorder_level))
    const [error, setError] = useState('')
    const [saving, setSaving] = useState(false)

    const save = (e) => {
        e.preventDefault()
        setSaving(true)
        api.patch(`products/${product._id}/`, { unit, sold_by_weight: loose, cost_price: fromBill && worked !== null ? worked : cost, reorder_level: reorder })
            .then((p) => { onSaved(p); onClose() })
            .catch((err) => { setError(errorText(err)); setSaving(false) })
    }

    return (
        <Modal show onClose={onClose} title={`Edit ${product.name}`}>
            <form onSubmit={save} className="space-y-4">
                <Field label="Sold per" id="unit" hint="For loose items sold by weight use kg (or g, litre).">
                    <Input id="unit" list="unit-suggestions" value={unit} onChange={(e) => setUnit(e.target.value)} required />
                    <datalist id="unit-suggestions">{UNIT_SUGGESTIONS.map((u) => <option key={u} value={u} />)}</datalist>
                </Field>
                <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-slate-200 p-3 text-sm">
                    <input type="checkbox" checked={loose} onChange={(e) => setLoose(e.target.checked)} className="mt-0.5 accent-brand-600" />
                    <span>
                        <span className="block font-semibold text-slate-900">Sold loose by weight</span>
                        <span className="block text-xs text-slate-500">Stock, sales and deliveries can be part units, like 1.5 or 0.25 {unit || 'kg'}. Online it sells in steps of 0.5.</span>
                    </span>
                </label>
                <Field label={`Last buying price per ${unit || 'unit'}`} id="cost" hint="Updated each time you receive stock. Used for older stock with no batch; each batch keeps its own price.">
                    {fromBill ? (
                        <div className="space-y-2 rounded-xl bg-slate-50 p-3">
                            <div className="grid grid-cols-2 gap-2">
                                <WithUnit unit={unit}><Input type="number" min="0" step="0.001" inputMode="decimal" value={billQty} onChange={(e) => setBillQty(e.target.value)} placeholder="Bought" aria-label={`How much was bought (${unit})`} className="pr-10" /></WithUnit>
                                <Input type="number" min="0" step="0.01" inputMode="decimal" value={billTotal} onChange={(e) => setBillTotal(e.target.value)} placeholder="₹ paid in total" aria-label="Total paid" />
                            </div>
                            <p className="text-sm text-slate-700">{worked !== null ? <>= <strong>{formatINR(worked)}</strong> per {unit || 'unit'}</> : 'Enter how much was bought and the total paid.'}</p>
                            <button type="button" onClick={() => setFromBill(false)} className="text-xs font-semibold text-blue-600">Type the price instead</button>
                        </div>
                    ) : (
                        <>
                            <WithUnit unit={`/ ${unit || 'unit'}`}><Input id="cost" type="number" min="0" step="0.001" value={cost} onChange={(e) => setCost(e.target.value)} className="pr-14" /></WithUnit>
                            <button type="button" onClick={() => setFromBill(true)} className="mt-1.5 text-xs font-semibold text-blue-600">Work it out from a bill total</button>
                        </>
                    )}
                </Field>
                <Field label="Warn when stock falls to" id="reorder">
                    <Input id="reorder" type="number" min="0" step="1" value={reorder} onChange={(e) => setReorder(e.target.value)} required />
                </Field>
                <p className="text-xs text-slate-500">Change the selling price, photos and description on the Items page.</p>
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
                <Field label={info.qtyLabel} id="qty" hint={product.sold_by_weight ? `Part units are fine: 0.75 ${product.unit} is 750 g.` : undefined}>
                    <WithUnit unit={product.unit}>
                        <Input id="qty" type="number" min="0" step={product.sold_by_weight ? '0.001' : '1'} inputMode={product.sold_by_weight ? 'decimal' : 'numeric'}
                            value={qty} onChange={(e) => setQty(e.target.value)} required className="pr-12" />
                    </WithUnit>
                    {product.sold_by_weight && reason !== 'correction' && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                            {[0.25, 0.5, 1, 2].map((w) => (
                                <button key={w} type="button" onClick={() => setQty(String(w))}
                                    className="h-7 rounded-md px-2 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 hover:ring-slate-300">
                                    {(product.unit || 'kg').toLowerCase() === 'kg' && w < 1 ? `${w * 1000} g` : `${w} ${product.unit}`}
                                </button>
                            ))}
                        </div>
                    )}
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
    const [shelf, setShelf] = useState(null)
    const [error, setError] = useState('')

    useEffect(() => {
        api.get(`movements/?product=${product._id}`).then(setMoves).catch((e) => setError(errorText(e)))
        api.get(`products/${product._id}/batches/`).then(setShelf).catch(() => {})
    }, [api, product._id])

    return (
        <Modal show onClose={onClose} title={`${product.name} history`} size="lg">
            {shelf && (shelf.batches.length > 0 || shelf.untracked > 0) && (
                <div className="mb-5">
                    <p className="mb-2 text-sm font-semibold text-slate-900">On the shelf now <span className="font-normal text-slate-500">· sold oldest first</span></p>
                    <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 text-sm">
                        {shelf.untracked > 0 && (
                            <li className="flex items-center justify-between gap-3 px-3 py-2">
                                <span className="text-slate-600">Older stock, from before batches were recorded</span>
                                <span className="font-semibold">{shelf.untracked} {product.unit}</span>
                            </li>
                        )}
                        {shelf.batches.map((b, i) => (
                            <li key={i} className="flex items-center justify-between gap-3 px-3 py-2">
                                <div className="min-w-0">
                                    <p className="font-medium text-slate-900">{b.batch_no ? `Batch ${b.batch_no}` : `Delivery #${b.delivery}`}</p>
                                    <p className="text-xs text-slate-500">
                                        Received {new Date(`${b.received_on}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}{b.supplier ? ` from ${b.supplier}` : ''} · {formatINR(b.unit_cost)} each
                                    </p>
                                </div>
                                <div className="shrink-0 text-right">
                                    <p className="font-semibold text-slate-900">{b.remaining} of {b.qty} {product.unit}</p>
                                    {b.expiry_date && (
                                        <p className={cn('text-xs', b.days_left < 0 ? 'font-semibold text-rose-600' : b.days_left <= 7 ? 'font-semibold text-amber-600' : 'text-slate-500')}>
                                            {b.days_left < 0 ? `Expired ${-b.days_left} days ago` : b.days_left === 0 ? 'Expires today' : `Expires in ${b.days_left} days`}
                                        </p>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            <p className="mb-2 text-sm font-semibold text-slate-900">Stock changes</p>
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
