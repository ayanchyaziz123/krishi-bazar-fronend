import React from 'react'
import { formatINR } from '../components/ui'
import { formatDateTime } from './api'
import { useStoreBrand } from '../components/storeBrand'

function Header({ store, children }) {
    return (
        <div className="text-center">
            {store.logo && <img src={store.logo} alt="" className="mx-auto mb-1 h-12 max-w-[60%] object-contain" />}
            <p className="text-base font-bold">{store.name}</p>
            {store.address && <p className="text-slate-500">{store.address}</p>}
            {store.phone && <p className="text-slate-500">{store.phone}</p>}
            {children}
        </div>
    )
}

// A shop receipt. The print-area class makes it the only thing printed. Returns on the bill
// are listed under it, and a voided bill is stamped as such.
function Receipt({ sale }) {
    const store = useStoreBrand()
    const gst = (store && store.gst) || {}
    if (!sale) return null
    const returns = sale.returns || []
    const refunded = returns.reduce((n, r) => n + Number(r.refund_amount || 0), 0)
    return (
        <div className="print-area relative mx-auto max-w-xs font-mono text-xs text-slate-800">
            {sale.voided && <p className="mb-2 rounded border-2 border-rose-500 py-1 text-center text-sm font-bold tracking-widest text-rose-600">VOID</p>}
            {sale.gst_mode === 'regular' && <p className="mb-1 text-center text-sm font-bold tracking-widest">TAX INVOICE</p>}
            {sale.gst_mode === 'composition' && <p className="mb-1 text-center text-sm font-bold tracking-widest">BILL OF SUPPLY</p>}
            <div className="text-center">
                {store.logo && <img src={store.logo} alt="" className="mx-auto mb-1 h-12 max-w-[60%] object-contain" />}
                <p className="text-base font-bold">{store.name}</p>
                {store.address && <p className="text-slate-500">{store.address}</p>}
                {store.phone && <p className="text-slate-500">{store.phone}</p>}
                {sale.gst_mode !== 'none' && sale.gst_mode && gst.gstin && <p className="text-slate-700">GSTIN: {gst.gstin}{gst.state ? ` · ${gst.state}` : ''}</p>}
                <p className="text-slate-500">{sale.gst_mode && sale.gst_mode !== 'none' ? 'Invoice' : 'Sale'} #{sale.id}</p>
                <p className="text-slate-500">{formatDateTime(sale.createdAt)}</p>
                {sale.entered_later && <p className="text-slate-500">Entered later{sale.entered_at ? ` on ${formatDateTime(sale.entered_at)}` : ''}{sale.sold_by ? ` by ${sale.sold_by}` : ''}</p>}
                {sale.customer_name && <p className="mt-1">{sale.customer_name} {sale.customer_phone}</p>}
            </div>
            <div className="my-3 border-t border-dashed border-slate-300" />
            {sale.items.map((item, i) => (
                <div key={i} className="mb-1.5">
                    <p className="font-semibold">{item.name}{sale.gst_mode === 'regular' && item.hsn_code ? <span className="font-normal text-slate-500"> · HSN {item.hsn_code}</span> : null}</p>
                    <div className="flex justify-between text-slate-600">
                        <span>{Number(item.qty)} {item.unit} x {formatINR(item.unit_price)}</span>
                        <span>{formatINR(item.line_total)}</span>
                    </div>
                </div>
            ))}
            <div className="my-3 border-t border-dashed border-slate-300" />
            <Row label="Subtotal" value={formatINR(sale.subtotal)} />
            {sale.discount > 0 && <Row label="Discount" value={`-${formatINR(sale.discount)}`} />}
            {sale.gst_mode === 'regular' && <GstSummary sale={sale} />}
            <Row label="Total" value={formatINR(sale.total)} bold />
            <Row label={`Paid (${sale.payment_label})`} value={formatINR(Number(sale.amount_paid) + refunded)} />
            {sale.due > 0 && <Row label="Still due" value={formatINR(sale.due)} bold />}
            {sale.cashGiven > 0 && <Row label="Cash given" value={formatINR(sale.cashGiven)} />}
            {sale.change > 0 && <Row label="Change" value={formatINR(sale.change)} />}
            {returns.length > 0 && (
                <>
                    <div className="my-3 border-t border-dashed border-slate-300" />
                    <p className="mb-1 font-bold">{sale.voided ? 'Voided' : 'Returned'}</p>
                    {[...returns].reverse().map((ret) => (
                        <div key={ret.id} className="mb-1.5">
                            <p className="text-slate-500">{formatDateTime(ret.createdAt)}{ret.reason ? ` · ${ret.reason}` : ''}</p>
                            {ret.items.map((i, k) => (
                                <div key={k} className="flex justify-between text-slate-600"><span>{Number(i.qty)} {i.unit} {i.name}</span><span>-{formatINR(i.amount)}</span></div>
                            ))}
                            {ret.refund_amount > 0 && <div className="flex justify-between"><span>Refunded ({ret.refund_label})</span><span>{formatINR(ret.refund_amount)}</span></div>}
                        </div>
                    ))}
                    <Row label="Total after returns" value={formatINR(sale.net_total)} bold />
                </>
            )}
            {sale.gst_mode === 'composition' && <p className="mt-3 text-center text-slate-500">Composition taxable person, not eligible to collect tax on supplies.</p>}
            <p className="mt-4 text-center text-slate-500">{store.receipt_footer}</p>
        </div>
    )
}

