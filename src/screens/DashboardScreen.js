import React, { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts'
import {
    Store, PackagePlus, Package, ShoppingCart, TrendingUp, TrendingDown, Minus,
    AlertTriangle, PackageX, CalendarClock, HandCoins, Truck, ChevronRight,
} from 'lucide-react'
import { Alert, Card, Spinner, cn, formatTk } from '../components/ui'
import { inventoryApi, errorText, formatTime } from '../inventory/api'

// Validated pair (light surface): shop green and online blue.
const SERIES = [
    { key: 'shop', label: 'Shop counter', color: '#059669' },
    { key: 'online', label: 'Online', color: '#0284c7' },
]

const hourLabel = (h) => `${h % 12 === 0 ? 12 : h % 12}${h < 12 ? 'am' : 'pm'}`

function greeting() {
    const h = new Date().getHours()
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

// Home: today at a glance, compared with the same day last week.
function DashboardScreen() {
    const { userInfo } = useSelector((state) => state.userLogin)
    const api = useMemo(() => inventoryApi(userInfo), [userInfo])
    const [data, setData] = useState(null)
    const [error, setError] = useState('')

    useEffect(() => {
        api.get('home/').then(setData).catch((e) => setError(errorText(e)))
    }, [api])

    const weekday = new Date().toLocaleDateString('en-GB', { weekday: 'long' })
    const firstName = ((userInfo && userInfo.name) || '').split(' ')[0]

    return (
        <div className="mx-auto w-full max-w-7xl">
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">{greeting()}{firstName ? `, ${firstName}` : ''}</h1>
                <p className="mt-0.5 text-sm text-slate-500">Here is how Krishi Bazar is doing today, compared with last {weekday}.</p>
            </div>

            <QuickActions />

            {error ? <Alert variant="danger" className="mt-6">{error}</Alert> : !data ? <Spinner /> : (
                <>
                    <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <Kpi label="Net sales" value={formatTk(data.today.net_sales)} now={data.today.net_sales} before={data.last_week.net_sales} weekday={weekday}
                            note={`${formatTk(data.today.shop_total)} shop · ${formatTk(data.today.online_total)} online`} />
                        <Kpi label="Transactions" value={data.today.transactions} now={data.today.transactions} before={data.last_week.transactions} weekday={weekday}
                            note={`${data.today.shop_count} at the counter · ${data.today.online_count} online`} />
                        <Kpi label="Average sale" value={formatTk(data.today.average_sale)} now={data.today.average_sale} before={data.last_week.average_sale} weekday={weekday} />
                        <Kpi label="Counter profit" value={formatTk(data.today.profit)} now={data.today.profit} before={data.last_week.profit} weekday={weekday}
                            note={data.today.profit > 0 && data.today.profit === data.today.shop_total
                                ? 'Buying prices are missing, so this equals sales. Set them on the Stock page.'
                                : 'Counter sales, at buying price'} />
                    </div>

                    <div className="mt-6 grid gap-6 xl:grid-cols-3">
                        <SalesByHour hourly={data.hourly} />
                        <Payments payments={data.payments} total={data.today.net_sales} />
                    </div>

                    <div className="mt-6 grid gap-6 xl:grid-cols-3">
                        <Recent recent={data.recent} />
                        <div className="space-y-6">
                            <Alerts alerts={data.alerts} />
                            <TopItems items={data.top_items} />
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

function Panel({ title, action, className, children }) {
    return (
        <Card className={cn('rounded-xl', className)}>
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
                <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
                {action}
            </div>
            {children}
        </Card>
    )
}

function QuickActions() {
    const actions = [
        { to: '/admin/counter', label: 'New sale', icon: Store, primary: true },
        { to: '/admin/receive', label: 'Receive stock', icon: PackagePlus },
        { to: '/admin/productlist', label: 'Products', icon: Package },
        { to: '/admin/orderlist', label: 'Online orders', icon: ShoppingCart },
    ]
    return (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {actions.map(({ to, label, icon: Icon, primary }) => (
                <Link key={to} to={to}
                    className={cn('flex items-center gap-3 rounded-xl px-4 py-4 text-sm font-semibold shadow-sm transition',
                        primary ? 'bg-brand-600 text-white hover:bg-brand-700' : 'border border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50')}>
                    <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', primary ? 'bg-white/15' : 'bg-slate-100 text-slate-700')}>
                        <Icon className="h-5 w-5" />
                    </span>
                    {label}
                </Link>
            ))}
        </div>
    )
}

// One headline number with its change from the same day last week.
function Kpi({ label, value, now, before, weekday, note }) {
    let delta
    if (!before && !now) delta = { text: `No sales last ${weekday} either`, tone: 'text-slate-500', Icon: Minus }
    else if (!before) delta = { text: `None last ${weekday}`, tone: 'text-slate-500', Icon: Minus }
    else {
        const pct = Math.round(((now - before) / before) * 100)
        delta = pct > 0 ? { text: `${pct}% vs last ${weekday}`, tone: 'text-emerald-700', Icon: TrendingUp }
            : pct < 0 ? { text: `${-pct}% vs last ${weekday}`, tone: 'text-rose-700', Icon: TrendingDown }
                : { text: `Same as last ${weekday}`, tone: 'text-slate-500', Icon: Minus }
    }
    const DeltaIcon = delta.Icon
    return (
        <Card className="rounded-xl p-5">
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
            <p className={cn('mt-2 flex items-center gap-1 text-xs font-semibold', delta.tone)}>
                <DeltaIcon className="h-3.5 w-3.5" /> {delta.text}
            </p>
            {note && <p className="mt-1 text-xs text-slate-500">{note}</p>}
        </Card>
    )
}

function SalesByHour({ hourly }) {
    const [asTable, setAsTable] = useState(false)
    // Opening hours by default, widened if anything sold earlier or later.
    const sold = hourly.filter((h) => h.shop + h.online > 0).map((h) => h.hour)
    const from = Math.min(8, ...sold)
    const to = Math.max(21, ...sold)
    const rows = hourly.slice(from, to + 1).map((h) => ({ ...h, label: hourLabel(h.hour) }))
    const empty = sold.length === 0

    return (
        <Panel title="Sales by hour" className="xl:col-span-2"
            action={!empty && (
                <button type="button" onClick={() => setAsTable((v) => !v)} className="text-xs font-semibold text-brand-700 hover:underline">
                    {asTable ? 'Show chart' : 'Show table'}
                </button>
            )}>
            <div className="px-5 pt-4">
                <div className="flex gap-4 text-xs text-slate-600">
                    {SERIES.map((s) => (
                        <span key={s.key} className="flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} /> {s.label}
                        </span>
                    ))}
                </div>
            </div>
            {empty ? (
                <p className="px-5 py-16 text-center text-sm text-slate-500">No sales yet today. They appear here as soon as the first bill is rung up.</p>
            ) : asTable ? (
                <div className="max-h-72 overflow-y-auto px-5 py-3">
                    <table className="w-full text-sm">
                        <thead><tr className="text-left text-xs text-slate-500"><th className="py-1.5 font-medium">Hour</th><th className="font-medium text-right">Shop</th><th className="font-medium text-right">Online</th><th className="font-medium text-right">Total</th></tr></thead>
                        <tbody className="divide-y divide-slate-100">
                            {rows.filter((r) => r.shop + r.online > 0).map((r) => (
                                <tr key={r.hour}><td className="py-1.5 text-slate-700">{r.label}</td><td className="text-right">{formatTk(r.shop)}</td><td className="text-right">{formatTk(r.online)}</td><td className="text-right font-semibold">{formatTk(r.shop + r.online)}</td></tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="h-72 px-2 pb-3 pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: 4 }} barCategoryGap="25%">
                            <CartesianGrid stroke="#e5e7eb" vertical={false} />
                            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} interval="preserveStartEnd" />
                            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} width={56}
                                tickFormatter={(v) => (v >= 1000 ? `৳${Math.round(v / 100) / 10}k` : `৳${v}`)} />
                            <Tooltip cursor={{ fill: '#f1f5f9' }} content={<HourTooltip />} />
                            {/* The white stroke is the 2px surface gap between stacked segments. */}
                            <Bar dataKey="shop" stackId="s" fill={SERIES[0].color} stroke="#fff" strokeWidth={2} maxBarSize={24} name="Shop counter" />
                            <Bar dataKey="online" stackId="s" fill={SERIES[1].color} stroke="#fff" strokeWidth={2} maxBarSize={24} radius={[4, 4, 0, 0]} name="Online" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </Panel>
    )
}

function HourTooltip({ active, payload, label }) {
    if (!active || !payload || !payload.length) return null
    const total = payload.reduce((sum, p) => sum + (p.value || 0), 0)
    return (
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
            <p className="mb-1 font-semibold text-slate-900">{label}</p>
            {payload.map((p) => (
                <p key={p.dataKey} className="flex items-center justify-between gap-4 text-slate-600">
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ background: p.fill }} />{p.name}</span>
                    <span className="font-medium text-slate-900">{formatTk(p.value)}</span>
                </p>
            ))}
            <p className="mt-1 flex justify-between gap-4 border-t border-slate-100 pt-1 font-semibold text-slate-900"><span>Total</span><span>{formatTk(total)}</span></p>
        </div>
    )
}

function Payments({ payments, total }) {
    return (
        <Panel title="Payment types">
            {payments.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-slate-500">No payments yet today.</p>
            ) : (
                <ul className="space-y-4 px-5 py-4">
                    {payments.map((p) => {
                        const share = total ? Math.round((p.total / total) * 100) : 0
                        return (
                            <li key={p.method}>
                                <div className="flex items-baseline justify-between gap-2 text-sm">
                                    <span className="font-medium text-slate-800">{p.method}</span>
                                    <span className="font-semibold text-slate-900">{formatTk(p.total)}</span>
                                </div>
                                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                                    <div className="h-full rounded-full bg-slate-700" style={{ width: `${share}%` }} />
                                </div>
                                <p className="mt-1 text-xs text-slate-500">{p.count} {p.count === 1 ? 'payment' : 'payments'} · {share}%</p>
                            </li>
                        )
                    })}
                </ul>
            )}
        </Panel>
    )
}

function Recent({ recent }) {
    return (
        <Panel title="Recent sales" className="xl:col-span-2" action={<Link to="/admin/sales" className="flex items-center text-xs font-semibold text-brand-700 hover:underline">All sales <ChevronRight className="h-3.5 w-3.5" /></Link>}>
            {recent.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-slate-500">No sales yet.</p>
            ) : (
                <ul className="divide-y divide-slate-100">
                    {recent.map((r) => (
                        <li key={`${r.kind}-${r.id}`}>
                            <Link to={r.kind === 'online' ? `/admin/order/${r.id}` : '/admin/sales'} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
                                <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', r.kind === 'online' ? 'bg-sky-50 text-sky-700' : 'bg-emerald-50 text-emerald-700')}>
                                    {r.kind === 'online' ? <ShoppingCart className="h-4 w-4" /> : <Store className="h-4 w-4" />}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-slate-900">{r.label}{r.customer ? ` · ${r.customer}` : ''}</p>
                                    <p className="truncate text-xs text-slate-500">
                                        {formatWhen(r.createdAt)} · {r.method}
                                        {r.due > 0 && <span className="font-semibold text-amber-700"> · {formatTk(r.due)} due</span>}
                                        {r.kind === 'online' && !r.delivered && <span className="font-semibold text-sky-700"> · to deliver</span>}
                                    </p>
                                </div>
                                <span className="text-sm font-semibold text-slate-900">{formatTk(r.total)}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </Panel>
    )
}

function formatWhen(iso) {
    if (!iso) return ''
    const d = new Date(iso)
    const today = new Date()
    if (d.toDateString() === today.toDateString()) return `Today ${formatTime(iso)}`
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ` ${formatTime(iso)}`
}

function Alerts({ alerts }) {
    const items = [
        { show: alerts.out_of_stock, icon: PackageX, text: `${alerts.out_of_stock} out of stock`, to: '/admin/stock', tone: 'text-rose-700 bg-rose-50' },
        { show: alerts.low_stock, icon: AlertTriangle, text: `${alerts.low_stock} running low`, to: '/admin/stock', tone: 'text-amber-700 bg-amber-50' },
        { show: alerts.expiring, icon: CalendarClock, text: `${alerts.expiring} batch${alerts.expiring === 1 ? '' : 'es'} expiring soon`, to: '/admin/stock', tone: 'text-amber-700 bg-amber-50' },
        { show: alerts.dues_count, icon: HandCoins, text: `${formatTk(alerts.dues_total)} owed on ${alerts.dues_count} bill${alerts.dues_count === 1 ? '' : 's'}`, to: '/admin/sales', tone: 'text-amber-700 bg-amber-50' },
        { show: alerts.online_to_ship, icon: Truck, text: `${alerts.online_to_ship} online order${alerts.online_to_ship === 1 ? '' : 's'} to deliver`, to: '/admin/orderlist', tone: 'text-sky-700 bg-sky-50' },
    ].filter((a) => a.show)
    return (
        <Panel title="Needs attention">
            {items.length === 0 ? (
                <p className="px-5 py-6 text-sm text-slate-500">All clear. Nothing needs attention.</p>
            ) : (
                <ul className="divide-y divide-slate-100">
                    {items.map(({ icon: Icon, text, to, tone }) => (
                        <li key={text}>
                            <Link to={to} className="flex items-center gap-3 px-5 py-3 text-sm hover:bg-slate-50">
                                <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg', tone)}><Icon className="h-4 w-4" /></span>
                                <span className="flex-1 font-medium text-slate-800">{text}</span>
                                <ChevronRight className="h-4 w-4 text-slate-400" />
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </Panel>
    )
}

function TopItems({ items }) {
    return (
        <Panel title="Top items today">
            {items.length === 0 ? (
                <p className="px-5 py-6 text-sm text-slate-500">Nothing sold yet today.</p>
            ) : (
                <ol className="divide-y divide-slate-100">
                    {items.map((t, i) => (
                        <li key={t.name} className="flex items-center gap-3 px-5 py-2.5 text-sm">
                            <span className="w-4 text-xs font-semibold text-slate-400">{i + 1}</span>
                            <span className="flex-1 truncate text-slate-800">{t.name}</span>
                            <span className="font-semibold text-slate-900">{t.qty} {t.unit}</span>
                        </li>
                    ))}
                </ol>
            )}
        </Panel>
    )
}

export default DashboardScreen
