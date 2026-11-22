import React, { useEffect, useMemo, useState } from 'react'
import { Download, FileText, Landmark, Settings } from 'lucide-react'
import AdminLayout from '../admin_components/AdminLayout'
import { Alert, Button, Card, CardHeader, Input, Spinner, Table, Td, Th, formatINR } from '../components/ui'
import { useAdminGuard, inventoryApi, errorText, todayInShop } from '../inventory/api'

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`
const firstOfMonth = () => `${todayInShop().slice(0, 8)}01`
// The first and last day of last month.
const lastMonth = () => {
    const [y, m] = todayInShop().split('-').map(Number)
    const start = new Date(Date.UTC(m === 1 ? y - 1 : y, (m + 10) % 12, 1))
    const end = new Date(Date.UTC(y, m - 1, 0))
    return [start.toISOString().slice(0, 10), end.toISOString().slice(0, 10)]
}

// A CSV file the CA can open in Excel. Amounts as plain numbers.
function downloadCsv(name, rows) {
    const text = rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n')
    const url = URL.createObjectURL(new Blob([`﻿${text}`], { type: 'text/csv;charset=utf-8' }))
    const a = Object.assign(document.createElement('a'), { href: url, download: name })
    document.body.appendChild(a); a.click(); a.remove()
    URL.revokeObjectURL(url)
}

// GST charged in a date range, by rate and by HSN code: counter bills and online orders,
// less counter returns (credit notes). The figures a CA needs for GSTR-1 and GSTR-3B.
function GstReportScreen({ history }) {
    const { userInfo, isAdmin } = useAdminGuard(history)
    const api = useMemo(() => inventoryApi(userInfo), [userInfo])
    const [from, setFrom] = useState(firstOfMonth())
    const [to, setTo] = useState(todayInShop())
    const [report, setReport] = useState(null)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!isAdmin || !from || !to) return
        setLoading(true)
        api.get(`gst/?from=${from}&to=${to}`).then((r) => { setReport(r); setError('') }).catch((e) => setError(errorText(e))).finally(() => setLoading(false))
    }, [api, isAdmin, from, to])

    const exportCsv = () => {
        const t = report.totals
        downloadCsv(`gst-${report.from}-to-${report.to}.csv`, [
            [`GST report ${report.from} to ${report.to}`, report.gst.gstin ? `GSTIN ${report.gst.gstin}` : ''],
            [],
            ['GST rate (%)', 'Taxable value', 'CGST', 'SGST', 'IGST', 'Total GST'],
            ...report.by_rate.map((r) => [r.rate, r.taxable, r.cgst, r.sgst, r.igst, r.tax]),
            ['Total', t.taxable, t.cgst, t.sgst, t.igst, t.tax],
            [],
            ['HSN', 'Description', 'Unit', 'Quantity', 'GST rate (%)', 'Taxable value', 'GST'],
            ...report.by_hsn.map((h) => [h.hsn, h.name, h.unit, h.qty, h.rate, h.taxable, h.tax]),
            [],
            ['Sales without GST (not registered or composition)', report.untaxed_sales],
        ])
    }

    const mode = report && report.gst.mode
    return (
        <AdminLayout
            title="GST report"
            subtitle="The GST you charged on bills and online orders, less returns. Pick the dates, then download it for your CA (GSTR-1 and GSTR-3B)."
            action={(
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 text-sm">
                        {[['This month', [firstOfMonth(), todayInShop()]], ['Last month', lastMonth()]].map(([label, [a, b]]) => (
                            <button key={label} type="button" onClick={() => { setFrom(a); setTo(b) }}
                                className={`rounded-md px-3 py-1.5 font-medium ${from === a && to === b ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>{label}</button>
                        ))}
                    </div>
                    <Button disabled={!report} onClick={exportCsv}><Download className="h-4 w-4" /> Download for CA</Button>
                </div>
            )}
        >
            <div className="mb-5 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                <span>From</span>
                <Input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="!w-40" aria-label="From" />
                <span>to</span>
                <Input type="date" value={to} min={from} max={todayInShop()} onChange={(e) => setTo(e.target.value)} className="!w-40" aria-label="To" />
            </div>
            {error && <Alert variant="danger" className="mb-4">{error}</Alert>}
            {loading && !report ? <Spinner /> : report && (
                <div className="space-y-6">
                    {mode !== 'regular' && (
                        <Card className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center">
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500"><Landmark className="h-6 w-6" /></span>
                            <div className="flex-1">
                                <p className="font-semibold text-slate-900">{mode === 'composition' ? 'Your shop is on the composition scheme' : 'GST is off for your shop'}</p>
                                <p className="mt-1 text-sm text-slate-600">
                                    {mode === 'composition'
                                        ? 'Customers are not charged GST, so there is no GST to report here.'
                                        : 'Bills do not charge GST. If your shop is GST registered, turn GST on in Settings.'}
                                    {report.untaxed_sales > 0 && <> Sales in these dates: <strong>{formatINR(report.untaxed_sales)}</strong>.</>}
                                </p>
                            </div>
                            <Button variant="secondary" to="/admin/settings"><Settings className="h-4 w-4" /> Settings</Button>
                        </Card>
                    )}
                    {/* The figures, when there is GST to show (also for GST charged before it was turned off). */}
                    {(mode === 'regular' || report.totals.tax > 0) && (<>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {[['Sales before GST', report.totals.taxable, 'Taxable value'], ['CGST + SGST', report.totals.cgst + report.totals.sgst, 'Customers in your state'],
                            ['IGST', report.totals.igst, 'Online orders to other states'], ['Total GST collected', report.totals.tax, 'To pay the government']].map(([label, value, note]) => (
                            <Card key={label} className="p-4">
                                <p className="text-[13px] font-medium text-slate-500">{label}</p>
                                <p className="figure mt-2 text-2xl font-semibold text-slate-900">{formatINR(value)}</p>
                                <p className="mt-1 text-xs text-slate-500">{note}</p>
                            </Card>
                        ))}
                    </div>
                    <p className="flex items-center gap-2 text-sm text-slate-600">
                        <FileText className="h-4 w-4 text-slate-400" />
                        {plural(report.invoices.counter, 'counter invoice')} · {plural(report.invoices.online, 'online invoice')} · {plural(report.invoices.credit_notes, 'credit note')} (returns)
                        {report.untaxed_sales > 0 && <> · {formatINR(report.untaxed_sales)} sold without GST</>}
                    </p>

                    <Card>
                        <CardHeader title="By GST rate" subtitle="How much was sold at each rate" />
                        <Table>
                            <thead><tr><Th>Rate</Th><Th className="text-right">Taxable value</Th><Th className="text-right">CGST</Th><Th className="text-right">SGST</Th><Th className="text-right">IGST</Th><Th className="text-right">Total GST</Th></tr></thead>
                            <tbody className="divide-y divide-slate-100">
                                {report.by_rate.map((r) => (
                                    <tr key={r.rate}>
                                        <Td className="font-semibold">{r.rate}%</Td><Td className="text-right">{formatINR(r.taxable)}</Td><Td className="text-right">{formatINR(r.cgst)}</Td>
                                        <Td className="text-right">{formatINR(r.sgst)}</Td><Td className="text-right">{formatINR(r.igst)}</Td><Td className="text-right font-semibold">{formatINR(r.tax)}</Td>
                                    </tr>
                                ))}
                                {report.by_rate.length === 0 && <tr><Td colSpan={6} className="py-8 text-center text-slate-500">No GST bills in these dates.</Td></tr>}
                            </tbody>
                        </Table>
                    </Card>

                    <Card>
                        <CardHeader title="By HSN code" subtitle="The HSN summary your CA needs for GSTR-1" />
                        <Table>
                            <thead><tr><Th>HSN</Th><Th>Product</Th><Th className="text-right">Quantity</Th><Th className="text-right">Rate</Th><Th className="text-right">Taxable value</Th><Th className="text-right">GST</Th></tr></thead>
                            <tbody className="divide-y divide-slate-100">
                                {report.by_hsn.map((h, i) => (
                                    <tr key={i}>
                                        <Td className="font-mono">{h.hsn || <span className="font-sans text-amber-700">Missing</span>}</Td><Td>{h.name}</Td>
                                        <Td className="text-right">{h.qty} {h.unit}</Td><Td className="text-right">{h.rate}%</Td>
                                        <Td className="text-right">{formatINR(h.taxable)}</Td><Td className="text-right">{formatINR(h.tax)}</Td>
                                    </tr>
                                ))}
                                {report.by_hsn.length === 0 && <tr><Td colSpan={6} className="py-8 text-center text-slate-500">Nothing to show.</Td></tr>}
                            </tbody>
                        </Table>
                    </Card>
                    </>)}
                    <p className="text-xs text-slate-500">Delivery charges are not included as taxable supplies. GST paid on purchases (input tax credit) is not tracked yet; take it from your suppliers' invoices.</p>
                </div>
            )}
        </AdminLayout>
    )
}

export default GstReportScreen
