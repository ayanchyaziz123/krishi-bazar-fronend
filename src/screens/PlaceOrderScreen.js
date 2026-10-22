import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Truck, Store, CalendarDays, Pencil, Minus, Plus, Trash2, CheckCircle2, Ticket, ShieldCheck, Phone, MessageSquareText } from 'lucide-react'
import CheckoutSteps, { CheckoutBar, PriceDetails, checkoutButton } from '../components/CheckoutSteps'
import { Alert, Container, Input, Textarea, cn, formatINR } from '../components/ui'
import { addToCart, removeFromCart } from '../actions/cartActions'
import { useStoreBrand } from '../components/storeBrand'
import {
    addressLines, cartTotals, qtyStep, qtyText, getCheckoutAddress, getCheckoutCoupon, getDeliveryMethod, getDeliveryNote, setCheckoutCoupon, setDeliveryNote, shippingRules, unitPrice,
} from '../components/shop/checkout'

// The delivery card at the top of the summary and payment steps.
export function DeliveryCard({ pickup }) {
    const store = useStoreBrand()
    const rules = shippingRules(store)
    const { userInfo } = useSelector((state) => state.userLogin)
    const address = getCheckoutAddress() || {}
    const Icon = pickup ? Store : Truck
    const [line1, line2] = addressLines(address)
    const when = pickup ? (rules.pickupTime || 'We will tell you when it is ready') : (rules.deliveryTime ? `Delivery in ${rules.deliveryTime}` : 'We will confirm the delivery time')
    return (
        <section className="rounded-2xl bg-white p-4 shadow-xs ring-1 ring-slate-200/70">
            <p className="flex items-center gap-2 font-bold text-slate-900"><Icon className="h-5 w-5 text-red-500" /> {pickup ? 'Store pick-up' : 'Home delivery'}</p>
            <div className="mt-2 pl-7 text-[15px] text-slate-700">
                {pickup ? (
                    <>
                        <p className="font-semibold text-slate-900">{userInfo && userInfo.name}</p>
                        <p>{store.name}{store.address ? `, ${store.address}` : ''}{store.location && !(store.address || '').includes(store.location) ? `, ${store.location}` : ''}</p>
                    </>
                ) : (
                    <>
                        <p className="font-semibold text-slate-900">{address.full_name}</p>
                        <p>{line1}</p>
                        <p>{line2}</p>
                        {address.phone && <p className="mt-1 flex items-center gap-1 text-sm text-slate-500"><Phone className="h-3.5 w-3.5" /> {address.phone}</p>}
                    </>
                )}
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-sm">
                <span className="flex items-center gap-2 text-slate-700"><CalendarDays className="h-4 w-4" /> {when}</span>
                <Link to="/shipping" className="inline-flex shrink-0 items-center gap-1 font-semibold text-blue-600">Change <Pencil className="h-3.5 w-3.5" /></Link>
            </div>
        </section>
    )
}

