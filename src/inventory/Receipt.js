import React from 'react'
import { formatTk } from '../components/ui'
import { formatDateTime } from './api'

// A shop receipt. The print-area class makes it the only thing printed.
function Receipt({ sale }) {
    if (!sale) return null
    return (
        <div className="print-area mx-auto max-w-xs font-mono text-xs text-slate-800">
            <div className="text-center">
                <p className="text-base font-bold">Krishi Bazar</p>
                <p className="text-slate-500">Sale #{sale.id}</p>
                <p className="text-slate-500">{formatDateTime(sale.createdAt)}</p>
                {sale.customer_name && <p className="mt-1">{sale.customer_name} {sale.customer_phone}</p>}
            </div>
            <div className="my-3 border-t border-dashed border-slate-300" />
            {sale.items.map((item, i) => (
                <div key={i} className="mb-1.5">
                    <p className="font-semibold">{item.name}</p>
                    <div className="flex justify-between text-slate-600">
                        <span>{item.qty} {item.unit} x {formatTk(item.unit_price)}</span>
                        <span>{formatTk(item.line_total)}</span>
                    </div>
                </div>
            ))}
            <div className="my-3 border-t border-dashed border-slate-300" />
            <Row label="Subtotal" value={formatTk(sale.subtotal)} />
            {sale.discount > 0 && <Row label="Discount" value={`-${formatTk(sale.discount)}`} />}
            <Row label="Total" value={formatTk(sale.total)} bold />
            <Row label={`Paid (${sale.payment_label})`} value={formatTk(sale.amount_paid)} />
            {sale.due > 0 && <Row label="Still due" value={formatTk(sale.due)} bold />}
            {sale.cashGiven > 0 && <Row label="Cash given" value={formatTk(sale.cashGiven)} />}
            {sale.change > 0 && <Row label="Change" value={formatTk(sale.change)} />}
            <p className="mt-4 text-center text-slate-500">Thank you for shopping with us.</p>
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
