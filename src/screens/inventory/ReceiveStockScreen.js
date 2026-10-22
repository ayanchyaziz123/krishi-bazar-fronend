import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Plus, Trash2, UserPlus, Paperclip, FileText, Search, ChevronRight, Camera, X, ExternalLink } from 'lucide-react'
import AdminLayout from '../../admin_components/AdminLayout'
import { Alert, Badge, Button, Card, Field, Input, Modal, Select, Spinner, cn, formatINR } from '../../components/ui'
import { useAdminGuard, inventoryApi, errorText, formatDateTime, todayInDhaka } from '../../inventory/api'

const emptyLine = () => ({ key: Math.random(), product: '', qty: '', unit_cost: '', line_total: '', by_total: false, batch_no: '', expiry_date: '' })

// The price per unit when the supplier's bill gives a total for the line (e.g. a 25.4 kg
// sack for ₹2,286 is ₹90 per kg). Kept to 3 decimals, as the server stores it.
const perUnit = (total, qty) => (Number(qty) > 0 && total !== '' ? String(Math.round((Number(total) / Number(qty)) * 1000) / 1000) : '')
const lineTotal = (l) => Math.round((Number(l.qty) || 0) * (Number(l.unit_cost) || 0) * 100) / 100

const STATUS = {
    paid: { label: 'Paid', variant: 'green' },
    partly_paid: { label: 'Part paid', variant: 'amber' },
    unpaid: { label: 'Not paid', variant: 'red' },
}

const showDate = (iso) => (iso ? new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '')

