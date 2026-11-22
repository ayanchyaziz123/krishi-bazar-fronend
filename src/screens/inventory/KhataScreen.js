import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Banknote, BookUser, CreditCard, MessageCircle, Phone, Printer, Search, Smartphone, Wallet } from 'lucide-react'
import AdminLayout from '../../admin_components/AdminLayout'
import { Alert, Badge, Button, Card, CardHeader, EmptyState, Field, Input, Modal, Spinner, Table, Td, Th, cn, formatINR } from '../../components/ui'
import { useAdminGuard, inventoryApi, errorText } from '../../inventory/api'
import { isManagerRole, roleOf } from '../../admin_components/roles'
import { useStoreBrand } from '../../components/storeBrand'
import { formatPhone } from './CustomerPicker'
import Receipt from '../../inventory/Receipt'

const METHODS = [['cash', 'Cash', Banknote], ['upi', 'UPI', Smartphone], ['card', 'Card', CreditCard]]

const shortDate = (iso) => (iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }) : '')
const daysSince = (iso) => (iso ? Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)) : 0)
const ago = (iso) => { const d = daysSince(iso); return d === 0 ? 'today' : d === 1 ? '1 day' : `${d} days` }

// A WhatsApp chat with the customer, with the message typed in. Indian numbers get +91.
const whatsapp = (phone, text) => `https://wa.me/${phone && phone.length === 10 ? `91${phone}` : phone}?text=${encodeURIComponent(text)}`

const reminderText = (c, shop) =>
    `Hello${c.name ? ` ${c.name}` : ''}, a friendly reminder from ${shop}: ${formatINR(c.owed)} is due on your account` +
    `${c.bills_owing > 1 ? ` (${c.bills_owing} bills)` : ''}${c.owing_since ? ` since ${shortDate(c.owing_since)}` : ''}. ` +
    'You can pay by cash or UPI at the shop. Thank you!'

// The khata (udhaar book): everyone who owes the shop money, and each customer's own page
// with their bills, what they paid and a running balance.
function KhataScreen({ history, match }) {
    const { userInfo } = useAdminGuard(history)
    const api = useMemo(() => inventoryApi(userInfo), [userInfo])
    const id = match.params.id
    return id ? <CustomerKhata api={api} id={id} userInfo={userInfo} /> : <OwingList api={api} />
}

