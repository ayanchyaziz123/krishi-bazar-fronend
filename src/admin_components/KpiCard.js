import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Card, Skeleton, cn } from '../components/ui'

/**
 * One headline figure, e.g. Net sales ₹24,580.
 *
 * props:
 *   label    string           what the figure is
 *   value    node             the figure, already formatted
 *   icon     LucideIcon       optional, shown in a small tile
 *   now      number|null      this period's number, for the change line
 *   before   number|null      the comparison period's number
 *   compareLabel string       e.g. "vs last Monday"
 *   note     node             a short line under the figure
 *   loading  boolean          show a skeleton instead
 *
 * The change line only appears when both numbers exist and `before` isn't zero,
 * so no percentage is ever invented.
 */
function KpiCard({ label, value, icon: Icon, now, before, compareLabel, note, loading, className }) {
    let delta = null
    if (!loading && typeof now === 'number' && typeof before === 'number' && before > 0) {
        const pct = ((now - before) / before) * 100
        const rounded = Math.abs(pct) >= 10 ? Math.round(pct) : Math.round(pct * 10) / 10
        delta = pct > 0.05 ? { text: `+${rounded}%`, tone: 'text-emerald-700 bg-emerald-50', Icon: TrendingUp }
            : pct < -0.05 ? { text: `${rounded}%`, tone: 'text-rose-700 bg-rose-50', Icon: TrendingDown }
                : { text: '0%', tone: 'text-slate-600 bg-slate-100', Icon: Minus }
    }
    return (
        <Card className={cn('p-4', className)}>
            <div className="flex items-center justify-between gap-2">
                <p className="text-[13px] font-medium text-slate-500">{label}</p>
                {Icon && <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-500"><Icon className="h-3.5 w-3.5" /></span>}
            </div>
            {loading ? (
                <>
                    <Skeleton className="mt-3 h-7 w-28" />
                    <Skeleton className="mt-3 h-4 w-36" />
                </>
            ) : (
                <>
                    <p className="figure mt-2 text-[26px] font-semibold leading-tight text-slate-900">{value}</p>
                    <div className="mt-2 flex min-h-5 flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                        {delta ? (
                            <>
                                <span className={cn('figure inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-semibold', delta.tone)}>
                                    <delta.Icon className="h-3 w-3" /> {delta.text}
                                </span>
                                {compareLabel && <span className="text-slate-500">{compareLabel}</span>}
                            </>
                        ) : compareLabel && typeof before === 'number' ? (
                            <span className="text-slate-400">No figures {compareLabel.replace(/^vs /, '')} to compare</span>
                        ) : null}
                    </div>
                    {note && <p className="mt-1 text-xs text-slate-500">{note}</p>}
                </>
            )}
        </Card>
    )
}

export default KpiCard
