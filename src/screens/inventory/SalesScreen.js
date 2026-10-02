import React, { useEffect, useMemo, useState } from 'react'
import { Printer, Store, Globe, TrendingUp, Trash2 } from 'lucide-react'
import AdminLayout from '../../admin_components/AdminLayout'
import { Alert, Badge, Button, Card, CardHeader, Field, Input, Modal, Spinner, Table, Td, Th, formatTk } from '../../components/ui'
import Receipt from '../../inventory/Receipt'
import { useAdminGuard, inventoryApi, errorText, todayInDhaka, formatTime, formatDateTime } from '../../inventory/api'

// Daily report for the shop and the website, plus counter sales and unpaid bills.
function SalesScreen({ history }) {
    const { userInfo, isAdmin } = useAdminGuard(history)
    const api = useMemo(() => inventoryApi(userInfo), [userInfo])

    const [date, setDate] = useState(todayInDhaka())
    const [summary, setSummary] = useState(null)
    const [sales, setSales] = useState([])
    const [dues, setDues] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [receipt, setReceipt] = useState(null)
    const [collecting, setCollecting] = useState(null)

    const load = () => {
        setLoading(true)
        Promise.all([api.get(`summary/?date=${date}`), api.get(`sales/?date=${date}`), api.get('dues/')])
            .then(([s, list, d]) => { setSummary(s); setSales(list.sales); setDues(d); setError('') })
            .catch((e) => setError(errorText(e)))
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        if (isAdmin && date) load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAdmin, date])

    const openReceipt = (id) => api.get(`sales/${id}/`).then(setReceipt).catch((e) => setError(errorText(e)))

    const isToday = date === todayInDhaka()

    return (
        <AdminLayout
            title="Sales and reports"
            subtitle="Shop counter and website sales for one day."
            action={<Input type="date" value={date} max={todayInDhaka()} onChange={(e) => setDate(e.target.value)} className="!w-44" aria-label="Report date" />}
        >
            {error && <Alert variant="danger" className="mb-4">{error}</Alert>}
            {loading && !summary ? <Spinner /> : summary && (
                <div className="space-y-6">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <Stat icon={Store} label={isToday ? 'Shop sales today' : 'Shop sales'} value={formatTk(summary.shop.total)}
                            note={`${summary.shop.count} bills · ${formatTk(summary.shop.collected)} collected`} />
                        <Stat icon={Globe} label="Online orders" value={formatTk(summary.online.total)}
                            note={`${summary.online.count} orders, shipping included`} />
                        <Stat icon={TrendingUp} label="Profit" value={formatTk(summary.shop.profit + summary.online.profit)}
                            note={`Shop ${formatTk(summary.shop.profit)} · Online ${formatTk(summary.online.profit)}`} />
                        <Stat icon={Trash2} label="Wastage" value={formatTk(summary.wastage_cost)} note="At buying price" />
                    </div>
                    {summary.missing_cost_price > 0 && (
                        <Alert variant="info">
                            {summary.missing_cost_price} items have no buying price, so profit on them counts the full selling price.
                            Set buying prices on the Stock page or by receiving stock.
                        </Alert>
                    )}

                    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
                        <div className="min-w-0">
                            <h2 className="mb-3 font-semibold text-slate-900">Counter sales</h2>
                            <Table>
                                <thead>
                                    <tr>
                                        <Th>Bill</Th><Th>Time</Th><Th>Customer</Th><Th>Payment</Th>
                                        <Th className="text-right">Total</Th><Th className="text-right">Profit</Th><Th></Th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {sales.map((s) => (
                                        <tr key={s.id} className="hover:bg-slate-50/60">
                                            <Td className="font-semibold text-slate-900">#{s.id}</Td>
                                            <Td>{formatTime(s.createdAt)}</Td>
                                            <Td>{s.customer_name || <span className="text-slate-400">Walk-in</span>}</Td>
                                            <Td>{s.due > 0 ? <Badge variant="amber">Due {formatTk(s.due)}</Badge> : <Badge variant="green">{s.payment_label}</Badge>}</Td>
                                            <Td className="text-right font-semibold">{formatTk(s.total)}</Td>
                                            <Td className="text-right">{formatTk(s.profit)}</Td>
                                            <Td className="text-right"><Button variant="ghost" size="sm" onClick={() => openReceipt(s.id)}>Receipt</Button></Td>
                                        </tr>
                                    ))}
                                    {sales.length === 0 && (
                                        <tr><Td colSpan={7} className="py-10 text-center text-slate-500">No counter sales on this day.</Td></tr>
                                    )}
                                </tbody>
                            </Table>
                        </div>

                        <div className="space-y-6">
                            <Card>
                                <CardHeader title="Best sellers" subtitle="Shop and online together" />
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
                                <CardHeader title="Unpaid bills" subtitle={`${formatTk(summary.dues.total)} owed in total`} />
                                {dues.length === 0 ? <p className="px-6 py-4 text-sm text-slate-500">Nobody owes anything.</p> : (
                                    <ul className="divide-y divide-slate-100 text-sm">
                                        {dues.map((d) => (
                                            <li key={d.id} className="flex items-center justify-between gap-2 px-6 py-2.5">
                                                <div>
                                                    <p className="font-semibold text-slate-900">{d.customer_name}</p>
                                                    <p className="text-xs text-slate-500">{d.customer_phone} · bill #{d.id} · {formatDateTime(d.createdAt)}</p>
                                                </div>
                                                <Button size="sm" variant="secondary" onClick={() => setCollecting(d)}>{formatTk(d.due)}</Button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </Card>
                        </div>
                    </div>
                </div>
            )}

            <Modal show={Boolean(receipt)} onClose={() => setReceipt(null)} title={receipt ? `Bill #${receipt.id}` : ''}>
                <Receipt sale={receipt} />
                <Button block variant="secondary" className="mt-5" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print receipt</Button>
            </Modal>

            {collecting && <CollectModal api={api} sale={collecting} onClose={() => setCollecting(null)} onSaved={load} />}
        </AdminLayout>
    )
}

function Stat({ icon: Icon, label, value, note }) {
    return (
        <Card className="p-4">
            <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><Icon className="h-4 w-4" /></span>
                <p className="text-sm text-slate-500">{label}</p>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
            {note && <p className="text-xs text-slate-500">{note}</p>}
        </Card>
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
                <p className="text-sm text-slate-600">Bill #{sale.id} for {formatTk(sale.total)}. Still due: <strong>{formatTk(sale.due)}</strong></p>
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
