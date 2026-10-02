import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Search, Minus, Plus, Trash2, Printer, ShoppingBasket, RotateCcw, X, Keyboard } from 'lucide-react'
import { Alert, Button, Card, Input, Modal, Spinner, cn, formatTk } from '../../components/ui'
import categories from '../../components/categories'
import Receipt from '../../inventory/Receipt'
import { useAdminGuard, inventoryApi, errorText, PAYMENT_METHODS, formatTime } from '../../inventory/api'

// Point of sale for the shop counter: pick items, take payment, print a receipt.
// Built for staff at a busy counter: big targets, keyboard shortcuts, and a bill that
// survives an accidental reload.
function CounterSaleScreen({ history }) {
    const { userInfo, isAdmin } = useAdminGuard(history)
    const api = useMemo(() => inventoryApi(userInfo), [userInfo])
    const draftKey = `counterDraft:${userInfo ? userInfo._id : 'anon'}`

    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState('')
    const [query, setQuery] = useState('')
    const [category, setCategory] = useState('')

    const [cart, setCart] = useState([])
    const [discount, setDiscount] = useState('')
    const [payment, setPayment] = useState('cash')
    const [customerName, setCustomerName] = useState('')
    const [customerPhone, setCustomerPhone] = useState('')
    const [amountPaid, setAmountPaid] = useState('')
    const [cashGiven, setCashGiven] = useState('')

    const [saving, setSaving] = useState(false)
    const [saleError, setSaleError] = useState('')
    const [receipt, setReceipt] = useState(null)
    const [lastSale, setLastSale] = useState(null)
    const [today, setToday] = useState(null)
    const [confirmClear, setConfirmClear] = useState(false)
    const [flashId, setFlashId] = useState(null)
    const [restored, setRestored] = useState(false)

    const searchRef = useRef(null)
    const billRef = useRef(null)
    const draftLoaded = useRef(false)

    const loadProducts = useCallback(() => {
        setLoading(true)
        return api.get('products/')
            .then((data) => { setProducts(data); setLoadError(''); return data })
            .catch((e) => { setLoadError(errorText(e)); return null })
            .finally(() => setLoading(false))
    }, [api])

    const loadToday = useCallback(() => {
        api.get('sales/').then((data) => {
            const sales = data.sales || []
            setToday({ count: sales.length, total: sales.reduce((sum, s) => sum + s.total, 0) })
        }).catch(() => {})
    }, [api])

    // First load: fetch products, then bring back any bill left open before a reload.
    useEffect(() => {
        if (!isAdmin) return
        loadToday()
        loadProducts().then((data) => {
            if (!data || draftLoaded.current) return
            draftLoaded.current = true
            try {
                const draft = JSON.parse(localStorage.getItem(draftKey) || 'null')
                if (!draft || !draft.cart || draft.cart.length === 0) return
                const byId = Object.fromEntries(data.map((p) => [p._id, p]))
                const lines = draft.cart
                    .filter((l) => byId[l.id] && byId[l.id].countInStock > 0)
                    .map((l) => ({ product: byId[l.id], qty: Math.min(l.qty, byId[l.id].countInStock) }))
                if (lines.length === 0) return
                setCart(lines)
                setDiscount(draft.discount || '')
                setPayment(draft.payment || 'cash')
                setCustomerName(draft.customerName || '')
                setCustomerPhone(draft.customerPhone || '')
                setRestored(true)
            } catch (e) { /* storage unavailable or corrupt: start with an empty bill */ }
        })
    }, [isAdmin, loadProducts, loadToday, draftKey])

    // Keep the open bill in this browser so a reload or a trip to another page doesn't lose it.
    useEffect(() => {
        if (!draftLoaded.current) return
        try {
            if (cart.length === 0) localStorage.removeItem(draftKey)
            else localStorage.setItem(draftKey, JSON.stringify({
                cart: cart.map((l) => ({ id: l.product._id, qty: Number(l.qty) || 1 })),
                discount, payment, customerName, customerPhone,
            }))
        } catch (e) { /* ignore */ }
    }, [cart, discount, payment, customerName, customerPhone, draftKey])

    const visible = products
        .filter((p) => {
            const text = `${p.name} ${p.category}`.toLowerCase()
            const matchesQuery = !query || query.toLowerCase().split(/\s+/).every((word) => text.includes(word))
            const matchesCategory = !category || (p.category || '').toLowerCase().includes(category)
            return matchesQuery && matchesCategory
        })
        // Items that can be sold first, sold-out items last.
        .sort((a, b) => (b.countInStock > 0) - (a.countInStock > 0))

    const inCart = (id) => cart.find((line) => line.product._id === id)

    const flash = (id) => {
        setFlashId(id)
        setTimeout(() => setFlashId((current) => (current === id ? null : current)), 900)
        setTimeout(() => {
            const el = document.getElementById(`bill-line-${id}`)
            if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
        }, 0)
    }

    const addToCart = (product) => {
        if (product.countInStock <= 0) return
        setSaleError('')
        setRestored(false)
        setCart((lines) => {
            const line = lines.find((l) => l.product._id === product._id)
            if (line) {
                return lines.map((l) => l.product._id === product._id
                    ? { ...l, qty: Math.min((Number(l.qty) || 0) + 1, product.countInStock) } : l)
            }
            return [...lines, { product, qty: 1 }]
        })
        flash(product._id)
    }

    const updateLine = (id, changes) =>
        setCart((lines) => lines.map((l) => (l.product._id === id ? { ...l, ...changes } : l)))

    const removeLine = (id) => setCart((lines) => lines.filter((l) => l.product._id !== id))

    const itemCount = cart.reduce((n, l) => n + (Number(l.qty) || 0), 0)
    const subtotal = cart.reduce((sum, l) => sum + l.product.selling_price * (Number(l.qty) || 0), 0)
    const discountValue = Math.min(Number(discount) || 0, subtotal)
    const total = Math.max(subtotal - discountValue, 0)
    const cashValue = Number(cashGiven) || 0
    const change = payment === 'cash' && cashValue > total ? cashValue - total : 0
    const short = payment === 'cash' && cashGiven !== '' && cashValue < total ? total - cashValue : 0
    const overStock = cart.some((l) => Number(l.qty) > l.product.countInStock)
    const badQty = cart.some((l) => !(Number(l.qty) >= 1))

    // Suggested cash amounts: the next round notes above the total.
    const quickCash = useMemo(() => {
        if (total <= 0) return []
        const steps = [100, 500, 1000]
        const amounts = steps.map((s) => Math.ceil(total / s) * s).filter((a) => a > total)
        return [...new Set(amounts)].slice(0, 3)
    }, [total])

    // Why the sale can't be completed yet, in plain words.
    let blocker = ''
    if (cart.length === 0) blocker = 'Add items to start a bill.'
    else if (badQty) blocker = 'Every item needs a quantity of at least 1.'
    else if (overStock) blocker = 'One item has more than the stock available.'
    else if (Number(discount) > subtotal) blocker = 'The discount is more than the bill.'
    else if (payment === 'cash' && total > 0 && cashGiven === '') blocker = 'Enter the cash the customer gave, or tap Exact.'
    else if (short > 0) blocker = `Cash given is ${formatTk(short)} short.`
    else if (payment === 'due' && !(customerName.trim() && customerPhone.trim())) blocker = 'A due sale needs the customer name and phone.'

    const resetSale = () => {
        setCart([]); setDiscount(''); setPayment('cash'); setCustomerName('')
        setCustomerPhone(''); setAmountPaid(''); setCashGiven(''); setSaleError(''); setRestored(false)
    }

    const focusSearch = () => {
        if (searchRef.current) { searchRef.current.focus(); searchRef.current.select() }
    }

    const completeSale = () => {
        if (blocker || saving) return
        setSaving(true)
        setSaleError('')
        api.post('sales/', {
            payment_method: payment,
            discount: discountValue,
            customer_name: customerName,
            customer_phone: customerPhone,
            amount_paid: payment === 'due' ? (amountPaid || 0) : undefined,
            items: cart.map((l) => ({ product: l.product._id, qty: Number(l.qty) })),
        })
            .then((sale) => {
                // Remember the cash and change for the receipt screen.
                setReceipt({ ...sale, cashGiven: payment === 'cash' && cashValue > 0 ? cashValue : null, change })
                setLastSale(sale)
                resetSale()
                loadProducts()
                loadToday()
            })
            .catch((e) => setSaleError(errorText(e)))
            .finally(() => setSaving(false))
    }

    const closeReceipt = () => {
        setReceipt(null)
        setTimeout(focusSearch, 50)
    }

    // Keyboard shortcuts. A ref keeps the handler pointing at the latest state.
    const shortcuts = useRef({})
    shortcuts.current = { completeSale, focusSearch, receiptOpen: Boolean(receipt) || confirmClear }
    useEffect(() => {
        const onKey = (e) => {
            const s = shortcuts.current
            if (s.receiptOpen) return
            const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement && document.activeElement.tagName)
            if (e.key === 'F9' || ((e.ctrlKey || e.metaKey) && e.key === 'Enter')) {
                e.preventDefault(); s.completeSale()
            } else if (e.key === 'F2' || (e.key === '/' && !typing)) {
                e.preventDefault(); s.focusSearch()
            }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [])

    const onSearchKey = (e) => {
        if (e.key === 'Enter' && !(e.ctrlKey || e.metaKey)) {
            const first = visible.find((p) => p.countInStock > 0)
            if (first) { addToCart(first); setQuery('') }
        } else if (e.key === 'Escape') {
            setQuery('')
        }
    }

    return (
        <div className="flex flex-col lg:h-full">
            <div className="flex flex-1 flex-col gap-4 p-4 lg:grid lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_22rem]">
                {/* Product picker */}
                <div className="flex min-w-0 flex-col lg:min-h-0">
                    <div className="relative mb-3 shrink-0">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                        <Input
                            ref={searchRef}
                            autoFocus
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={onSearchKey}
                            placeholder="Type an item name, then press Enter to add it"
                            className="!h-12 pl-12 pr-10 text-base"
                            aria-label="Search items"
                        />
                        {query && (
                            <button type="button" onClick={() => { setQuery(''); focusSearch() }} aria-label="Clear search"
                                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                    <div className="mb-3 flex shrink-0 gap-2 overflow-x-auto pb-1">
                        <Chip active={!category} onClick={() => setCategory('')}>All</Chip>
                        {categories.map((c) => (
                            <Chip key={c.keyword} active={category === c.keyword} onClick={() => setCategory(c.keyword)}>
                                {c.label}
                            </Chip>
                        ))}
                    </div>

                    <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1">
                        {loading && products.length === 0 ? <Spinner /> : loadError ? <Alert variant="danger">{loadError}</Alert> : (
                            <div className="grid grid-cols-3 gap-2 pb-4 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8">
                                {visible.map((p, i) => {
                                    const line = inCart(p._id)
                                    const soldOut = p.countInStock <= 0
                                    const maxed = line && Number(line.qty) >= p.countInStock
                                    const isFirstMatch = query && i === 0 && !soldOut
                                    return (
                                        <button
                                            key={p._id}
                                            type="button"
                                            disabled={soldOut || maxed}
                                            onClick={() => addToCart(p)}
                                            className={cn(
                                                'relative flex flex-col overflow-hidden rounded-xl border-2 bg-white text-left shadow-sm transition active:scale-[0.97] hover:border-brand-400 hover:shadow disabled:cursor-not-allowed disabled:active:scale-100',
                                                soldOut && 'opacity-45',
                                                line ? 'border-brand-500' : isFirstMatch ? 'border-brand-300 border-dashed' : 'border-transparent'
                                            )}
                                        >
                                            {p.image && <img src={p.image} alt="" className="h-16 w-full object-cover" />}
                                            {line && (
                                                <span className="absolute right-1.5 top-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-brand-600 px-1.5 text-xs font-bold text-white shadow">{line.qty}</span>
                                            )}
                                            {soldOut && (
                                                <span className="absolute left-1.5 top-1.5 rounded-full bg-slate-900/80 px-1.5 py-0.5 text-[10px] font-semibold text-white">Sold out</span>
                                            )}
                                            <div className="flex flex-1 flex-col px-2 py-1.5">
                                                <p className="line-clamp-2 text-xs font-semibold leading-snug text-slate-900">{p.name}</p>
                                                <p className="mt-auto pt-1 text-sm font-bold text-brand-700">
                                                    {formatTk(p.selling_price)}<span className="text-xs font-normal text-slate-500"> / {p.unit}</span>
                                                </p>
                                                <p className={cn('text-[11px] leading-tight', soldOut ? 'text-rose-600' : p.low_stock ? 'font-semibold text-amber-600' : 'text-slate-500')}>
                                                    {soldOut ? 'Out of stock' : maxed ? 'All stock is on the bill' : p.low_stock ? `Only ${p.countInStock} left` : `${p.countInStock} ${p.unit} in stock`}
                                                </p>
                                            </div>
                                            {isFirstMatch && (
                                                <span className="absolute bottom-1.5 right-1.5 rounded bg-brand-50 px-1 py-0.5 text-[10px] font-semibold text-brand-700">Enter</span>
                                            )}
                                        </button>
                                    )
                                })}
                                {visible.length === 0 && (
                                    <div className="col-span-full py-12 text-center text-slate-500">
                                        No items match "{query}".{' '}
                                        <button type="button" className="font-semibold text-brand-700 hover:underline" onClick={() => { setQuery(''); setCategory('') }}>Show all items</button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <p className="hidden shrink-0 items-center gap-3 pt-2 text-xs text-slate-400 lg:flex">
                        <Keyboard className="h-3.5 w-3.5" />
                        <span><Kbd>/</Kbd> search</span>
                        <span><Kbd>Enter</Kbd> add first match</span>
                        <span><Kbd>Esc</Kbd> clear search</span>
                        <span><Kbd>F9</Kbd> or <Kbd>Ctrl</Kbd>+<Kbd>Enter</Kbd> complete sale</span>
                    </p>
                </div>

                {/* Bill */}
                <Card className="flex scroll-mt-4 flex-col lg:min-h-0">
                    <div ref={billRef} />
                    <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-100 px-4 py-2">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900">Current bill {itemCount > 0 && <span className="font-normal text-slate-500">· {itemCount} {itemCount === 1 ? 'item' : 'items'}</span>}</h3>
                            {today && <p className="text-xs text-slate-500">Today: {today.count} {today.count === 1 ? 'bill' : 'bills'} · {formatTk(today.total)}</p>}
                        </div>
                        <div className="flex gap-1">
                            {lastSale && (
                                <Button variant="ghost" size="sm" className="!h-7 !px-2" onClick={() => setReceipt(lastSale)} title={`Reprint bill #${lastSale.id} from ${formatTime(lastSale.createdAt)}`}>
                                    <Printer className="h-3.5 w-3.5" /> Last receipt
                                </Button>
                            )}
                            {cart.length > 0 && (
                                <Button variant="ghost" size="sm" className="!h-7 !px-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700" onClick={() => setConfirmClear(true)}>
                                    <RotateCcw className="h-3.5 w-3.5" /> Clear
                                </Button>
                            )}
                        </div>
                    </div>

                    {restored && (
                        <div className="shrink-0 border-b border-amber-100 bg-amber-50 px-4 py-1.5 text-xs text-amber-800">
                            This bill was still open, so it has been brought back.
                        </div>
                    )}

                    {cart.length === 0 ? (
                        <div className="flex flex-1 flex-col items-center justify-center gap-1.5 px-4 py-8 text-center text-xs text-slate-500">
                            <ShoppingBasket className="h-8 w-8 text-slate-300" />
                            <p className="font-medium text-slate-600">The bill is empty</p>
                            <p>Tap an item, or type its name and press Enter.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
                            {cart.map((l) => {
                                const over = Number(l.qty) > l.product.countInStock
                                return (
                                    <div key={l.product._id} id={`bill-line-${l.product._id}`}
                                        className={cn('px-4 py-2 transition-colors duration-700', flashId === l.product._id && 'bg-brand-50')}>
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="text-xs font-semibold text-slate-900">{l.product.name}</p>
                                            <p className="shrink-0 text-xs font-bold text-slate-900">
                                                {formatTk(l.product.selling_price * (Number(l.qty) || 0))}
                                            </p>
                                        </div>
                                        <div className="mt-1.5 flex items-center gap-1.5">
                                            <Button variant="secondary" size="icon" className="!h-7 !w-7" aria-label="One less"
                                                onClick={() => (Number(l.qty) > 1 ? updateLine(l.product._id, { qty: Number(l.qty) - 1 }) : removeLine(l.product._id))}>
                                                {Number(l.qty) > 1 ? <Minus className="h-3.5 w-3.5" /> : <Trash2 className="h-3.5 w-3.5 text-rose-500" />}
                                            </Button>
                                            <Input type="number" min="1" inputMode="numeric" value={l.qty} aria-label={`Quantity of ${l.product.name}`}
                                                onFocus={(e) => e.target.select()}
                                                onChange={(e) => updateLine(l.product._id, { qty: e.target.value })}
                                                className={cn('!h-7 !w-12 !px-1 text-center text-sm font-semibold [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none', over && '!border-rose-400')} />
                                            <Button variant="secondary" size="icon" className="!h-7 !w-7" aria-label="One more"
                                                disabled={Number(l.qty) >= l.product.countInStock}
                                                onClick={() => updateLine(l.product._id, { qty: (Number(l.qty) || 0) + 1 })}>
                                                <Plus className="h-3.5 w-3.5" />
                                            </Button>
                                            <span className="text-xs text-slate-500">{l.product.unit} × {formatTk(l.product.selling_price)}</span>
                                        </div>
                                        {over && <p className="mt-1 text-xs font-medium text-rose-600">Only {l.product.countInStock} {l.product.unit} in stock.</p>}
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    <div className="mt-auto shrink-0 space-y-2 border-t border-slate-100 px-4 py-3">
                        <div className="grid grid-cols-2 gap-2">
                            <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                                placeholder={payment === 'due' ? 'Customer name (required)' : 'Customer name'}
                                aria-label="Customer name"
                                className={cn('!h-8 text-xs', payment === 'due' && !customerName.trim() && '!border-amber-400')} />
                            <Input type="tel" inputMode="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)}
                                placeholder={payment === 'due' ? 'Phone (required)' : 'Phone'}
                                aria-label="Customer phone"
                                className={cn('!h-8 text-xs', payment === 'due' && !customerPhone.trim() && '!border-amber-400')} />
                        </div>

                        <div className="flex items-center justify-between gap-3 text-xs text-slate-600">
                            <span>Subtotal <span className="font-semibold text-slate-900">{formatTk(subtotal)}</span></span>
                            <label className="flex items-center gap-2">
                                Discount
                                <Input type="number" min="0" inputMode="decimal" value={discount} placeholder="0"
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) => setDiscount(e.target.value)} className="!h-8 !w-20 text-right text-xs" />
                            </label>
                        </div>

                        <div className="flex items-baseline justify-between rounded-lg bg-slate-900 px-3 py-2 text-white">
                            <span className="text-xs font-medium text-slate-300">Total to pay</span>
                            <span className="text-xl font-bold tracking-tight">{formatTk(total)}</span>
                        </div>

                        <div className="grid grid-cols-5 gap-1">
                            {PAYMENT_METHODS.map((m) => (
                                <button key={m.value} type="button" onClick={() => setPayment(m.value)}
                                    className={cn('rounded-md py-1.5 text-xs font-semibold ring-1 ring-inset transition',
                                        payment === m.value
                                            ? (m.value === 'due' ? 'bg-amber-500 text-white ring-amber-500' : 'bg-brand-600 text-white ring-brand-600')
                                            : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50')}>
                                    {m.label}
                                </button>
                            ))}
                        </div>

                        {payment === 'cash' && total > 0 && (
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-1">
                                    <QuickCash active={cashValue === total} onClick={() => setCashGiven(String(total))}>Exact</QuickCash>
                                    {quickCash.map((a) => (
                                        <QuickCash key={a} active={cashValue === a} onClick={() => setCashGiven(String(a))}>{formatTk(a)}</QuickCash>
                                    ))}
                                    <Input type="number" min="0" inputMode="decimal" value={cashGiven} placeholder="Cash"
                                        onFocus={(e) => e.target.select()}
                                        onChange={(e) => setCashGiven(e.target.value)} aria-label="Cash given"
                                        className={cn('!h-8 min-w-0 flex-1 !px-2 text-right text-xs [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none', cashGiven === '' && cart.length > 0 && '!border-amber-400')} />
                                </div>
                                {change > 0 && (
                                    <div className="flex items-baseline justify-between rounded-lg bg-emerald-50 px-3 py-1.5 text-emerald-800">
                                        <span className="text-xs font-medium">Give change</span>
                                        <span className="text-lg font-bold">{formatTk(change)}</span>
                                    </div>
                                )}
                                {short > 0 && (
                                    <div className="flex items-baseline justify-between rounded-lg bg-rose-50 px-3 py-1.5 text-rose-700">
                                        <span className="text-xs font-medium">Still needed</span>
                                        <span className="text-base font-bold">{formatTk(short)}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {payment === 'due' && (
                            <div className="flex items-center justify-between gap-2 rounded-lg bg-amber-50 px-3 py-1.5 text-xs text-amber-800">
                                <label htmlFor="amountPaid">Paid now <span className="text-xs">(the rest is owed)</span></label>
                                <Input id="amountPaid" type="number" min="0" inputMode="decimal" value={amountPaid} placeholder="0"
                                    onChange={(e) => setAmountPaid(e.target.value)} className="!h-8 !w-24 text-right text-xs" />
                            </div>
                        )}

                        {saleError && <Alert variant="danger">{saleError}</Alert>}

                        <Button block disabled={Boolean(blocker) || saving} onClick={completeSale}>
                            {saving ? 'Saving…' : cart.length ? `Complete sale · ${formatTk(total)}` : 'Complete sale'}
                        </Button>
                        <p className={cn('text-center text-[11px]', blocker && cart.length ? 'font-medium text-rose-600' : 'text-slate-400')}>
                            {blocker || 'Press F9 or Ctrl+Enter to complete the sale.'}
                        </p>
                    </div>
                </Card>
            </div>

            {/* On phones the bill sits below the products, so keep the total in reach. */}
            {cart.length > 0 && (
                <div className="sticky bottom-0 z-10 border-t border-slate-200 bg-white p-3 lg:hidden">
                    <Button block size="lg" onClick={() => billRef.current && billRef.current.scrollIntoView({ behavior: 'smooth' })}>
                        View bill · {itemCount} {itemCount === 1 ? 'item' : 'items'} · {formatTk(total)}
                    </Button>
                </div>
            )}

            <Modal show={Boolean(receipt)} onClose={closeReceipt} title={receipt && receipt.cashGiven !== undefined ? 'Sale complete' : 'Receipt'}>
                {receipt && receipt.change > 0 && (
                    <div className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-center text-emerald-800">
                        <p className="text-sm">Give the customer</p>
                        <p className="text-3xl font-bold">{formatTk(receipt.change)}</p>
                        <p className="text-xs">change from {formatTk(receipt.cashGiven)}</p>
                    </div>
                )}
                <Receipt sale={receipt} />
                <div className="mt-5 flex gap-2">
                    <Button block variant="secondary" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print receipt</Button>
                    <Button block autoFocus onClick={closeReceipt}>Next customer</Button>
                </div>
                <p className="mt-2 text-center text-xs text-slate-400">Press Enter for the next customer.</p>
            </Modal>

            <Modal show={confirmClear} onClose={() => setConfirmClear(false)} title="Clear this bill?" size="sm">
                <p className="text-sm text-slate-600">{itemCount === 1 ? 'The item' : `All ${itemCount} items`} will be removed. Nothing is sold and stock does not change.</p>
                <div className="mt-5 flex gap-2">
                    <Button block variant="secondary" autoFocus onClick={() => setConfirmClear(false)}>Keep bill</Button>
                    <Button block variant="danger" onClick={() => { resetSale(); setConfirmClear(false); focusSearch() }}>Clear bill</Button>
                </div>
            </Modal>
        </div>
    )
}

function Chip({ active, onClick, children }) {
    return (
        <button type="button" onClick={onClick}
            className={cn('shrink-0 rounded-full px-4 py-2 text-sm font-medium ring-1 ring-inset transition',
                active ? 'bg-slate-900 text-white ring-slate-900' : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50')}>
            {children}
        </button>
    )
}

function QuickCash({ active, onClick, children }) {
    return (
        <button type="button" onClick={onClick}
            className={cn('h-8 shrink-0 rounded-md px-2 text-xs font-semibold ring-1 ring-inset transition',
                active ? 'bg-emerald-600 text-white ring-emerald-600' : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50')}>
            {children}
        </button>
    )
}

function Kbd({ children }) {
    return <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-sans text-[11px] font-semibold text-slate-500">{children}</kbd>
}

export default CounterSaleScreen
