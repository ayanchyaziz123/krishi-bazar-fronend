import React, { useEffect, useMemo, useState } from 'react'
import { Printer, Store, Globe, TrendingUp, Banknote, Smartphone, CreditCard, Wallet, Clock, ReceiptText, Undo2, Ban, Minus, Plus, Search } from 'lucide-react'
import AdminLayout from '../../admin_components/AdminLayout'
import { Alert, Badge, Button, Card, CardHeader, Field, Input, Modal, Spinner, Table, Td, Th, cn, formatINR } from '../../components/ui'
import Receipt, { RefundReceipt } from '../../inventory/Receipt'
import { useAdminGuard, inventoryApi, errorText, todayInDhaka, formatTime, formatDateTime } from '../../inventory/api'

const TABS = [['all', 'All'], ['shop', 'Counter'], ['online', 'Online']]
const STATUS_TONE = {
    paid: 'green', due: 'amber', placed: 'slate', confirmed: 'sky', packed: 'sky', out_for_delivery: 'amber',
    ready_for_pickup: 'amber', delivered: 'green', cancelled: 'red', returned: 'amber', voided: 'red', return: 'red', void: 'red',
}
const PAYMENT_ROWS = [['cash', 'Cash', Banknote], ['upi', 'UPI', Smartphone], ['card', 'Card', CreditCard],
    ['online', 'Paid online', Globe], ['other', 'Other', Wallet], ['due', 'Still owed', Clock]]

