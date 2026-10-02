import React, { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2, UserPlus } from 'lucide-react'
import AdminLayout from '../../admin_components/AdminLayout'
import { Alert, Button, Card, CardHeader, Field, Input, Modal, Select, Spinner, formatTk } from '../../components/ui'
import { useAdminGuard, inventoryApi, errorText, formatDateTime } from '../../inventory/api'

const emptyLine = () => ({ key: Math.random(), product: '', qty: '', unit_cost: '', expiry_date: '' })

// Record a delivery from a farmer or supplier. Stock goes up and the buying price is updated.
function ReceiveStockScreen({ history }) {
    const { userInfo, isAdmin } = useAdminGuard(history)
    const api = useMemo(() => inventoryApi(userInfo), [userInfo])

    const [products, setProducts] = useState([])
    const [suppliers, setSuppliers] = useState([])
    const [recent, setRecent] = useState([])
    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState('')

    const [supplier, setSupplier] = useState('')
    const [invoiceNo, setInvoiceNo] = useState('')
    const [note, setNote] = useState('')
    const [lines, setLines] = useState([emptyLine()])
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [addingSupplier, setAddingSupplier] = useState(false)

    const load = () => {
        Promise.all([api.get('products/'), api.get('suppliers/'), api.get('purchases/')])
            .then(([p, s, r]) => { setProducts(p); setSuppliers(s); setRecent(r); setLoadError('') })
            .catch((e) => setLoadError(errorText(e)))
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        if (isAdmin) load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAdmin])

    const productById = (id) => products.find((p) => String(p._id) === String(id))

    const updateLine = (key, changes) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...changes } : l)))

    const pickProduct = (key, id) => {
        const p = productById(id)
        updateLine(key, { product: id, unit_cost: p && p.cost_price !== null ? String(p.cost_price) : '' })
    }

    const total = lines.reduce((sum, l) => sum + (Number(l.qty) || 0) * (Number(l.unit_cost) || 0), 0)

    const save = (e) => {
        e.preventDefault()
        setError('')
        setSuccess('')
        const items = lines.filter((l) => l.product)
        if (items.length === 0) {
            setError('Choose at least one item.')
            return
        }
        setSaving(true)
        api.post('purchases/', {
            supplier: supplier || null,
            invoice_no: invoiceNo,
            note,
            items: items.map(({ product, qty, unit_cost, expiry_date }) => ({ product, qty, unit_cost, expiry_date })),
        })
            .then((res) => {
                setSuccess(`Stock received. ${items.length} ${items.length === 1 ? 'item' : 'items'} added, costing ${formatTk(res.total_cost)} in total.`)
                setLines([emptyLine()]); setInvoiceNo(''); setNote(''); setSaving(false)
                load()
            })
            .catch((err) => { setError(errorText(err)); setSaving(false) })
    }

    return (
        <AdminLayout title="Receive stock" subtitle="Record goods delivered by a farmer or supplier.">
            {loading ? <Spinner /> : loadError ? <Alert variant="danger">{loadError}</Alert> : (
                <div className="space-y-8">
                    <Card>
                        <form onSubmit={save} className="space-y-5 p-5">
                            <div className="grid gap-4 sm:grid-cols-3">
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
                                <Field label="Note" id="note">
                                    <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" />
                                </Field>
                            </div>

                            <div className="space-y-3">
                                <div className="hidden grid-cols-[1fr_6rem_8rem_10rem_2.5rem] gap-3 text-xs font-semibold uppercase tracking-wider text-slate-500 md:grid">
                                    <span>Item</span><span>Quantity</span><span>Buying price</span><span>Expiry date</span><span />
                                </div>
                                {lines.map((l) => {
                                    const p = productById(l.product)
                                    return (
                                        <div key={l.key} className="grid gap-2 rounded-xl bg-slate-50 p-3 md:grid-cols-[1fr_6rem_8rem_10rem_2.5rem] md:gap-3 md:bg-transparent md:p-0">
                                            <Select value={l.product} onChange={(e) => pickProduct(l.key, e.target.value)} aria-label="Item">
                                                <option value="">Choose an item</option>
                                                {products.map((prod) => (
                                                    <option key={prod._id} value={prod._id}>{prod.name} ({prod.countInStock} {prod.unit} now)</option>
                                                ))}
                                            </Select>
                                            <Input type="number" min="1" step="1" value={l.qty} required={Boolean(l.product)}
                                                onChange={(e) => updateLine(l.key, { qty: e.target.value })}
                                                placeholder={p ? p.unit : 'Qty'} aria-label="Quantity" />
                                            <Input type="number" min="0" step="0.01" value={l.unit_cost} required={Boolean(l.product)}
                                                onChange={(e) => updateLine(l.key, { unit_cost: e.target.value })}
                                                placeholder="৳ per unit" aria-label="Buying price per unit" />
                                            <Input type="date" value={l.expiry_date}
                                                onChange={(e) => updateLine(l.key, { expiry_date: e.target.value })} aria-label="Expiry date" />
                                            <Button variant="ghost" size="icon" className="h-11 w-10" aria-label="Remove line"
                                                onClick={() => setLines((ls) => (ls.length > 1 ? ls.filter((x) => x.key !== l.key) : [emptyLine()]))}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )
                                })}
                                <Button variant="secondary" size="sm" onClick={() => setLines((ls) => [...ls, emptyLine()])}>
                                    <Plus className="h-3.5 w-3.5" /> Add another item
                                </Button>
                            </div>

                            <p className="text-xs text-slate-500">Leave expiry empty for goods that don't spoil, like handicrafts.</p>

                            {error && <Alert variant="danger">{error}</Alert>}
                            {success && <Alert variant="success">{success}</Alert>}

                            <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-lg font-bold text-slate-900">Total cost {formatTk(total)}</p>
                                <Button type="submit" size="lg" disabled={saving}>{saving ? 'Saving…' : 'Add to stock'}</Button>
                            </div>
                        </form>
                    </Card>

                    <Card>
                        <CardHeader title="Recent deliveries" />
                        {recent.length === 0 ? <p className="px-6 py-6 text-sm text-slate-500">Nothing received yet.</p> : (
                            <ul className="divide-y divide-slate-100">
                                {recent.map((r) => (
                                    <li key={r.id} className="px-6 py-3 text-sm">
                                        <div className="flex justify-between gap-3">
                                            <p className="font-semibold text-slate-900">
                                                {r.supplier || 'Supplier not recorded'}{r.invoice_no ? ` · memo ${r.invoice_no}` : ''}
                                            </p>
                                            <p className="font-semibold">{formatTk(r.total_cost)}</p>
                                        </div>
                                        <p className="text-slate-500">
                                            {formatDateTime(r.createdAt)} · {r.items.map((i) => `${i.qty} ${i.name}`).join(', ')}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Card>
                </div>
            )}

            {addingSupplier && (
                <SupplierModal api={api} onClose={() => setAddingSupplier(false)}
                    onSaved={(s) => { setSuppliers((list) => [...list, s].sort((a, b) => a.name.localeCompare(b.name))); setSupplier(String(s.id)) }} />
            )}
        </AdminLayout>
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
