import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Check } from 'lucide-react'
import { cn, formatINR } from './ui'

const STEPS = [
    { label: 'Shipping', to: '/shipping' },
    { label: 'Summary', to: '/placeorder' },
    { label: 'Payment', to: '/payment' },
]

// "Back to Cart" and the three checkout steps: done steps get a tick and can be reopened.
function CheckoutSteps({ current }) {
    return (
        <div className="mb-5 rounded-2xl bg-white px-4 pb-4 pt-3 shadow-xs ring-1 ring-slate-200/70 sm:px-6">
            <Link to="/cart" className="mb-3 inline-flex items-center gap-2 text-[15px] font-semibold text-slate-800 hover:text-slate-950">
                <ArrowLeft className="h-5 w-5" /> Back to Cart
            </Link>
            <ol className="flex items-start">
                {STEPS.map((s, i) => {
                    const done = i < current
                    const here = i === current
                    const dot = (
                        <span className="flex flex-col items-center gap-1.5">
                            <span className={cn('flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ring-4 transition',
                                done && 'bg-brand-50 text-brand-600 ring-brand-100',
                                here && 'bg-brand-600 text-white ring-brand-100',
                                !done && !here && 'bg-white text-slate-400 ring-slate-100 outline outline-2 outline-slate-200')}>
                                {done ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
                            </span>
                            <span className={cn('text-xs font-semibold sm:text-sm', here ? 'text-slate-900' : 'text-slate-400')}>{s.label}</span>
                        </span>
                    )
                    return (
                        <li key={s.label} className="flex flex-1 items-start last:flex-none">
                            {done ? <Link to={s.to} aria-label={`Back to ${s.label}`}>{dot}</Link> : <span aria-current={here ? 'step' : undefined}>{dot}</span>}
                            {i < STEPS.length - 1 && <span className={cn('mx-1 mt-4 h-0.5 flex-1 rounded-full', done ? 'bg-brand-500' : 'bg-slate-200')} />}
                        </li>
                    )
                })}
            </ol>
        </div>
    )
}

// The price breakdown shared by the summary and payment steps.
export function PriceDetails({ totals, pickup, rules }) {
    const row = 'flex items-baseline justify-between py-3 text-[15px]'
    return (
        <section className="rounded-2xl bg-white p-5 shadow-xs ring-1 ring-slate-200/70">
            <h2 className="mb-1 text-lg font-bold text-slate-900">Price details</h2>
            <dl className="divide-y divide-dashed divide-slate-200">
                <div className={row}><dt className="text-slate-600">Subtotal ({totals.count} {totals.count === 1 ? 'item' : 'items'})</dt><dd className="font-semibold">{formatINR(totals.items)}</dd></div>
                <div className={row}>
                    <dt className="text-slate-600">{pickup ? 'Store pick-up' : 'Delivery'}<span className="block text-xs text-slate-400">
                        {pickup ? 'No delivery charge' : rules && rules.freeOver !== null ? `Free on orders over ${formatINR(rules.freeOver)}` : rules && !rules.fee ? 'Free delivery' : ''}
                    </span></dt>
                    <dd className="font-semibold">{totals.shipping ? formatINR(totals.shipping) : 'Free'}</dd>
                </div>
                {totals.gstMode === 'regular' ? (
                    <div className={row}><dt className="text-slate-600">GST{totals.taxIncluded ? <span className="block text-xs text-slate-400">Included in the prices</span> : null}</dt><dd className="font-semibold">{formatINR(totals.tax)}</dd></div>
                ) : totals.gstMode !== 'composition' && (
                    <div className={row}><dt className="text-slate-600">Tax ({rules ? rules.taxRate : 5}%)</dt><dd className="font-semibold">{formatINR(totals.tax)}</dd></div>
                )}
                {totals.coupon > 0 && <div className={row}><dt className="text-slate-600">Coupon</dt><dd className="font-semibold text-emerald-600">-{formatINR(totals.coupon)}</dd></div>}
                <div className="flex items-baseline justify-between pt-3 text-lg"><dt className="font-bold">Total amount</dt><dd className="font-extrabold">{formatINR(totals.total)}</dd></div>
            </dl>
            {totals.saved > 0 && (
                <p className="mt-3 flex justify-between rounded-xl bg-emerald-50 px-4 py-3 text-[15px] text-slate-800">
                    You will save on this order <strong className="text-emerald-600">{formatINR(totals.saved)}</strong>
                </p>
            )}
        </section>
    )
}

// The bar at the bottom of each step: the total and the next button.
export function CheckoutBar({ total, children }) {
    return (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] md:static md:mt-5 md:rounded-2xl md:border md:shadow-xs">
            <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-3">
                <div className="min-w-0">
                    <p className="text-lg font-extrabold text-slate-900">{formatINR(total)}</p>
                    <p className="text-xs text-slate-500">Total to pay</p>
                </div>
                <div className="ml-auto">{children}</div>
            </div>
        </div>
    )
}

export const checkoutButton = 'inline-flex h-12 min-w-44 items-center justify-center rounded-xl bg-red-600 px-6 text-[15px] font-bold text-white transition hover:bg-red-700 disabled:bg-slate-200 disabled:text-slate-400'

export default CheckoutSteps