// Taxable value and CGST/SGST for each GST rate on the bill.
function GstSummary({ sale }) {
    const rows = {}
    sale.items.forEach((i) => {
        const r = rows[i.gst_rate] || (rows[i.gst_rate] = { rate: i.gst_rate, taxable: 0, tax: 0 })
        r.taxable += Number(i.taxable_value) || 0
        r.tax += Number(i.tax_amount) || 0
    })
    const list = Object.values(rows).sort((a, b) => a.rate - b.rate)
    return (
        <div className="my-2 border-y border-dashed border-slate-300 py-1.5">
            <div className="grid grid-cols-4 gap-1 text-[10px] font-semibold text-slate-500"><span>GST</span><span className="text-right">Taxable</span><span className="text-right">CGST</span><span className="text-right">SGST</span></div>
            {list.map((r) => (
                <div key={r.rate} className="grid grid-cols-4 gap-1">
                    <span>{r.rate}%</span>
                    <span className="text-right">{formatINR(r.taxable)}</span>
                    <span className="text-right">{formatINR(r.tax / 2)}</span>
                    <span className="text-right">{formatINR(r.tax - Math.round((r.tax / 2) * 100) / 100)}</span>
                </div>
            ))}
            <div className="mt-1 flex justify-between font-semibold"><span>Total GST</span><span>{formatINR(sale.tax_total)}</span></div>
        </div>
    )
}

// The slip given to the customer for a return or void.
export function RefundReceipt({ refund, sale }) {
    const store = useStoreBrand()
    if (!refund) return null
    return (
        <div className="print-area mx-auto max-w-xs font-mono text-xs text-slate-800">
            <Header store={store}>
                <p className="mt-1 text-sm font-bold">{refund.kind === 'void' ? 'VOID' : 'REFUND'}</p>
                <p className="text-slate-500">For bill #{refund.sale} · {formatDateTime(refund.createdAt)}</p>
                {sale && sale.customer_name && <p className="mt-1">{sale.customer_name} {sale.customer_phone}</p>}
            </Header>
            <div className="my-3 border-t border-dashed border-slate-300" />
            {refund.items.map((i, k) => (
                <div key={k} className="flex justify-between"><span>{Number(i.qty)} {i.unit} {i.name}</span><span>{formatINR(i.amount)}</span></div>
            ))}
            <div className="my-3 border-t border-dashed border-slate-300" />
            <Row label="Value returned" value={formatINR(refund.value)} />
            <Row label={refund.refund_amount > 0 ? `Refunded (${refund.refund_label})` : 'Refunded'} value={formatINR(refund.refund_amount)} bold />
            {refund.value > refund.refund_amount && <Row label="Taken off what is owed" value={formatINR(refund.value - refund.refund_amount)} />}
            {refund.reason && <p className="mt-2">Reason: {refund.reason}</p>}
            {!refund.restocked && <p className="mt-1 text-slate-500">Items not put back for sale.</p>}
            {refund.by && <p className="mt-1 text-slate-500">By {refund.by}</p>}
            <p className="mt-4 text-center text-slate-500">{store.receipt_footer}</p>
        </div>
    )
}

function Row({ label, value, bold }) {
    return (
        <div className={`flex justify-between ${bold ? 'text-sm font-bold' : ''}`}>
            <span>{label}</span>
            <span>{value}</span>
        </div>
    )
}

export default Receipt