function OwingList({ api }) {
    const store = useStoreBrand()
    const [data, setData] = useState(null)
    const [query, setQuery] = useState('')
    const [error, setError] = useState('')
    const [collecting, setCollecting] = useState(null)

    const load = useCallback(() => {
        api.get(`customers/?owing=1${query.trim() ? `&q=${encodeURIComponent(query.trim())}` : ''}`)
            .then((d) => { setData(d); setError('') })
            .catch((e) => setError(errorText(e)))
    }, [api, query])

    useEffect(() => {
        const t = setTimeout(load, query ? 250 : 0)
        return () => clearTimeout(t)
    }, [load, query])

    return (
        <AdminLayout title="Khata (udhaar)" subtitle="People who owe the shop money. When someone pays, tap Take payment.">
            <div className="mb-4 grid gap-3 sm:grid-cols-3">
                <Card className="p-4">
                    <p className="text-sm text-slate-500">Total owed to the shop</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{data ? formatINR(data.total) : '…'}</p>
                </Card>
                <Card className="p-4">
                    <p className="text-sm text-slate-500">People who owe</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{data ? data.customers.length : '…'}</p>
                </Card>
                <div className="relative self-end sm:col-span-1">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find by name or phone" className="pl-10" aria-label="Find a customer" />
                </div>
            </div>

            {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

            <Card className="overflow-hidden rounded-xl">
                {!data ? <Spinner /> : data.customers.length === 0 ? (
                    <EmptyState icon={BookUser} title={query ? 'Nobody found' : 'Nobody owes anything'}>
                        {query ? 'Try another name or number.' : 'At the counter, turn on "Customer pays later" on a bill. The customer then shows here with what they owe.'}
                    </EmptyState>
                ) : (
                    <Table>
                        <thead><tr><Th>Customer</Th><Th className="text-right">Owes</Th><Th>Bills</Th><Th>Not paid for</Th><Th /></tr></thead>
                        <tbody className="divide-y divide-slate-100">
                            {data.customers.map((c) => (
                                <tr key={c.id} className="hover:bg-slate-50/60">
                                    <Td>
                                        <Link to={`/admin/khata/${c.id}`} className="font-medium text-slate-900 hover:text-brand-700 hover:underline">{c.name || 'No name'}</Link>
                                        <p className="text-xs text-slate-500">{formatPhone(c.phone)}</p>
                                    </Td>
                                    <Td className="text-right">
                                        <span className="font-semibold text-slate-900">{formatINR(c.owed)}</span>
                                        {c.credit_limit != null && c.owed >= c.credit_limit && <Badge variant="red" className="ml-2">Limit reached</Badge>}
                                    </Td>
                                    <Td className="text-slate-600">{c.bills_owing}</Td>
                                    <Td className={cn(daysSince(c.owing_since) > 30 ? 'font-semibold text-rose-600' : 'text-slate-600')}>{ago(c.owing_since)}</Td>
                                    <Td className="text-right">
                                        <div className="inline-flex flex-wrap justify-end gap-1.5">
                                            <Button size="sm" onClick={() => setCollecting(c)}><Wallet className="h-4 w-4" /> Take payment</Button>
                                            <Button size="sm" variant="secondary" href={whatsapp(c.phone, reminderText(c, store.name))} target="_blank" rel="noreferrer"
                                                aria-label={`Send ${c.name || 'customer'} a WhatsApp reminder`}>
                                                <MessageCircle className="h-4 w-4" /> Remind
                                            </Button>
                                        </div>
                                    </Td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                )}
            </Card>

            {collecting && <CollectModal api={api} customer={collecting} onClose={() => setCollecting(null)} onDone={load} />}
        </AdminLayout>
    )
}

function CustomerKhata({ api, id, userInfo }) {
    const store = useStoreBrand()
    const manager = isManagerRole(roleOf(userInfo))
    const [data, setData] = useState(null)
    const [error, setError] = useState('')
    const [collecting, setCollecting] = useState(false)
    const [editing, setEditing] = useState(false)
    const [bill, setBill] = useState(null)       // the bill opened from the history, with its items
    const [tab, setTab] = useState('all')
    const openBill = (saleId) => api.get(`sales/${saleId}/`).then(setBill).catch((e) => setError(errorText(e)))
    // A bill number that opens the bill.
    const BillLink = ({ id, children }) => (
        <button type="button" onClick={() => openBill(id)} className="font-semibold text-brand-700 underline decoration-brand-300 underline-offset-2 hover:decoration-brand-700" title="See the items on this bill">{children}</button>
    )

    const load = useCallback(() => {
        api.get(`customers/${id}/`).then((d) => { setData(d); setError('') }).catch((e) => setError(errorText(e)))
    }, [api, id])
    useEffect(load, [load])

    if (error && !data) return <AdminLayout title="Khata"><Alert variant="danger">{error}</Alert></AdminLayout>
    if (!data) return <Spinner />

    return (
        <AdminLayout
            title={data.name || formatPhone(data.phone)}
            subtitle={<Link to="/admin/khata" className="inline-flex items-center gap-1 text-brand-700 hover:underline"><ArrowLeft className="h-3.5 w-3.5" /> All khata</Link>}
            action={(
                <div className="flex flex-wrap gap-2">
                    {data.owed > 0 && <Button onClick={() => setCollecting(true)}><Wallet className="h-4 w-4" /> Take payment</Button>}
                    {data.owed > 0 && (
                        <Button variant="secondary" href={whatsapp(data.phone, reminderText(data, store.name))} target="_blank" rel="noreferrer">
                            <MessageCircle className="h-4 w-4" /> WhatsApp reminder
                        </Button>
                    )}
                    <Button variant="secondary" href={`tel:${data.phone}`}><Phone className="h-4 w-4" /> Call</Button>
                </div>
            )}
        >
            {error && <Alert variant="danger" className="mb-4">{error}</Alert>}
            <div className="mb-4 grid gap-3 sm:grid-cols-3">
                <Card className="p-4">
                    <p className="text-sm text-slate-500">Owes now</p>
                    <p className={cn('mt-1 text-2xl font-bold', data.owed > 0 ? 'text-amber-700' : 'text-emerald-700')}>{formatINR(data.owed)}</p>
                    <p className="text-xs text-slate-500">{data.owed > 0 ? `${data.bills_owing} bill${data.bills_owing === 1 ? '' : 's'}, since ${shortDate(data.owing_since)}` : 'All paid up'}</p>
                </Card>
                <Card className="p-4">
                    <p className="text-sm text-slate-500">Phone</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">{formatPhone(data.phone)}</p>
                </Card>
                <Card className="p-4">
                    <div className="flex items-start justify-between">
                        <p className="text-sm text-slate-500">Credit limit</p>
                        {manager && <button type="button" onClick={() => setEditing(true)} className="text-xs font-semibold text-brand-700 hover:underline">Change</button>}
                    </div>
                    <p className="mt-1 text-lg font-semibold text-slate-900">{data.credit_limit == null ? 'No limit' : formatINR(data.credit_limit)}</p>
                    {data.credit_limit != null && <p className="text-xs text-slate-500">{formatINR(Math.max(data.credit_limit - data.owed, 0))} more can be left owing</p>}
                </Card>
            </div>

            {/* The customer's bills: every bill, only the ones still owing, or the full history with payments. */}
            <Card className="overflow-hidden rounded-xl">
                <div className="flex gap-1 overflow-x-auto border-b border-slate-200 px-3" role="tablist">
                    {[['all', 'All bills', data.all_bills.length], ['owing', 'Not fully paid', data.bills.length], ['history', 'History with payments', null]].map(([key, label, n]) => (
                        <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => setTab(key)}
                            className={cn('-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition',
                                tab === key ? 'border-brand-600 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800')}>
                            {label}
                            {n != null && <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', key === 'owing' && n > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600')}>{n}</span>}
                        </button>
                    ))}
                </div>
                <p className="border-b border-slate-100 bg-slate-50/60 px-5 py-2 text-xs text-slate-500">
                    {tab === 'all' ? 'Every bill, newest first. Tap a bill number to see what was bought.'
                        : tab === 'owing' ? 'A payment clears the oldest bill first.' : 'Every bill and payment, oldest first, with what was owed after each.'}
                </p>

                {tab === 'all' && (data.all_bills.length === 0 ? <p className="px-5 py-6 text-sm text-slate-500">No bills yet.</p> : (
                    <Table>
                        <thead><tr><Th>Bill</Th><Th>Date</Th><Th>Items</Th><Th className="text-right">Total</Th><Th className="text-right">Paid</Th><Th className="text-right">Status</Th></tr></thead>
                        <tbody className="divide-y divide-slate-100">
                            {data.all_bills.map((b) => (
                                <tr key={b.id} className={cn(b.voided && 'opacity-60')}>
                                    <Td><BillLink id={b.id}>#{b.id}</BillLink></Td>
                                    <Td className="text-slate-600">{shortDate(b.date)}</Td>
                                    <Td className="text-slate-600">{b.lines} {b.lines === 1 ? 'item' : 'items'}</Td>
                                    <Td className={cn('text-right', b.voided && 'line-through')}>{formatINR(b.total - b.returned)}</Td>
                                    <Td className="text-right">{formatINR(b.paid)}</Td>
                                    <Td className="text-right">
                                        {b.voided ? <Badge variant="red">Voided</Badge>
                                            : b.due > 0 ? <Badge variant="amber">{formatINR(b.due)} owed</Badge>
                                                : <Badge variant="green">Paid</Badge>}
                                    </Td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                ))}

                {tab === 'owing' && (data.bills.length === 0 ? <p className="px-5 py-6 text-sm text-slate-500">Every bill is paid.</p> : (
                    <Table>
                        <thead><tr><Th>Bill</Th><Th>Date</Th><Th className="text-right">Total</Th><Th className="text-right">Paid</Th><Th className="text-right">Still owed</Th></tr></thead>
                        <tbody className="divide-y divide-slate-100">
                            {data.bills.map((b) => (
                                <tr key={b.id}>
                                    <Td><BillLink id={b.id}>#{b.id}</BillLink></Td>
                                    <Td className="text-slate-600">{shortDate(b.date)} <span className="text-xs text-slate-400">({ago(b.date)})</span></Td>
                                    <Td className="text-right">{formatINR(b.total - b.returned)}</Td>
                                    <Td className="text-right">{formatINR(b.paid)}</Td>
                                    <Td className="text-right font-semibold text-amber-700">{formatINR(b.due)}</Td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                ))}

                {tab === 'history' && (data.entries.length === 0 ? <p className="px-5 py-6 text-sm text-slate-500">No bills yet.</p> : (
                    <Table>
                        <thead><tr><Th>Date</Th><Th>What happened</Th><Th className="text-right">Bought</Th><Th className="text-right">Paid</Th><Th className="text-right">Owed after</Th></tr></thead>
                        <tbody className="divide-y divide-slate-100">
                            {data.entries.map((e, i) => (
                                <tr key={i}>
                                    <Td className="whitespace-nowrap text-slate-600">{shortDate(e.date)}</Td>
                                    <Td>
                                        {e.kind === 'bill'
                                            ? <BillLink id={e.sale}>{e.text}</BillLink>
                                            : <span className="text-slate-600">{e.text}</span>}
                                        {(e.by || e.note) && <span className="block text-xs text-slate-400">{[e.by && `by ${e.by}`, e.note].filter(Boolean).join(' · ')}</span>}
                                    </Td>
                                    <Td className="text-right">{e.debit ? formatINR(e.debit) : ''}</Td>
                                    <Td className="text-right text-emerald-700">{e.credit ? formatINR(e.credit) : ''}</Td>
                                    <Td className="text-right font-semibold text-slate-900">{formatINR(e.balance)}</Td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                ))}
            </Card>

            {collecting && <CollectModal api={api} customer={data} onClose={() => setCollecting(false)} onDone={load} />}
            <Modal show={Boolean(bill)} onClose={() => setBill(null)} title={bill ? `Bill #${bill.id}` : ''}>
                <Receipt sale={bill} />
                <Button block variant="secondary" className="mt-5" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print bill</Button>
            </Modal>
            {editing && <LimitModal api={api} customer={data} onClose={() => setEditing(false)} onDone={load} />}
        </AdminLayout>
    )
}

// Take a payment from a customer. It pays off their oldest bills first.
function CollectModal({ api, customer, onClose, onDone }) {
    const store = useStoreBrand()
    const [amount, setAmount] = useState(String(customer.owed))
    const [method, setMethod] = useState('cash')
    const [note, setNote] = useState('')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [done, setDone] = useState(null)

    const save = (e) => {
        e.preventDefault()
        setSaving(true)
        setError('')
        api.post(`customers/${customer.id}/collect/`, { amount, method, note })
            .then((res) => { setDone(res); onDone() })
            .catch((err) => setError(errorText(err)))
            .finally(() => setSaving(false))
    }

    if (done) {
        const left = done.customer.owed
        const text = `Thank you ${customer.name || ''} ji. ${store.name} received ${formatINR(done.amount)} by ${done.method} on ` +
            `${shortDate(new Date().toISOString())} (receipt #${done.receipt_no}). ${left > 0 ? `Still due: ${formatINR(left)}.` : 'Your account is fully paid.'}`
        return (
            <Modal show onClose={onClose} title="Payment saved" size="sm">
                <p className="text-sm text-slate-700"><strong>{formatINR(done.amount)}</strong> received by {done.method}.</p>
                <ul className="mt-2 space-y-0.5 text-xs text-slate-500">
                    {done.bills.map((b) => <li key={b.sale}>Bill #{b.sale}: {formatINR(b.amount)}{b.still_due > 0 ? `, ${formatINR(b.still_due)} still owed` : ', paid off'}</li>)}
                </ul>
                <p className={cn('mt-3 rounded-lg px-3 py-2 text-sm font-semibold', left > 0 ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-800')}>
                    {left > 0 ? `Still owes ${formatINR(left)}` : 'Fully paid up'}
                </p>
                <div className="mt-4 flex gap-2">
                    <Button variant="secondary" block href={whatsapp(customer.phone, text)} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4" /> Send receipt</Button>
                    <Button block onClick={onClose}>Done</Button>
                </div>
            </Modal>
        )
    }

    return (
        <Modal show onClose={onClose} title={`Payment from ${customer.name || formatPhone(customer.phone)}`} size="sm">
            <form onSubmit={save} className="space-y-4">
                <p className="text-sm text-slate-600">Owes <strong className="text-slate-900">{formatINR(customer.owed)}</strong>. The payment pays off the oldest bill first.</p>
                <Field label="Amount received (₹)" id="collect-amount">
                    <Input id="collect-amount" type="number" min="0.01" step="0.01" max={customer.owed} inputMode="decimal" required autoFocus
                        value={amount} onFocus={(e) => e.target.select()} onChange={(e) => setAmount(e.target.value)} />
                </Field>
                <div>
                    <p className="mb-1.5 text-sm font-medium text-slate-700">Paid by</p>
                    <div className="grid grid-cols-3 gap-2">
                        {METHODS.map(([value, label, Icon]) => (
                            <button key={value} type="button" onClick={() => setMethod(value)} aria-pressed={method === value}
                                className={cn('flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold ring-1 ring-inset',
                                    method === value ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50')}>
                                <Icon className="h-4 w-4" /> {label}
                            </button>
                        ))}
                    </div>
                </div>
                <Field label="Note (optional)" id="collect-note">
                    <Input id="collect-note" maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. paid by son" />
                </Field>
                {error && <Alert variant="danger">{error}</Alert>}
                <Button type="submit" block disabled={saving || !(Number(amount) > 0)}>{saving ? 'Saving…' : `Save ${Number(amount) > 0 ? formatINR(Number(amount)) : ''} payment`}</Button>
            </form>
        </Modal>
    )
}

function LimitModal({ api, customer, onClose, onDone }) {
    const [limit, setLimit] = useState(customer.credit_limit == null ? '' : String(customer.credit_limit))
    const [name, setName] = useState(customer.name || '')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const save = (e) => {
        e.preventDefault()
        setSaving(true)
        api.patch(`customers/${customer.id}/`, { credit_limit: limit, name })
            .then(() => { onDone(); onClose() })
            .catch((err) => { setError(errorText(err)); setSaving(false) })
    }
    return (
        <Modal show onClose={onClose} title="Customer and credit limit" size="sm">
            <form onSubmit={save} className="space-y-4">
                <Field label="Name" id="cust-name"><Input id="cust-name" maxLength={150} value={name} onChange={(e) => setName(e.target.value)} /></Field>
                <Field label="Credit limit (₹)" id="cust-limit" hint="The most they may owe. A pay-later bill over this is stopped at the counter. Leave empty for no limit.">
                    <Input id="cust-limit" type="number" min="0" inputMode="decimal" value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="No limit" />
                </Field>
                {error && <Alert variant="danger">{error}</Alert>}
                <Button type="submit" block disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
            </form>
        </Modal>
    )
}

export default KhataScreen