// Step 2: check the items, quantities, coupon and price before choosing how to pay.
function PlaceOrderScreen({ history }) {
    const dispatch = useDispatch()
    const { userInfo } = useSelector((state) => state.userLogin)
    const { cartItems } = useSelector((state) => state.cart)
    const rules = shippingRules(useStoreBrand())
    const pickup = getDeliveryMethod() === 'pickup'
    const [note, setNote] = useState(getDeliveryNote)
    const [coupon, setCoupon] = useState(getCheckoutCoupon)
    const [code, setCode] = useState(coupon ? coupon.code : '')
    const [couponState, setCouponState] = useState(coupon ? 'valid' : '')

    useEffect(() => {
        if (!userInfo) history.replace('/login?redirect=shipping')
        else if (!cartItems.length) history.replace('/cart')
        else if (!pickup && !getCheckoutAddress()) history.replace('/shipping')
    }, [userInfo, cartItems.length, pickup, history])

    const checkCoupon = (e) => {
        e.preventDefault()
        if (!code.trim()) return
        setCouponState('checking')
        // The server checks the code against the signed-in customer.
        axios.post('/api/products/coupon_check/', { coupon_code: code.trim() }, { headers: { Authorization: `Bearer ${userInfo.token}` } })
            .then(({ data }) => {
                if (Number(data.status) === 3) {
                    const next = { id: data.coupon_id, discount: Number(data.total_discount), code: code.trim() }
                    setCoupon(next); setCheckoutCoupon(next); setCouponState('valid')
                } else {
                    setCoupon(null); setCheckoutCoupon(null); setCouponState('invalid')
                }
            })
            .catch(() => setCouponState('error'))
    }
    const removeCoupon = () => { setCoupon(null); setCheckoutCoupon(null); setCode(''); setCouponState('') }

    const totals = cartTotals(cartItems, { pickup, rules, discount: coupon ? coupon.discount : 0 })
    const belowMinimum = totals.items < rules.minOrder
    if (!userInfo || !cartItems.length) return null

    return (
        <Container className="max-w-3xl space-y-5 pb-28 md:pb-0">
            <CheckoutSteps current={1} />
            <DeliveryCard pickup={pickup} />

            <ul className="space-y-3">
                {cartItems.map((item) => {
                    const unit = unitPrice(item)
                    const qty = Number(item.qty)
                    return (
                        <li key={item.product} className="rounded-2xl bg-white p-4 shadow-xs ring-1 ring-slate-200/70">
                            <div className="flex gap-4">
                                <Link to={`/product/${item.product}`} className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-50">
                                    {item.image && <img src={item.image} alt="" className="h-full w-full object-cover" />}
                                </Link>
                                <div className="min-w-0 flex-1">
                                    <Link to={`/product/${item.product}`} className="line-clamp-2 font-bold leading-snug text-slate-900">{item.name}</Link>
                                    <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                                        <span className="text-lg font-extrabold text-red-600">{formatINR(unit)}</span>
                                        {item.offer_percentage > 0 && (
                                            <>
                                                <span className="text-sm text-slate-400 line-through">{formatINR(item.price)}</span>
                                                <span className="rounded-md bg-red-600 px-1.5 py-0.5 text-[11px] font-bold text-white">-{item.offer_percentage}%</span>
                                            </>
                                        )}
                                    </div>
                                    {item.offer_percentage > 0 && <p className="mt-1 inline-block rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">Save {formatINR((item.price - unit) * qty)}</p>}
                                    <p className="mt-1 flex items-center gap-1 text-sm text-emerald-600"><CheckCircle2 className="h-4 w-4" /> In stock</p>
                                </div>
                            </div>
                            <div className="mt-3 flex items-center gap-3">
                                <div className="inline-flex h-10 items-center rounded-xl ring-1 ring-slate-200">
                                    <button type="button" aria-label="One less" disabled={qty <= qtyStep(item)} onClick={() => dispatch(addToCart(item.product, qty - qtyStep(item)))}
                                        className="flex h-full w-10 items-center justify-center disabled:text-slate-300"><Minus className="h-4 w-4" /></button>
                                    <span className="min-w-7 px-1 text-center font-semibold tabular-nums">{qtyText(qty, item)}</span>
                                    <button type="button" aria-label="One more" disabled={qty + qtyStep(item) > item.countInStock} onClick={() => dispatch(addToCart(item.product, qty + qtyStep(item)))}
                                        className="flex h-full w-10 items-center justify-center disabled:text-slate-300"><Plus className="h-4 w-4" /></button>
                                </div>
                                <span className="text-sm text-slate-500">= <strong className="text-slate-900">{formatINR(unit * qty)}</strong></span>
                                <button type="button" onClick={() => dispatch(removeFromCart(item.product))} aria-label={`Remove ${item.name}`}
                                    className="ml-auto flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-slate-200 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
                            </div>
                        </li>
                    )
                })}
            </ul>

            <section className="rounded-2xl bg-white p-4 shadow-xs ring-1 ring-slate-200/70">
                <p className="mb-2 flex items-center gap-2 font-bold text-slate-900"><Ticket className="h-5 w-5 text-slate-400" /> Coupon</p>
                {coupon ? (
                    <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2.5 text-sm">
                        <span className="text-emerald-800"><strong className="font-mono">{coupon.code.toUpperCase()}</strong> applied: {formatINR(coupon.discount)} off</span>
                        <button type="button" onClick={removeCoupon} className="font-semibold text-slate-600 hover:text-slate-900">Remove</button>
                    </div>
                ) : (
                    <form onSubmit={checkCoupon} className="flex gap-2">
                        <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Enter a coupon code" className="font-mono uppercase" aria-label="Coupon code" />
                        <button type="submit" disabled={couponState === 'checking'} className="h-11 shrink-0 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800">Apply</button>
                    </form>
                )}
                {couponState === 'invalid' && <p className="mt-2 text-sm text-rose-600">That code isn't valid for your account.</p>}
                {couponState === 'error' && <p className="mt-2 text-sm text-rose-600">The code couldn't be checked. Please try again.</p>}
            </section>

            <section className="rounded-2xl bg-white p-4 shadow-xs ring-1 ring-slate-200/70">
                <label htmlFor="delivery-note" className="mb-2 flex items-center gap-2 font-bold text-slate-900">
                    <MessageSquareText className="h-5 w-5 text-slate-400" /> {pickup ? 'Note for the shop' : 'Delivery instructions'} <span className="text-sm font-normal text-slate-400">(optional)</span>
                </label>
                <Textarea id="delivery-note" rows={2} maxLength={300} value={note} onChange={(e) => { setNote(e.target.value); setDeliveryNote(e.target.value) }}
                    placeholder={pickup ? 'e.g. I will collect after 6 pm' : 'e.g. Call when you reach the gate'} />
            </section>

            <PriceDetails totals={totals} pickup={pickup} rules={rules} />
            {belowMinimum && <Alert variant="warning">The minimum order is {formatINR(rules.minOrder)}. Add {formatINR(rules.minOrder - totals.items)} more to continue.</Alert>}

            <p className="flex items-start gap-3 text-sm text-slate-600"><ShieldCheck className="h-5 w-5 shrink-0 text-red-500" /> Prices are checked again when you place the order. Safe and secure checkout.</p>

            <CheckoutBar total={totals.total}>
                <button type="button" disabled={belowMinimum} onClick={() => history.push('/payment')} className={cn(checkoutButton)}>Continue to payment</button>
            </CheckoutBar>
        </Container>
    )
}

export default PlaceOrderScreen