// One day of sales across every channel, like a POS report: the counter and the website
// together, how the money came in, best sellers and what is still owed.
function SalesScreen({ history }) {
    const { userInfo, isAdmin } = useAdminGuard(history)
    const api = useMemo(() => inventoryApi(userInfo), [userInfo])

    const [date, setDate] = useState(todayInDhaka())
    const [summary, setSummary] = useState(null)
    const [rows, setRows] = useState([])
    const [dues, setDues] = useState([])
    const [tab, setTab] = useState('all')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [receipt, setReceipt] = useState(null)
    const [collecting, setCollecting] = useState(null)
    const [returning, setReturning] = useState(false)
    const [voiding, setVoiding] = useState(false)
    const [refundDone, setRefundDone] = useState(null)   // { return, sale } after a return or void
    const [findBill, setFindBill] = useState('')

    const load = () => {
        setLoading(true)
        Promise.all([api.get(`summary/?date=${date}`), api.get(`transactions/?date=${date}`), api.get('dues/')])
            .then(([s, list, d]) => { setSummary(s); setRows(list.transactions); setDues(d); setError('') })
            .catch((e) => setError(errorText(e)))
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        if (isAdmin && date) load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAdmin, date])

    const openReceipt = (id) => api.get(`sales/${id}/`).then(setReceipt).catch((e) => setError(errorText(e)))
    const open = (r) => (r.kind === 'online' ? history.push(`/admin/order/${r.id}`) : openReceipt(r.kind === 'refund' ? r.sale : r.id))
    const afterRefund = (result) => { setReturning(false); setVoiding(false); setReceipt(null); setRefundDone(result); load() }
    const canReturn = receipt && !receipt.voided && receipt.items.some((i) => i.returnable > 0)

    // ?bill=12 opens that bill (the counter's "Returns" link uses it).
    useEffect(() => {
        const bill = new URLSearchParams(history.location.search).get('bill')
        if (isAdmin && bill) openReceipt(bill)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAdmin])

    const isToday = date === todayInDhaka()
    const showProfit = Boolean(summary && summary.shop && summary.shop.profit !== undefined)
    const shown = rows.filter((r) => tab === 'all' || r.kind === tab)
    const payments = (summary && summary.payments) || {}
    const paymentMax = Math.max(1, ...PAYMENT_ROWS.map(([key]) => payments[key] || 0))

    return (
        <AdminLayout
            title="Sales and reports"
            subtitle="Everything sold in one day: the shop counter and the online shop together."
            action={(
                <div className="flex flex-wrap gap-2">
                    <form onSubmit={(e) => { e.preventDefault(); if (findBill.trim()) openReceipt(findBill.trim().replace(/^#/, '')) }} className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input value={findBill} onChange={(e) => setFindBill(e.target.value)} placeholder="Find bill #" inputMode="numeric" className="!w-36 pl-9" aria-label="Find a bill by number" />
                    </form>
                    <Input type="date" value={date} max={todayInDhaka()} onChange={(e) => setDate(e.target.value)} className="!w-44" aria-label="Report date" />
                </div>
            )}
        >
            {error && <Alert variant="danger" className="mb-4">{error}</Alert>}
            {loading && !summary ? <Spinner /> : summary && (
                <div className="space-y-6">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <Stat icon={ReceiptText} label={isToday ? 'Total sales today' : 'Total sales'} value={formatINR(summary.all.total)}
                            note={`${summary.all.count} sale${summary.all.count === 1 ? '' : 's'}, counter and online`} />
                        <Stat icon={Store} label="Counter" value={formatINR(summary.shop.total)}
                            note={`${summary.shop.count} bills · ${formatINR(summary.shop.collected)} collected${summary.shop.refunds > 0 ? ` · ${formatINR(summary.shop.refunds)} refunded` : ''}`} />
                        <Stat icon={Globe} label="Online" value={formatINR(summary.online.total)}
                            note={`${summary.online.count} orders · ${summary.online.delivery_count} delivery, ${summary.online.pickup_count} pick-up`} />
                        {/* Profit and costs are only sent to managers. */}
                        {showProfit ? (
                            <Stat icon={TrendingUp} label="Profit" value={formatINR(summary.shop.profit + summary.online.profit)}
                                note={`Counter ${formatINR(summary.shop.profit)} · Online ${formatINR(summary.online.profit)}${summary.wastage_cost > 0 ? ` · Wastage ${formatINR(summary.wastage_cost)}` : ''}`} />
                        ) : (
                            <Stat icon={Clock} label="Still owed" value={formatINR(payments.due || 0)} note="Bills on credit and unpaid orders" />
                        )}
                    </div>
                    {summary.cancelled && summary.cancelled.count > 0 && (
                        <Alert variant="info">
                            {summary.cancelled.count} online order{summary.cancelled.count === 1 ? ' was' : 's were'} cancelled this day
                            {summary.cancelled.refunded > 0 ? ` (${formatINR(summary.cancelled.refunded)} refunded)` : ''}. Cancelled orders are listed but not counted as sales.
                        </Alert>
                    )}
                    {summary.missing_cost_price > 0 && (
                        <Alert variant="info">
                            {summary.missing_cost_price} items have no buying price, so profit on them counts the full selling price.
                            Set buying prices on the Stock page or by receiving stock.
                        </Alert>
                    )}

                    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
                        <div className="min-w-0">
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                                <h2 className="font-semibold text-slate-900">Transactions</h2>
                                <div className="flex gap-1 rounded-lg bg-slate-100 p-1 text-sm">
                                    {TABS.map(([key, label]) => (
                                        <button key={key} type="button" onClick={() => setTab(key)} aria-pressed={tab === key}
                                            className={cn('rounded-md px-3 py-1 font-medium transition', tab === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900')}>
                                            {label} <span className="text-slate-400">{key === 'all' ? rows.length : rows.filter((r) => r.kind === key).length}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <Table>
                                <thead>
                                    <tr>
                                        <Th>Sale</Th><Th>Time</Th><Th>Channel</Th><Th>Customer</Th><Th>Payment</Th><Th>Status</Th>
                                        <Th className="text-right">Total</Th>{showProfit && <Th className="text-right">Profit</Th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {shown.map((r) => (
                                        <tr key={`${r.kind}-${r.id}`} onClick={() => open(r)} className={cn('cursor-pointer hover:bg-slate-50/60', !r.counted && 'opacity-60')}>
                                            <Td className="whitespace-nowrap font-semibold text-slate-900">
                                                {r.kind === 'refund' ? <span className="text-rose-600">{r.status === 'void' ? 'Void' : 'Refund'} · bill #{r.sale}</span> : `${r.kind === 'shop' ? 'Bill' : 'Order'} #${r.id}`}
                                                {r.entered_later && <span className="ml-1.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800" title="Typed in later from a paper record">Entered later</span>}
                                            </Td>
                                            <Td>{formatTime(r.createdAt)}</Td>
                                            <Td>
                                                <span className="inline-flex items-center gap-1.5 text-slate-700">
                                                    {r.kind === 'shop' ? <Store className="h-4 w-4 text-slate-400" /> : <Globe className="h-4 w-4 text-sky-500" />} {r.channel.replace('Online · ', '')}
                                                </span>
                                            </Td>
                                            <Td>{r.customer || <span className="text-slate-400">{r.kind === 'online' ? 'Customer' : 'Walk-in'}</span>}</Td>
                                            <Td>{r.payment}</Td>
                                            <Td>
                                                <Badge variant={STATUS_TONE[r.status] || 'slate'}>{r.status === 'due' ? `Due ${formatINR(r.due)}` : r.status_label}</Badge>
                                            </Td>
                                            <Td className={cn('text-right font-semibold', !r.counted && 'line-through', r.total < 0 && 'text-rose-600')}>{r.total < 0 ? `−${formatINR(-r.total)}` : formatINR(r.total)}</Td>
                                            {showProfit && <Td className={cn('text-right', r.profit < 0 && 'text-rose-600')}>{r.counted ? (r.profit < 0 ? `−${formatINR(-r.profit)}` : formatINR(r.profit)) : '–'}</Td>}
                                        </tr>
                                    ))}
                                    {shown.length === 0 && (
                                        <tr><Td colSpan={8} className="py-10 text-center text-slate-500">No {tab === 'shop' ? 'counter sales' : tab === 'online' ? 'online orders' : 'sales'} on this day.</Td></tr>
                                    )}
                                </tbody>
                            </Table>
                            <p className="mt-2 text-xs text-slate-400">Click a counter bill for its receipt, or an online order to open it.</p>
                        </div>

                        <div className="space-y-6">
                            <Card>
                                <CardHeader title="Payments" subtitle="How the money came in" />
                                <ul className="space-y-2.5 px-6 pb-5 text-sm">
                                    {PAYMENT_ROWS.filter(([key]) => payments[key] > 0 || ['cash', 'upi', 'card', 'online'].includes(key)).map(([key, label, Icon]) => (
                                        <li key={key}>
                                            <div className="flex items-center justify-between">
                                                <span className="flex items-center gap-2 text-slate-600"><Icon className="h-4 w-4 text-slate-400" /> {label}</span>
                                                <span className={cn('font-semibold', key === 'due' ? 'text-amber-700' : 'text-slate-900')}>{formatINR(payments[key] || 0)}</span>
                                            </div>
                                            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                                                <div className={cn('h-full rounded-full', key === 'due' ? 'bg-amber-400' : 'bg-brand-500')} style={{ width: `${((payments[key] || 0) / paymentMax) * 100}%` }} />
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </Card>

                            <Card>
                                <CardHeader title="Best sellers" subtitle="Counter and online together" />
                                {summary.top_items.length === 0 ? <p className="px-6 py-4 text-sm text-slate-500">Nothing sold yet.</p> : (
                                    <ol className="divide-y divide-slate-100 text-sm">
                                        {summary.top_items.map((t, i) => (
                                            <li key={i} className="flex justify-between px-6 py-2.5">
                                                <span>{t.name}</span><span className="font-semibold">{t.qty} {t.unit}</span>
                                            </li>
                                        ))}
                                    </ol>
                                )}
                            </Card>

                            <Card>
                                <CardHeader title="Unpaid bills" subtitle={`${formatINR(summary.dues.total)} owed in total`} />
                                {dues.length === 0 ? <p className="px-6 py-4 text-sm text-slate-500">Nobody owes anything.</p> : (
                                    <ul className="divide-y divide-slate-100 text-sm">
                                        {dues.map((d) => (
                                            <li key={d.id} className="flex items-center justify-between gap-2 px-6 py-2.5">
                                                <div>
                                                    <p className="font-semibold text-slate-900">{d.customer_name}</p>
                                                    <p className="text-xs text-slate-500">{d.customer_phone} · bill #{d.id} · {formatDateTime(d.createdAt)}</p>
                                                </div>
                                                <Button size="sm" variant="secondary" onClick={() => setCollecting(d)}>{formatINR(d.due)}</Button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </Card>
                        </div>
                    </div>
                </div>
            )}

            <Modal show={Boolean(receipt) && !returning && !voiding} onClose={() => setReceipt(null)} title={receipt ? `Bill #${receipt.id}` : ''}>
                <Receipt sale={receipt} />
                <div className="mt-5 grid gap-2">
                    <Button block variant="secondary" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print receipt</Button>
                    {canReturn && (
                        <div className="grid grid-cols-2 gap-2">
                            <Button variant="secondary" onClick={() => setReturning(true)}><Undo2 className="h-4 w-4" /> Return items</Button>
                            {showProfit && <Button variant="danger-soft" onClick={() => setVoiding(true)}><Ban className="h-4 w-4" /> Void bill</Button>}
                        </div>
                    )}
                </div>
            </Modal>

            {receipt && returning && <ReturnModal api={api} sale={receipt} onClose={() => setReturning(false)} onDone={afterRefund} />}
            {receipt && voiding && <VoidModal api={api} sale={receipt} onClose={() => setVoiding(false)} onDone={afterRefund} />}

            <Modal show={Boolean(refundDone)} onClose={() => setRefundDone(null)} title={refundDone ? (refundDone.return.kind === 'void' ? 'Bill voided' : 'Return done') : ''}>
                {refundDone && <RefundReceipt refund={refundDone.return} sale={refundDone.sale} />}
                <Button block variant="secondary" className="mt-5" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print refund slip</Button>
            </Modal>

            {collecting && <CollectModal api={api} sale={collecting} onClose={() => setCollecting(null)} onSaved={load} />}
        </AdminLayout>
    )
}

function Stat({ icon: Icon, label, value, note }) {
    return (
        <Card className="p-4">
            <div className="flex items-center justify-between gap-2">
                <p className="text-[13px] font-medium text-slate-500">{label}</p>
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-500"><Icon className="h-3.5 w-3.5" /></span>
            </div>
            <p className="figure mt-2 text-[26px] font-semibold leading-tight text-slate-900">{value}</p>
            {note && <p className="mt-1 text-xs text-slate-500">{note}</p>}
        </Card>
    )
}

// What a return gives back, worked out the same way as the server: each line's share of
// the price paid (after any bill discount); money only for what was paid beyond what is owed.
function refundPreview(sale, picked) {
    const share = Number(sale.subtotal) ? Number(sale.total) / Number(sale.subtotal) : 1
    const everything = sale.items.every((i) => Number(i.returnable) === Number(picked[i.id] || 0))
    let value = sale.items.reduce((n, i) => n + Math.round(Number(i.unit_price) * Number(picked[i.id] || 0) * share * 100) / 100, 0)
    if (everything) value = Number(sale.total) - Number(sale.returned)
    const refund = Math.max(Number(sale.amount_paid) - (Number(sale.total) - Number(sale.returned) - value), 0)
    return { value: Math.round(value * 100) / 100, refund: Math.round(refund * 100) / 100 }
}

const REFUND_METHODS = [['cash', 'Cash'], ['upi', 'UPI'], ['card', 'Card']]

function ReturnModal({ api, sale, onClose, onDone }) {
    const returnable = sale.items.filter((i) => i.returnable > 0)
    const [picked, setPicked] = useState({})
    const [restock, setRestock] = useState(true)
    const [reason, setReason] = useState('')
    const [method, setMethod] = useState(['cash', 'upi', 'card'].includes(sale.payment_method) ? sale.payment_method : 'cash')
    const [error, setError] = useState('')
    const [saving, setSaving] = useState(false)
    const loose = (i) => !Number.isInteger(Number(i.qty)) || ['kg', 'g', 'litre', 'l'].includes((i.unit || '').toLowerCase())
    const setQty = (i, q) => setPicked((p) => ({ ...p, [i.id]: Math.max(0, Math.min(Number(i.returnable), Math.round(q * 1000) / 1000)) }))
    const { value, refund } = refundPreview(sale, picked)
    const anything = Object.values(picked).some((q) => q > 0)

    const save = (e) => {
        e.preventDefault()
        setSaving(true)
        setError('')
        api.post(`sales/${sale.id}/return/`, {
            items: Object.entries(picked).filter(([, q]) => q > 0).map(([item, qty]) => ({ item: Number(item), qty })),
            restock, reason, refund_method: method,
        }).then(onDone).catch((err) => { setError(errorText(err)); setSaving(false) })
    }

    return (
        <Modal show onClose={onClose} title={`Return items from bill #${sale.id}`}>
            <form onSubmit={save} className="space-y-4">
                <ul className="divide-y divide-slate-100 rounded-xl ring-1 ring-slate-200">
                    {returnable.map((i) => {
                        const q = picked[i.id] || 0
                        const step = loose(i) ? 0.25 : 1
                        return (
                            <li key={i.id} className="flex items-center gap-3 px-3 py-2.5">
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-slate-900">{i.name}</p>
                                    <p className="text-xs text-slate-500">{formatINR(i.unit_price)} each · {Number(i.returnable)} {i.unit} can be returned</p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button type="button" variant="secondary" size="icon" className="!h-8 !w-8" aria-label={`Fewer ${i.name}`} disabled={q <= 0} onClick={() => setQty(i, q - step)}><Minus className="h-3.5 w-3.5" /></Button>
                                    <Input type="number" inputMode="decimal" min="0" max={i.returnable} step={step} value={q} onChange={(e) => setQty(i, Number(e.target.value) || 0)}
                                        className="!h-8 !w-16 text-center" aria-label={`How many ${i.name} come back`} />
                                    <Button type="button" variant="secondary" size="icon" className="!h-8 !w-8" aria-label={`More ${i.name}`} disabled={q >= i.returnable} onClick={() => setQty(i, q + step)}><Plus className="h-3.5 w-3.5" /></Button>
                                    <Button type="button" variant="ghost" size="sm" onClick={() => setQty(i, Number(i.returnable))}>All</Button>
                                </div>
                            </li>
                        )
                    })}
                </ul>
                <label className="flex items-start gap-2.5 text-sm text-slate-700">
                    <input type="checkbox" checked={restock} onChange={(e) => setRestock(e.target.checked)} className="mt-0.5 accent-brand-600" />
                    <span>Put the items back on the shelf<span className="block text-xs text-slate-500">Untick for damaged or opened items that can't be sold again.</span></span>
                </label>
                <Field label="Reason (optional)" id="return-reason">
                    <Input id="return-reason" maxLength={200} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. wrong item, damaged, changed mind" />
                </Field>
                {anything && (
                    <div className="rounded-xl bg-slate-50 p-3 text-sm">
                        <p className="flex justify-between"><span className="text-slate-600">Value of items returned</span><strong>{formatINR(value)}</strong></p>
                        {value > refund && <p className="flex justify-between"><span className="text-slate-600">Taken off what {sale.customer_name || 'the customer'} owes</span><strong>{formatINR(value - refund)}</strong></p>}
                        {refund > 0 && (
                            <>
                                <p className="mt-1 flex justify-between text-base"><span className="font-semibold">Give back</span><strong className="text-rose-600">{formatINR(refund)}</strong></p>
                                <div className="mt-2 grid grid-cols-3 gap-1.5" role="radiogroup" aria-label="Refund by">
                                    {REFUND_METHODS.map(([key, label]) => (
                                        <button key={key} type="button" role="radio" aria-checked={method === key} onClick={() => setMethod(key)}
                                            className={cn('h-9 rounded-lg text-sm font-semibold ring-1', method === key ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white text-slate-700 ring-slate-200')}>
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}
                {error && <Alert variant="danger">{error}</Alert>}
                <Button type="submit" block disabled={saving || !anything}>{saving ? 'Saving…' : refund > 0 ? `Refund ${formatINR(refund)}` : 'Record the return'}</Button>
            </form>
        </Modal>
    )
}

function VoidModal({ api, sale, onClose, onDone }) {
    const [reason, setReason] = useState('')
    const [error, setError] = useState('')
    const [saving, setSaving] = useState(false)
    const all = Object.fromEntries(sale.items.map((i) => [i.id, Number(i.returnable)]))
    const { refund } = refundPreview(sale, all)
    const method = ['cash', 'upi', 'card'].includes(sale.payment_method) ? sale.payment_method : 'cash'
    const save = (e) => {
        e.preventDefault()
        setSaving(true)
        api.post(`sales/${sale.id}/void/`, { reason, refund_method: method }).then(onDone).catch((err) => { setError(errorText(err)); setSaving(false) })
    }
    return (
        <Modal show onClose={onClose} title={`Void bill #${sale.id}?`} size="sm">
            <form onSubmit={save} className="space-y-4">
                <p className="text-sm text-slate-600">
                    Everything still on the bill goes back on the shelf{refund > 0 ? ` and ${formatINR(refund)} is given back (${method.toUpperCase()})` : ''}. The bill stays in the records, marked VOID.
                </p>
                <Field label="Why is it being voided?" id="void-reason">
                    <Input id="void-reason" required maxLength={200} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. rang up twice" />
                </Field>
                {error && <Alert variant="danger">{error}</Alert>}
                <Button type="submit" block variant="danger" disabled={saving || !reason.trim()}>{saving ? 'Voiding…' : 'Void the bill'}</Button>
            </form>
        </Modal>
    )
}

function CollectModal({ api, sale, onClose, onSaved }) {
    const [amount, setAmount] = useState(String(sale.due))
    const [error, setError] = useState('')
    const [saving, setSaving] = useState(false)

    const save = (e) => {
        e.preventDefault()
        setSaving(true)
        api.post(`sales/${sale.id}/collect/`, { amount })
            .then(() => { onSaved(); onClose() })
            .catch((err) => { setError(errorText(err)); setSaving(false) })
    }

    return (
        <Modal show onClose={onClose} title={`Collect from ${sale.customer_name}`}>
            <form onSubmit={save} className="space-y-4">
                <p className="text-sm text-slate-600">Bill #{sale.id} for {formatINR(sale.total)}. Still due: <strong>{formatINR(sale.due)}</strong></p>
                <Field label="Amount received" id="amount">
                    <Input id="amount" type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                </Field>
                {error && <Alert variant="danger">{error}</Alert>}
                <Button type="submit" block disabled={saving}>{saving ? 'Saving…' : 'Record payment'}</Button>
            </form>
        </Modal>
    )
}

export default SalesScreen
