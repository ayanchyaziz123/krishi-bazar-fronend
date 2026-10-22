import React from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, AlertTriangle, CalendarClock, PackageSearch, Activity, ChevronRight } from 'lucide-react'
import { Card, cn } from '../components/ui'

/**
 * AI Smart Inventory panel.
 *
 * The prediction service isn't built yet, so by default this shows an honest
 * "not set up" state. Nothing here is invented and there are no buttons that do nothing.
 *
 * When the service exists, pass `insights` from:
 *   GET /api/ai/insights/   (manager only)
 *   → {
 *       generated_at: "2026-10-14T06:00:00Z",
 *       insights: [{
 *         id: "string",
 *         kind: "stockout" | "reorder" | "expiry" | "anomaly" | "purchase",
 *         product: { id: number, name: string, unit: string },
 *         risk: "critical" | "high" | "medium" | "low",
 *         headline: "Chickpeas expected to run out in 2 days",
 *         explanation: "Sold 18/day over the last 14 days; 36 left.",
 *         stockout_date: "2026-10-16" | null,
 *         suggested_qty: 200 | null,
 *         action: { label: "Review reorder", to: "/admin/receive?product=113" } | null
 *       }]
 *     }
 * See docs/ai-insights-api.md for the full contract.
 *
 * props:
 *   insights  array|null   the list above, or null when the service isn't available
 *   loading   boolean
 */
const KIND_ICONS = { stockout: AlertTriangle, reorder: PackageSearch, expiry: CalendarClock, anomaly: Activity, purchase: PackageSearch }
const RISK = {
    critical: 'bg-rose-50 text-rose-700 ring-rose-600/20',
    high: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    medium: 'bg-sky-50 text-sky-700 ring-sky-600/20',
    low: 'bg-slate-100 text-slate-600 ring-slate-500/20',
}

function AIInsights({ insights = null, loading = false }) {
    return (
        <Card className="overflow-hidden">
            <div className="flex items-center gap-3 border-b border-slate-200/70 px-4 py-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><Sparkles className="h-4 w-4" /></span>
                <div>
                    <h2 className="text-sm font-semibold text-slate-900">AI inventory insights</h2>
                    <p className="text-xs text-slate-500">Stockouts, reorders, expiry and unusual activity</p>
                </div>
            </div>
            {loading ? (
                <p className="px-4 py-6 text-sm text-slate-500">Loading insights…</p>
            ) : insights === null ? (
                <div className="px-4 py-5">
                    <p className="text-sm font-medium text-slate-900">Not set up yet</p>
                    <p className="mt-1 text-sm text-slate-500">
                        Once the forecasting service is connected, this panel will predict when items run out,
                        suggest how much to reorder, and flag expiry risks and unusual stock changes, each with its reasoning.
                    </p>
                    <ul className="mt-3 space-y-1.5 text-xs text-slate-500">
                        <li className="flex items-center gap-2"><AlertTriangle className="h-3.5 w-3.5" /> Predicted stockouts with dates</li>
                        <li className="flex items-center gap-2"><PackageSearch className="h-3.5 w-3.5" /> Suggested reorder quantities</li>
                        <li className="flex items-center gap-2"><CalendarClock className="h-3.5 w-3.5" /> Batches at risk of expiring</li>
                    </ul>
                </div>
            ) : insights.length === 0 ? (
                <p className="px-4 py-6 text-sm text-slate-500">No risks found. Stock looks healthy.</p>
            ) : (
                <ul className="divide-y divide-slate-100">
                    {insights.map((item) => {
                        const Icon = KIND_ICONS[item.kind] || Sparkles
                        return (
                            <li key={item.id} className="px-4 py-3">
                                <div className="flex items-start gap-3">
                                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="truncate text-sm font-medium text-slate-900">{item.headline}</p>
                                            <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ring-1 ring-inset', RISK[item.risk] || RISK.low)}>{item.risk}</span>
                                        </div>
                                        {item.explanation && <p className="mt-0.5 text-xs text-slate-500">{item.explanation}</p>}
                                        {(item.stockout_date || item.suggested_qty) && (
                                            <p className="figure mt-1 text-xs text-slate-600">
                                                {item.stockout_date && <>Runs out around {item.stockout_date}</>}
                                                {item.stockout_date && item.suggested_qty ? ' · ' : ''}
                                                {item.suggested_qty && <>Suggested reorder {item.suggested_qty} {item.product && item.product.unit}</>}
                                            </p>
                                        )}
                                        {item.action && (
                                            <Link to={item.action.to} className="mt-1.5 inline-flex items-center gap-0.5 text-xs font-semibold text-brand-700 hover:underline">
                                                {item.action.label} <ChevronRight className="h-3.5 w-3.5" />
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </li>
                        )
                    })}
                </ul>
            )}
        </Card>
    )
}

export default AIInsights
