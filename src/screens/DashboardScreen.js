import React, { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts'
import {
    Store, PackagePlus, Package, ShoppingCart, Wallet, Receipt, Calculator, TrendingUp,
    AlertTriangle, PackageX, CalendarClock, HandCoins, Truck, ChevronRight, CheckCircle2, BarChart3, CreditCard, Inbox,
} from 'lucide-react'
import { Alert, Badge, Card, EmptyState, Input, Skeleton, cn, formatINR } from '../components/ui'
import { inventoryApi, errorText, formatTime, todayInDhaka } from '../inventory/api'
import { useStoreBrand } from '../components/storeBrand'
import KpiCard from '../admin_components/KpiCard'
import AIInsights from '../admin_components/AIInsights'

// Shop counter vs online. A validated pair for the light surface.
const SERIES = [
    { key: 'shop', label: 'Shop counter', color: '#059669' },
    { key: 'online', label: 'Online', color: '#2563eb' },
]

// Each payment type keeps the same colour everywhere (colour follows the method, not its rank).
const PAYMENT_COLOURS = {
    Cash: '#059669', UPI: '#2563eb', Card: '#d97706', bKash: '#db2777', Nagad: '#7c3aed',
    'Due (pay later)': '#0891b2', 'Online orders': '#64748b',
}
const paymentColour = (method) => PAYMENT_COLOURS[method] || '#94a3b8'

const hourLabel = (h) => `${h % 12 === 0 ? 12 : h % 12}${h < 12 ? 'am' : 'pm'}`
const longDate = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

// Business overview: one day's sales, stock alerts and recent activity, compared with
// the same weekday a week earlier. Every figure comes from /api/inventory/home/.
function DashboardScreen() {
    const { userInfo } = useSelector((state) => state.userLogin)
    const api = useMemo(() => inventoryApi(userInfo), [userInfo])
    const store = useStoreBrand()
    const [day, setDay] = useState(todayInDhaka())
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        setLoading(true)
        api.get(`home/?date=${day}`)
            .then((res) => { setData(res); setError('') })
            .catch((e) => setError(errorText(e)))
            .finally(() => setLoading(false))
    }, [api, day])

    const isToday = day === todayInDhaka()
    const weekday = new Date(`${day}T00:00:00`).toLocaleDateString('en-GB', { weekday: 'long' })
    const compare = `vs last ${weekday}`
    const t = data && data.today
    const lw = data && data.last_week
    const profitHasNoCosts = t && t.shop_profit > 0 && t.shop_profit === t.shop_total

    return (
        <div className="mx-auto w-full max-w-7xl space-y-6">
            {/* Page header */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h1 className="text-[22px] font-semibold tracking-tight text-slate-900">Business overview</h1>
                    <p className="mt-1 text-sm text-slate-500">Monitor your sales, inventory and business performance.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                    <label className="flex items-center gap-2">
                        <span className="sr-only">Reporting day</span>
                        <Input type="date" value={day} max={todayInDhaka()} onChange={(e) => e.target.value && setDay(e.target.value)} className="!h-9 !w-40" aria-label="Reporting day" />
                    </label>
                    {!isToday && (
                        <button type="button" onClick={() => setDay(todayInDhaka())} className="h-9 rounded-lg px-2.5 font-medium text-brand-700 hover:bg-brand-50">Today</button>
                    )}
                </div>
            </div>
            <p className="-mt-3 text-xs text-slate-500">{store.name}{store.location ? `, ${store.location}` : ''} · showing {isToday ? 'today, ' : ''}{longDate(day)}. Changes compare with the same day a week earlier.</p>

            <QuickActions />

            {error && <Alert variant="danger">{error}</Alert>}

            {/* Headline figures */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <KpiCard label="Net sales" icon={Wallet} loading={loading && !data} value={t && formatINR(t.net_sales)}
                    now={t && t.net_sales} before={lw && lw.net_sales} compareLabel={compare}
                    note={t && `${formatINR(t.shop_total)} shop · ${formatINR(t.online_total)} online`} />
                <KpiCard label="Transactions" icon={Receipt} loading={loading && !data} value={t && t.transactions.toLocaleString('en-US')}
                    now={t && t.transactions} before={lw && lw.transactions} compareLabel={compare}
                    note={t && `${t.shop_count} at the counter · ${t.online_count} online`} />
                <KpiCard label="Average sale" icon={Calculator} loading={loading && !data} value={t && formatINR(t.average_sale)}
                    now={t && t.average_sale} before={lw && lw.average_sale} compareLabel={compare} />
                <KpiCard label="Profit" icon={TrendingUp} loading={loading && !data} value={t && formatINR(t.profit)}
                    now={t && t.profit} before={lw && lw.profit} compareLabel={compare}
                    note={profitHasNoCosts ? 'Buying prices are missing, so this equals sales.' : t && `${formatINR(t.shop_profit)} counter · ${formatINR(t.online_profit)} online`} />
            </div>

            {/* Analytics */}
            <div className="grid gap-6 xl:grid-cols-3">
                <SalesByHour hourly={data && data.hourly} loading={loading && !data} />
                <PaymentTypes payments={data && data.payments} total={t && t.net_sales} loading={loading && !data} />
            </div>

            <div className="grid gap-6 xl:grid-cols-3">
                <RecentSales recent={data && data.recent} loading={loading && !data} />
                <div className="space-y-6">
                    <NeedsAttention alerts={data && data.alerts} loading={loading && !data} />
                    <TopItems items={data && data.top_items} loading={loading && !data} isToday={isToday} />
                    <AIInsights />
                </div>
            </div>
        </div>
    )
}

function Panel({ title, subtitle, action, className, children }) {
    return (
        <Card className={cn('overflow-hidden', className)}>
            <div className="flex items-center justify-between gap-3 border-b border-slate-200/70 px-4 py-3">
                <div>
                    <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
                    {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
                </div>
                {action}
            </div>
            {children}
        </Card>
    )
}

function QuickActions() {
    const actions = [
        { to: '/admin/counter', label: 'New sale', hint: 'Open the counter', icon: Store, primary: true },
        { to: '/admin/receive', label: 'Receive stock', hint: 'Record a delivery', icon: PackagePlus },
        { to: '/admin/productlist', label: 'Items', hint: 'Prices and details', icon: Package },
        { to: '/admin/orderlist', label: 'Online orders', hint: 'Check and deliver', icon: ShoppingCart },
    ]
    return (
        <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4">
            {actions.map(({ to, label, hint, icon: Icon, primary }) => (
                <Link key={to} to={to}
                    className={cn('group flex items-center gap-3 rounded-xl border px-3.5 py-3 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                        primary ? 'border-brand-600 bg-brand-600 text-white hover:bg-brand-700' : 'border-slate-200 bg-white text-slate-900 shadow-xs hover:border-slate-300 hover:bg-slate-50')}>
                    <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', primary ? 'bg-white/15' : 'bg-slate-100 text-slate-600')}>
                        <Icon className="h-[18px] w-[18px]" />
                    </span>
                    <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">{label}</span>
                        <span className={cn('block truncate text-xs', primary ? 'text-white/75' : 'text-slate-500')}>{hint}</span>
                    </span>
                    <ChevronRight className={cn('ml-auto h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5', primary ? 'text-white/70' : 'text-slate-300')} />
                </Link>
            ))}
        </div>
    )
}

function SalesByHour({ hourly, loading }) {
    const [asTable, setAsTable] = useState(false)
    const sold = (hourly || []).filter((h) => h.shop + h.online > 0).map((h) => h.hour)
    const from = Math.min(8, ...sold)
    const to = Math.max(21, ...sold)
    const rows = (hourly || []).slice(from, to + 1).map((h) => ({ ...h, label: hourLabel(h.hour) }))
    const empty = !loading && sold.length === 0

    return (
        <Panel title="Sales by hour" subtitle="Shop counter and online, by the hour the sale was made" className="xl:col-span-2"
            action={!empty && !loading && (
                <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs font-medium">
                    {[['Chart', false], ['Table', true]].map(([label, value]) => (
                        <button key={label} type="button" onClick={() => setAsTable(value)} aria-pressed={asTable === value}
                            className={cn('rounded-md px-2.5 py-1 transition-colors', asTable === value ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900')}>{label}</button>
                    ))}
                </div>
            )}>
            {loading ? (
                <div className="p-4"><Skeleton className="h-64 w-full" /></div>
            ) : empty ? (
                <EmptyState icon={BarChart3} title="No sales on this day yet" compact>Sales appear here by the hour as soon as the first bill is rung up.</EmptyState>
            ) : asTable ? (
                <div className="max-h-72 overflow-y-auto px-4 py-2">
                    <table className="figure w-full text-sm">
                        <thead><tr className="text-left text-xs text-slate-500"><th className="py-2 font-medium">Hour</th><th className="text-right font-medium">Shop</th><th className="text-right font-medium">Online</th><th className="text-right font-medium">Total</th></tr></thead>
                        <tbody className="divide-y divide-slate-100">
                            {rows.filter((r) => r.shop + r.online > 0).map((r) => (
                                <tr key={r.hour}><td className="py-2 text-slate-700">{r.label}</td><td className="text-right">{formatINR(r.shop)}</td><td className="text-right">{formatINR(r.online)}</td><td className="text-right font-semibold text-slate-900">{formatINR(r.shop + r.online)}</td></tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <>
                    <div className="flex gap-4 px-4 pt-3 text-xs text-slate-600">
                        {SERIES.map((s) => (
                            <span key={s.key} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} /> {s.label}</span>
                        ))}
                    </div>
                    <div className="h-64 px-2 pb-3 pt-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: 4 }} barCategoryGap="28%">
                                <CartesianGrid stroke="#e2e8f0" vertical={false} />
                                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} interval="preserveStartEnd" />
                                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} width={56}
                                    tickFormatter={(v) => (v >= 1000 ? `₹${Math.round(v / 100) / 10}k` : `₹${v}`)} />
                                <Tooltip cursor={{ fill: '#f1f5f9' }} content={<HourTooltip />} />
                                {/* The white stroke is the 2px gap between stacked segments. */}
                                <Bar dataKey="shop" stackId="s" fill={SERIES[0].color} stroke="#fff" strokeWidth={2} maxBarSize={24} name="Shop counter" isAnimationActive={false} />
                                <Bar dataKey="online" stackId="s" fill={SERIES[1].color} stroke="#fff" strokeWidth={2} maxBarSize={24} radius={[4, 4, 0, 0]} name="Online" isAnimationActive={false} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </>
            )}
        </Panel>
    )
}

function HourTooltip({ active, payload, label }) {
    if (!active || !payload || !payload.length) return null
    const total = payload.reduce((sum, p) => sum + (p.value || 0), 0)
    return (
        <div className="figure rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
            <p className="mb-1 font-semibold text-slate-900">{label}</p>
            {payload.map((p) => (
                <p key={p.dataKey} className="flex items-center justify-between gap-4 text-slate-600">
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ background: p.fill }} />{p.name}</span>
                    <span className="font-medium text-slate-900">{formatINR(p.value)}</span>
                </p>
            ))}
            <p className="mt-1 flex justify-between gap-4 border-t border-slate-100 pt-1 font-semibold text-slate-900"><span>Total</span><span>{formatINR(total)}</span></p>
        </div>
    )
}

function PaymentTypes({ payments, total, loading }) {
    const list = payments || []
    return (
        <Panel title="Payment types" subtitle="How customers paid">
            {loading ? (
                <div className="space-y-3 p-4"><Skeleton className="mx-auto h-32 w-32 rounded-full" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-2/3" /></div>
            ) : list.length === 0 ? (
                <EmptyState icon={CreditCard} title="No payments yet" compact>Cash, UPI, card and online payments show here once sales are made.</EmptyState>
            ) : (
                <div className="p-4">
                    <div className="relative mx-auto h-36 w-36">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={list} dataKey="total" nameKey="method" innerRadius="68%" outerRadius="100%" paddingAngle={list.length > 1 ? 2 : 0} stroke="none" isAnimationActive={false}>
                                    {list.map((p) => <Cell key={p.method} fill={paymentColour(p.method)} />)}
                                </Pie>
                                <Tooltip formatter={(v, n) => [formatINR(v), n]} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-[11px] text-slate-500">Total</span>
                            <span className="figure text-sm font-semibold text-slate-900">{formatINR(total)}</span>
                        </div>
                    </div>
                    <ul className="mt-4 space-y-2 text-sm">
                        {list.map((p) => {
                            const share = total ? Math.round((p.total / total) * 100) : 0
                            return (
                                <li key={p.method} className="flex items-center gap-2.5">
                                    <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: paymentColour(p.method) }} />
                                    <span className="flex-1 truncate text-slate-700">{p.method}</span>
                                    <span className="figure text-xs text-slate-500">{share}%</span>
                                    <span className="figure w-20 text-right font-medium text-slate-900">{formatINR(p.total)}</span>
                                </li>
                            )
                        })}
                    </ul>
                </div>
            )}
        </Panel>
    )
}

function saleStatus(r) {
    if (r.kind === 'shop') return r.due > 0 ? <Badge variant="amber">{formatINR(r.due)} due</Badge> : <Badge variant="green">Paid</Badge>
    if (r.delivered) return <Badge variant="green">Delivered</Badge>
    return r.paid ? <Badge variant="sky">To deliver</Badge> : <Badge variant="slate">Awaiting payment</Badge>
}

function whenText(iso) {
    if (!iso) return ''
    const d = new Date(iso)
    const today = new Date()
    if (d.toDateString() === today.toDateString()) return `Today, ${formatTime(iso)}`
    return `${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}, ${formatTime(iso)}`
}

function RecentSales({ recent, loading }) {
    return (
        <Panel title="Recent sales" subtitle="Latest counter sales and online orders" className="xl:col-span-2"
            action={<Link to="/admin/sales" className="inline-flex items-center gap-0.5 text-xs font-semibold text-brand-700 hover:underline">All sales <ChevronRight className="h-3.5 w-3.5" /></Link>}>
            {loading ? (
                <div className="space-y-2 p-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}</div>
            ) : !recent || recent.length === 0 ? (
                <EmptyState icon={Inbox} title="No sales yet" compact>Counter sales and online orders will be listed here.</EmptyState>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200/70 bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                <th className="px-4 py-2">Reference</th><th className="px-3 py-2">Date & time</th><th className="px-3 py-2">Channel</th>
                                <th className="px-3 py-2">Payment</th><th className="px-3 py-2">Status</th><th className="px-4 py-2 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {recent.map((r) => (
                                <tr key={`${r.kind}-${r.id}`} className="transition-colors hover:bg-slate-50">
                                    <td className="px-4 py-2.5">
                                        <Link to={r.kind === 'online' ? `/admin/order/${r.id}` : '/admin/sales'} className="font-medium text-slate-900 hover:text-brand-700">
                                            {r.kind === 'online' ? 'ORD' : 'POS'}-{String(r.id).padStart(4, '0')}
                                        </Link>
                                        {r.customer && <span className="block max-w-[10rem] truncate text-xs text-slate-500">{r.customer}</span>}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-2.5 text-slate-600">{whenText(r.createdAt)}</td>
                                    <td className="px-3 py-2.5">
                                        <span className="inline-flex items-center gap-1.5 text-slate-700">
                                            {r.kind === 'online' ? <ShoppingCart className="h-3.5 w-3.5 text-slate-400" /> : <Store className="h-3.5 w-3.5 text-slate-400" />}
                                            {r.kind === 'online' ? 'Online' : 'Counter'}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2.5 text-slate-600">{r.method}</td>
                                    <td className="px-3 py-2.5">{saleStatus(r)}</td>
                                    <td className="figure px-4 py-2.5 text-right font-semibold text-slate-900">{formatINR(r.total)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </Panel>
    )
}

function NeedsAttention({ alerts, loading }) {
    const items = alerts ? [
        { show: alerts.out_of_stock, level: 'critical', icon: PackageX, title: `${alerts.out_of_stock} out of stock`, text: 'Customers can\'t buy these', to: '/admin/stock' },
        { show: alerts.expiring, level: 'warning', icon: CalendarClock, title: `${alerts.expiring} batch${alerts.expiring === 1 ? '' : 'es'} expiring`, text: 'Within the next 7 days', to: '/admin/stock' },
        { show: alerts.low_stock, level: 'warning', icon: AlertTriangle, title: `${alerts.low_stock} running low`, text: 'At or below the warning level', to: '/admin/stock' },
        { show: alerts.dues_count, level: 'warning', icon: HandCoins, title: `${formatINR(alerts.dues_total)} owed`, text: `On ${alerts.dues_count} unpaid bill${alerts.dues_count === 1 ? '' : 's'}`, to: '/admin/sales' },
        { show: alerts.online_to_ship, level: 'info', icon: Truck, title: `${alerts.online_to_ship} order${alerts.online_to_ship === 1 ? '' : 's'} to deliver`, text: 'Online orders not yet delivered', to: '/admin/orderlist' },
    ].filter((a) => a.show) : []
    const tone = {
        critical: 'bg-rose-50 text-rose-600',
        warning: 'bg-amber-50 text-amber-600',
        info: 'bg-sky-50 text-sky-600',
    }
    return (
        <Panel title="Needs attention" action={items.length > 0 && <span className="figure rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{items.length}</span>}>
            {loading ? (
                <div className="space-y-2 p-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : items.length === 0 ? (
                <div className="flex items-center gap-3 px-4 py-4 text-sm">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <span className="text-slate-600">All clear. Nothing needs attention.</span>
                </div>
            ) : (
                <ul className="divide-y divide-slate-100">
                    {items.map(({ level, icon: Icon, title, text, to }) => (
                        <li key={title}>
                            <Link to={to} className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-slate-50">
                                <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', tone[level])}><Icon className="h-4 w-4" /></span>
                                <span className="min-w-0 flex-1">
                                    <span className="figure block truncate text-sm font-medium text-slate-900">{title}</span>
                                    <span className="block truncate text-xs text-slate-500">{text}</span>
                                </span>
                                <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </Panel>
    )
}

function TopItems({ items, loading, isToday }) {
    return (
        <Panel title={isToday ? 'Top items today' : 'Top items that day'}>
            {loading ? (
                <div className="space-y-2 p-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}</div>
            ) : !items || items.length === 0 ? (
                <p className="px-4 py-4 text-sm text-slate-500">Nothing sold yet.</p>
            ) : (
                <ol className="divide-y divide-slate-100">
                    {items.map((t, i) => (
                        <li key={t.name} className="flex items-center gap-3 px-4 py-2 text-sm">
                            <span className="figure w-4 text-xs font-semibold text-slate-400">{i + 1}</span>
                            <span className="flex-1 truncate text-slate-800">{t.name}</span>
                            <span className="figure font-medium text-slate-900">{t.qty} {t.unit}</span>
                        </li>
                    ))}
                </ol>
            )}
        </Panel>
    )
}

export default DashboardScreen