// Record a delivery from a farmer or supplier: the items with their batch and expiry,
// the supplier's receipt, and how much was paid. Stock goes up batch by batch.
function ReceiveStockScreen({ history }) {
    const { userInfo, isAdmin } = useAdminGuard(history)
    const api = useMemo(() => inventoryApi(userInfo), [userInfo])

    const [products, setProducts] = useState([])
    const [suppliers, setSuppliers] = useState([])
    const [deliveries, setDeliveries] = useState({ deliveries: [], owed_total: 0, owed_count: 0 })
    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState('')

    const [supplier, setSupplier] = useState('')
    const [invoiceNo, setInvoiceNo] = useState('')
    const [receivedOn, setReceivedOn] = useState(todayInDhaka())
    const [note, setNote] = useState('')
    const [lines, setLines] = useState([emptyLine()])
    const [receipt, setReceipt] = useState(null)
    const [payment, setPayment] = useState('all') // all | part | none
    const [paidAmount, setPaidAmount] = useState('')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [addingSupplier, setAddingSupplier] = useState(false)

    const [query, setQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [openId, setOpenId] = useState(null)

    const loadDeliveries = () => {
        const params = new URLSearchParams()
        if (query.trim()) params.set('q', query.trim())
        if (statusFilter) params.set('status', statusFilter)
        return api.get(`purchases/?${params.toString()}`).then(setDeliveries)
    }

    const load = () => {
        Promise.all([api.get('products/'), api.get('suppliers/'), loadDeliveries()])
            .then(([p, s]) => { setProducts(p); setSuppliers(s); setLoadError('') })
            .catch((e) => setLoadError(errorText(e)))
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        if (isAdmin) load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAdmin])

    // Search and filter the delivery history as the user types.
    useEffect(() => {
        if (!isAdmin || loading) return undefined
        const timer = setTimeout(() => loadDeliveries().catch(() => {}), 250)
        return () => clearTimeout(timer)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query, statusFilter])

    const productById = (id) => products.find((p) => String(p._id) === String(id))
    const updateLine = (key, changes) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...changes } : l)))
    const pickProduct = (key, id) => {
        const p = productById(id)
        updateLine(key, { product: id, unit_cost: p && p.cost_price !== null && p.cost_price !== undefined ? String(p.cost_price) : '' })
    }

    const total = lines.reduce((sum, l) => sum + lineTotal(l), 0)

    const reset = () => {
        setLines([emptyLine()]); setInvoiceNo(''); setNote(''); setReceipt(null)
        setPayment('all'); setPaidAmount(''); setReceivedOn(todayInDhaka())
    }

    const save = (e) => {
        e.preventDefault()
        setError('')
        setSuccess('')
        const items = lines.filter((l) => l.product)
        if (items.length === 0) {
            setError('Choose at least one item.')
            return
        }
        if (payment === 'part' && !(Number(paidAmount) > 0)) {
            setError('Enter how much was paid, or choose "Not paid".')
            return
        }
        const payload = {
            supplier: supplier || null,
            invoice_no: invoiceNo,
            received_on: receivedOn,
            note,
            amount_paid: payment === 'all' ? 'all' : payment === 'none' ? 0 : paidAmount,
            items: items.map(({ product, qty, unit_cost, batch_no, expiry_date }) => ({ product, qty, unit_cost, batch_no, expiry_date })),
        }
        const form = new FormData()
        form.append('payload', JSON.stringify(payload))
        if (receipt) form.append('receipt', receipt)
        setSaving(true)
        api.postForm('purchases/', form)
            .then((res) => {
                setSuccess(`Delivery #${res.id} saved: ${items.length} ${items.length === 1 ? 'item' : 'items'}, ${formatINR(res.total_cost)}${res.due > 0 ? `, ${formatINR(res.due)} still owed` : ', paid'}.`)
                reset()
                setSaving(false)
                load()
            })
            .catch((err) => { setError(errorText(err)); setSaving(false) })
    }

    return (
        <AdminLayout title="Receive stock" subtitle="Record each delivery with its batches, the supplier's receipt and what was paid.">
            {loading ? <Spinner /> : loadError ? <Alert variant="danger">{loadError}</Alert> : (
                <div className="space-y-8">
                    <Card className="rounded-xl">
                        <form onSubmit={save} className="space-y-6 p-5">
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <Field label="Supplier" id="supplier">
                                    <div className="flex gap-2">
                                        <Select id="supplier" value={supplier} onChange={(e) => setSupplier(e.target.value)}>
                                            <option value="">Not recorded</option>
                                            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </Select>
                                        <Button variant="secondary" size="icon" className="h-11 w-11 shrink-0" onClick={() => setAddingSupplier(true)} aria-label="Add supplier">
                                            <UserPlus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </Field>
                                <Field label="Invoice or memo number" id="invoice">
                                    <Input id="invoice" value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} placeholder="Optional" />
                                </Field>
                                <Field label="Delivery date" id="received">
                                    <Input id="received" type="date" value={receivedOn} max={todayInDhaka()} onChange={(e) => setReceivedOn(e.target.value)} required />
                                </Field>
                                <Field label="Note" id="note">
                                    <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" />
                                </Field>
                            </div>

                            <div className="space-y-3">
                                <div className="hidden grid-cols-[1fr_7rem_7rem_7.5rem_7rem_8.5rem_2.5rem] gap-3 text-xs font-semibold uppercase tracking-wider text-slate-500 lg:grid">
                                    <span>Item</span><span>Quantity / weight</span><span>Price per unit</span><span>Line total</span><span>Batch no.</span><span>Expiry date</span><span />
                                </div>
                                {lines.map((l) => {
                                    const p = productById(l.product)
                                    return (
                                        <div key={l.key} className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 lg:grid-cols-[1fr_7rem_7rem_7.5rem_7rem_8.5rem_2.5rem] lg:gap-3 lg:bg-transparent lg:p-0">
                                            <Select value={l.product} onChange={(e) => pickProduct(l.key, e.target.value)} aria-label="Item" className="col-span-2 lg:col-span-1">
                                                <option value="">Choose an item</option>
                                                {products.map((prod) => (
                                                    <option key={prod._id} value={prod._id}>{prod.name} ({prod.countInStock} {prod.unit} now)</option>
                                                ))}
                                            </Select>
                                            <div className="relative">
                                                <Input type="number" min={p && p.sold_by_weight ? '0.001' : '1'} step={p && p.sold_by_weight ? '0.001' : '1'} value={l.qty} required={Boolean(l.product)}
                                                    inputMode={p && p.sold_by_weight ? 'decimal' : 'numeric'}
                                                    onChange={(e) => updateLine(l.key, { qty: e.target.value, ...(l.by_total ? { unit_cost: perUnit(l.line_total, e.target.value) } : {}) })}
                                                    placeholder={p && p.sold_by_weight ? 'Weight' : 'Qty'} aria-label="Quantity or weight" className="pr-10" />
                                                {p && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">{p.unit || 'pc'}</span>}
                                            </div>
                                            <Input type="number" min="0" step="0.001" value={l.unit_cost} required={Boolean(l.product)}
                                                onChange={(e) => updateLine(l.key, { unit_cost: e.target.value, by_total: false, line_total: '' })}
                                                placeholder={p ? `₹ per ${p.unit || 'piece'}` : '₹ each'} aria-label="Buying price per unit" />
                                            <Input type="number" min="0" step="0.01" value={l.by_total ? l.line_total : (l.qty && l.unit_cost ? String(lineTotal(l)) : '')}
                                                onChange={(e) => updateLine(l.key, { line_total: e.target.value, by_total: true, unit_cost: perUnit(e.target.value, l.qty) })}
                                                placeholder="₹ total" aria-label="Line total from the bill"
                                                title="Type the total on the supplier's bill and the price per unit is worked out" />
                                            <Input value={l.batch_no} maxLength={60} onChange={(e) => updateLine(l.key, { batch_no: e.target.value })}
                                                placeholder="Optional" aria-label="Batch number" />
                                            <Input type="date" value={l.expiry_date}
                                                onChange={(e) => updateLine(l.key, { expiry_date: e.target.value })} aria-label="Expiry date" />
                                            <Button variant="ghost" size="icon" className="h-11 w-10" aria-label="Remove line"
                                                onClick={() => setLines((ls) => (ls.length > 1 ? ls.filter((x) => x.key !== l.key) : [emptyLine()]))}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )
                                })}
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <Button variant="secondary" size="sm" onClick={() => setLines((ls) => [...ls, emptyLine()])}>
                                        <Plus className="h-3.5 w-3.5" /> Add another item
                                    </Button>
                                    <p className="text-xs text-slate-500">Leave expiry empty for goods that don't spoil, like handicrafts.</p>
                                </div>
                            </div>

                            <div className="grid gap-5 border-t border-slate-100 pt-5 md:grid-cols-2">
                                <ReceiptPicker file={receipt} onChange={setReceipt} />
                                <div>
                                    <p className="mb-2 text-sm font-medium text-slate-700">Paid to the supplier</p>
                                    <div className="grid grid-cols-3 gap-1.5">
                                        {[['all', 'Paid in full'], ['part', 'Part paid'], ['none', 'Not paid']].map(([value, label]) => (
                                            <button key={value} type="button" onClick={() => setPayment(value)}
                                                className={cn('rounded-lg py-2 text-sm font-semibold ring-1 ring-inset transition',
                                                    payment === value ? 'bg-slate-900 text-white ring-slate-900' : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50')}>
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                    {payment === 'part' && (
                                        <Input type="number" min="0" step="0.01" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)}
                                            placeholder="Amount paid now" aria-label="Amount paid now" className="mt-2" />
                                    )}
                                    <p className="mt-2 text-xs text-slate-500">
                                        {payment === 'all' ? 'Nothing will be owed for this delivery.'
                                            : payment === 'none' ? `${formatINR(total)} will be owed to the supplier.`
                                                : `${formatINR(Math.max(total - (Number(paidAmount) || 0), 0))} will still be owed.`}
                                    </p>
                                </div>
                            </div>

                            {error && <Alert variant="danger">{error}</Alert>}
                            {success && <Alert variant="success">{success}</Alert>}

                            <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-lg font-bold text-slate-900">Delivery total {formatINR(total)}</p>
                                <Button type="submit" size="lg" disabled={saving}>{saving ? 'Saving…' : 'Add to stock'}</Button>
                            </div>
                        </form>
                    </Card>

                    <section>
                        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Deliveries</h2>
                                <p className="text-sm text-slate-500">
                                    {deliveries.owed_total > 0
                                        ? <>You owe suppliers <strong className="text-rose-700">{formatINR(deliveries.owed_total)}</strong> on {deliveries.owed_count} {deliveries.owed_count === 1 ? 'delivery' : 'deliveries'}.</>
                                        : 'All deliveries are paid.'}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <div className="relative">
                                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Supplier, invoice, item or batch" className="!w-64 pl-9" aria-label="Search deliveries" />
                                </div>
                                <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="!w-36" aria-label="Payment status">
                                    <option value="">All</option>
                                    <option value="unpaid">Not paid</option>
                                    <option value="partly_paid">Part paid</option>
                                    <option value="paid">Paid</option>
                                </Select>
                            </div>
                        </div>
                        <Card className="overflow-hidden rounded-xl">
                            {deliveries.deliveries.length === 0 ? (
                                <p className="px-6 py-10 text-center text-sm text-slate-500">{query || statusFilter ? 'No deliveries match.' : 'Nothing received yet.'}</p>
                            ) : (
                                <ul className="divide-y divide-slate-100">
                                    {deliveries.deliveries.map((d) => (
                                        <li key={d.id}>
                                            <button type="button" onClick={() => setOpenId(d.id)} className="flex w-full items-center gap-4 px-5 py-3 text-left hover:bg-slate-50">
                                                <div className="w-24 shrink-0 text-sm">
                                                    <p className="font-semibold text-slate-900">#{d.id}</p>
                                                    <p className="text-xs text-slate-500">{showDate(d.received_on)}</p>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-medium text-slate-900">
                                                        {d.supplier || 'Supplier not recorded'}{d.invoice_no ? <span className="font-normal text-slate-500"> · memo {d.invoice_no}</span> : ''}
                                                    </p>
                                                    <p className="truncate text-xs text-slate-500">{d.items.map((i) => `${i.qty} ${i.name}`).join(', ')}</p>
                                                </div>
                                                {d.receipt
                                                    ? <span className="hidden items-center gap-1 text-xs text-slate-500 sm:flex"><Paperclip className="h-3.5 w-3.5" /> Receipt</span>
                                                    : <span className="hidden text-xs text-slate-400 sm:block">No receipt</span>}
                                                <div className="w-28 shrink-0 text-right">
                                                    <p className="text-sm font-semibold text-slate-900">{formatINR(d.total_cost)}</p>
                                                    <Badge variant={STATUS[d.status].variant}>{d.status === 'partly_paid' ? `${formatINR(d.due)} owed` : STATUS[d.status].label}</Badge>
                                                </div>
                                                <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </Card>
                    </section>
                </div>
            )}

            {addingSupplier && (
                <SupplierModal api={api} onClose={() => setAddingSupplier(false)}
                    onSaved={(s) => { setSuppliers((list) => [...list, s].sort((a, b) => a.name.localeCompare(b.name))); setSupplier(String(s.id)) }} />
            )}
            {openId && <DeliveryModal api={api} id={openId} onClose={() => setOpenId(null)} onChanged={() => loadDeliveries().catch(() => {})} />}
        </AdminLayout>
    )
}

// Choose or photograph the supplier's receipt. On a phone this offers the camera.
function ReceiptPicker({ file, onChange }) {
    const inputRef = useRef(null)
    const preview = useMemo(() => (file && file.type.startsWith('image/') ? URL.createObjectURL(file) : null), [file])
    useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])

    return (
        <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Supplier's receipt</p>
            <input ref={inputRef} type="file" accept="image/*,application/pdf" className="sr-only" aria-label="Receipt file"
                onChange={(e) => { onChange(e.target.files[0] || null); e.target.value = '' }} />
            {file ? (
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-2.5">
                    {preview
                        ? <img src={preview} alt="Receipt preview" className="h-14 w-14 rounded-lg object-cover" />
                        : <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-slate-100 text-slate-500"><FileText className="h-6 w-6" /></span>}
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900">{file.name}</p>
                        <p className="text-xs text-slate-500">{Math.max(1, Math.round(file.size / 1024))} KB</p>
                    </div>
                    <Button variant="ghost" size="icon" aria-label="Remove receipt" onClick={() => onChange(null)}><X className="h-4 w-4" /></Button>
                </div>
            ) : (
                <button type="button" onClick={() => inputRef.current && inputRef.current.click()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 px-4 py-5 text-sm font-medium text-slate-600 transition hover:border-brand-400 hover:bg-brand-50/40">
                    <Camera className="h-4 w-4" /> Take a photo or choose a file
                </button>
            )}
            <p className="mt-2 text-xs text-slate-500">Photo or PDF, up to 10 MB. Only managers and stock keepers can see it.</p>
        </div>
    )
}

// One delivery: items with batches, the receipt, and paying what's owed.
function DeliveryModal({ api, id, onClose, onChanged }) {
    const [d, setD] = useState(null)
    const [error, setError] = useState('')
    const [receiptUrl, setReceiptUrl] = useState(null)
    const [amount, setAmount] = useState('')
    const [busy, setBusy] = useState(false)
    const fileRef = useRef(null)

    useEffect(() => {
        api.get(`purchases/${id}/`).then(setD).catch((e) => setError(errorText(e)))
    }, [api, id])

    // Receipts are private, so they are fetched with the login and shown from memory.
    useEffect(() => {
        if (!d || !d.receipt) return undefined
        let url
        api.blob(`purchases/${id}/receipt/`).then((blob) => { url = URL.createObjectURL(blob); setReceiptUrl(url) }).catch(() => {})
        return () => { if (url) URL.revokeObjectURL(url) }
    }, [api, id, d && d.receipt]) // eslint-disable-line react-hooks/exhaustive-deps

    const updated = (next) => { setD(next); setError(''); onChanged() }

    const pay = (e) => {
        e.preventDefault()
        setBusy(true)
        api.post(`purchases/${id}/pay/`, { amount })
            .then((next) => { updated(next); setAmount('') })
            .catch((err) => setError(errorText(err)))
            .finally(() => setBusy(false))
    }

    const uploadReceipt = (file) => {
        if (!file) return
        const form = new FormData()
        form.append('receipt', file)
        setBusy(true)
        setReceiptUrl(null)
        api.postForm(`purchases/${id}/receipt/`, form)
            .then(updated)
            .catch((err) => setError(errorText(err)))
            .finally(() => setBusy(false))
    }

    return (
        <Modal show onClose={onClose} title={d ? `Delivery #${d.id}` : 'Delivery'} size="lg">
            {!d ? (error ? <Alert variant="danger">{error}</Alert> : <Spinner />) : (
                <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                        <Info label="Supplier" value={d.supplier || 'Not recorded'} />
                        <Info label="Invoice" value={d.invoice_no || '—'} />
                        <Info label="Delivered" value={showDate(d.received_on)} />
                        <Info label="Received by" value={d.received_by || '—'} />
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-left text-xs text-slate-500">
                                <tr><th className="px-3 py-2 font-medium">Item</th><th className="px-3 py-2 font-medium">Batch</th><th className="px-3 py-2 text-right font-medium">Received</th><th className="px-3 py-2 text-right font-medium">Left</th><th className="px-3 py-2 text-right font-medium">Price</th><th className="px-3 py-2 font-medium">Expiry</th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {d.items.map((i, n) => (
                                    <tr key={n}>
                                        <td className="px-3 py-2 font-medium text-slate-900">{i.name}</td>
                                        <td className="px-3 py-2 text-slate-600">{i.batch_no || '—'}</td>
                                        <td className="px-3 py-2 text-right">{i.qty} {i.unit}</td>
                                        <td className={cn('px-3 py-2 text-right font-semibold', i.remaining > 0 ? 'text-slate-900' : 'text-slate-400')}>{i.remaining > 0 ? i.remaining : 'Sold'}</td>
                                        <td className="px-3 py-2 text-right">{formatINR(i.unit_cost)}</td>
                                        <td className="px-3 py-2 text-slate-600">{i.expiry_date ? showDate(i.expiry_date) : '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                        <div className="rounded-xl bg-slate-50 p-4 text-sm">
                            <div className="flex justify-between"><span className="text-slate-600">Total</span><span className="font-semibold">{formatINR(d.total_cost)}</span></div>
                            <div className="mt-1 flex justify-between"><span className="text-slate-600">Paid</span><span>{formatINR(d.amount_paid)}</span></div>
                            <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2">
                                <span className="font-medium text-slate-900">Owed</span>
                                {d.due > 0 ? <span className="font-bold text-rose-700">{formatINR(d.due)}</span> : <Badge variant="green">Paid in full</Badge>}
                            </div>
                            {d.due > 0 && (
                                <form onSubmit={pay} className="mt-3 flex gap-2">
                                    <Input type="number" min="0" step="0.01" max={d.due} value={amount} onChange={(e) => setAmount(e.target.value)}
                                        placeholder="Amount paid" aria-label="Amount paid to supplier" className="!h-10" required />
                                    <Button type="button" variant="secondary" size="sm" className="!h-10" onClick={() => setAmount(String(d.due))}>All</Button>
                                    <Button type="submit" size="sm" className="!h-10" disabled={busy}>Record</Button>
                                </form>
                            )}
                        </div>

                        <div>
                            <div className="mb-2 flex items-center justify-between">
                                <p className="text-sm font-medium text-slate-700">Receipt</p>
                                <input ref={fileRef} type="file" accept="image/*,application/pdf" className="sr-only" aria-label="Upload receipt"
                                    onChange={(e) => { uploadReceipt(e.target.files[0]); e.target.value = '' }} />
                                <Button variant="ghost" size="sm" disabled={busy} onClick={() => fileRef.current && fileRef.current.click()}>
                                    <Paperclip className="h-3.5 w-3.5" /> {d.receipt ? 'Replace' : 'Attach'}
                                </Button>
                            </div>
                            {!d.receipt ? (
                                <p className="rounded-xl border-2 border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">No receipt attached.</p>
                            ) : !receiptUrl ? <Spinner /> : d.receipt === 'image' ? (
                                <a href={receiptUrl} target="_blank" rel="noreferrer" title="Open full size">
                                    <img src={receiptUrl} alt={`Receipt for delivery ${d.id}`} className="max-h-64 w-full rounded-xl border border-slate-200 object-contain" />
                                </a>
                            ) : (
                                <a href={receiptUrl} target="_blank" rel="noreferrer"
                                    className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 text-sm font-medium text-slate-800 hover:bg-slate-50">
                                    <FileText className="h-6 w-6 text-slate-500" /> Open the receipt (PDF) <ExternalLink className="ml-auto h-4 w-4 text-slate-400" />
                                </a>
                            )}
                        </div>
                    </div>

                    {d.note && <p className="text-sm text-slate-600"><span className="font-medium">Note:</span> {d.note}</p>}
                    {error && <Alert variant="danger">{error}</Alert>}
                    <p className="text-xs text-slate-400">Saved {formatDateTime(d.createdAt)}</p>
                </div>
            )}
        </Modal>
    )
}

function Info({ label, value }) {
    return (
        <div>
            <p className="text-xs text-slate-500">{label}</p>
            <p className="truncate font-medium text-slate-900">{value}</p>
        </div>
    )
}

function SupplierModal({ api, onClose, onSaved }) {
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [address, setAddress] = useState('')
    const [error, setError] = useState('')
    const [saving, setSaving] = useState(false)

    const save = (e) => {
        e.preventDefault()
        setSaving(true)
        api.post('suppliers/', { name, phone, address })
            .then((s) => { onSaved(s); onClose() })
            .catch((err) => { setError(errorText(err)); setSaving(false) })
    }

    return (
        <Modal show onClose={onClose} title="New supplier">
            <form onSubmit={save} className="space-y-4">
                <Field label="Name" id="sname"><Input id="sname" value={name} onChange={(e) => setName(e.target.value)} required placeholder="For example Sreemangal Tea Garden" /></Field>
                <Field label="Phone" id="sphone"><Input id="sphone" value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
                <Field label="Address" id="saddress"><Input id="saddress" value={address} onChange={(e) => setAddress(e.target.value)} /></Field>
                {error && <Alert variant="danger">{error}</Alert>}
                <Button type="submit" block disabled={saving}>{saving ? 'Saving…' : 'Add supplier'}</Button>
            </form>
        </Modal>
    )
}

export default ReceiveStockScreen
