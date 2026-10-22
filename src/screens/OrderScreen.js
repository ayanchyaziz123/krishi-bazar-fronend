import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import axios from 'axios'
import { BadgeCheck, CalendarDays, Clock, CreditCard, Hash, Package, Wallet, Truck, Store, Check, Star, Phone, XCircle, MessageSquareText } from 'lucide-react'
import Message from '../components/Message'
import Loader from '../components/Loader'
import { Container, Modal, Textarea, cn, formatINR, toast } from '../components/ui'
import { addressLines, orderFlow, qtyText, statusLabel } from '../components/shop/checkout'
import { useStoreBrand } from '../components/storeBrand'
import { getOrderDetails, payOrder } from '../actions/orderActions'
import { ORDER_PAY_RESET, ORDER_DELIVER_RESET } from '../constants/orderConstants'
import { handlesOrders } from '../admin_components/roles'

const day = (iso) => (iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '')
const time = (iso) => (iso ? new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '')
const card = 'rounded-2xl bg-white p-4 shadow-xs ring-1 ring-slate-200/70 sm:p-5'

// Where the order is: the steps of a delivery or pick-up order, each done only when the
// shop has recorded it, with the time it happened. A cancelled order says so instead.
function Tracker({ order, pickup }) {
    const events = order.events || []
    const when = (status) => { const e = events.find((x) => x.status === status); return e ? e.at : null }
    if (order.order_status === 'cancelled') {
        return (
            <p className="flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-3 font-semibold text-rose-700">
                <XCircle className="h-5 w-5" /> This order was cancelled{when('cancelled') ? ` on ${day(when('cancelled'))}` : ''}.
            </p>
        )
    }
    const flow = orderFlow(pickup)
    const here = Math.max(flow.indexOf(order.order_status || 'placed'), 0)
    return (
        <ol className="flex items-start">
            {flow.map((status, i) => {
                const done = i <= here
                return (
                    <li key={status} className="flex flex-1 items-start last:flex-none">
                        <span className="flex w-16 flex-col items-center gap-1.5 text-center sm:w-20">
                            <span className={cn('flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold',
                                done ? 'bg-brand-600 text-white' : 'bg-white text-slate-400 ring-2 ring-slate-200', i === here && 'ring-4 ring-brand-100')}>
                                {done ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
                            </span>
                            <span className={cn('text-[11px] font-semibold leading-tight sm:text-xs', done ? 'text-slate-900' : 'text-slate-400')}>{statusLabel(status, pickup)}</span>
                            {done && when(status) && <span className="text-[10px] text-slate-400">{day(when(status))}</span>}
                        </span>
                        {i < flow.length - 1 && <span className={cn('mt-4 h-0.5 flex-1 rounded-full', i < here ? 'bg-brand-500' : 'bg-slate-200')} />}
                    </li>
                )
            })}
        </ol>
    )
}

// Every step with its time and note, newest last.
function Timeline({ order, pickup }) {
    const events = order.events || []
    if (!events.length) return null
    return (
        <ol className="mt-4 space-y-3 border-l-2 border-slate-200 pl-4">
            {events.map((e, i) => (
                <li key={i} className="relative text-sm">
                    <span className={cn('absolute -left-[1.4rem] top-1 h-3 w-3 rounded-full ring-2 ring-white', e.status === 'cancelled' ? 'bg-rose-500' : 'bg-brand-500')} />
                    <p className="font-semibold text-slate-900">{statusLabel(e.status, pickup)} <span className="font-normal text-slate-400">· {day(e.at)}, {time(e.at)}</span></p>
                    {e.note && e.note !== 'Order placed' && <p className="text-slate-600">{e.note}</p>}
                </li>
            ))}
        </ol>
    )
}

function OrderScreen({ match, history, location }) {
    const orderId = match.params.id
    const store = useStoreBrand()
    const justPlaced = new URLSearchParams(location.search).get('placed') === '1'
    const inAdmin = location.pathname.startsWith('/admin')
    const dispatch = useDispatch()
    const [confirmCancel, setConfirmCancel] = useState(false)
    const [cancelNote, setCancelNote] = useState('')
    const [working, setWorking] = useState('')

    const { order, error, loading } = useSelector(state => state.orderDetails)
    const { loading: loadingPay, success: successPay } = useSelector(state => state.orderPay)
    const { loading: loadingDeliver, success: successDeliver } = useSelector(state => state.orderDeliver)
    const { userInfo } = useSelector(state => state.userLogin)

    const isStaff = inAdmin && handlesOrders(userInfo)
    const ready = !loading && !error && order && order._id === Number(orderId)

    useEffect(() => {
        if (!userInfo) history.push('/login')
        if (!order || successPay || order._id !== Number(orderId) || successDeliver) {
            dispatch({ type: ORDER_PAY_RESET })
            dispatch({ type: ORDER_DELIVER_RESET })
            dispatch(getOrderDetails(orderId))
        }
    }, [dispatch, order, orderId, successPay, successDeliver]) // eslint-disable-line react-hooks/exhaustive-deps

    const auth = { headers: { Authorization: `Bearer ${userInfo ? userInfo.token : ''}` } }
    const failed = (e) => toast.error((e.response && e.response.data && e.response.data.detail) || 'That did not work. Please try again.')
    const changeStatus = (status, note = '') => {
        setWorking(status)
        return axios.put(`/api/orders/${orderId}/status/`, { status, note }, auth)
            .then(() => { dispatch(getOrderDetails(orderId)); toast.success(status === 'cancelled' ? 'Order cancelled.' : `Order marked as ${statusLabel(status, order.delivery_method === 'pickup').toLowerCase()}.`) })
            .catch(failed)
            .finally(() => setWorking(''))
    }
    const cancelIt = () => {
        const done = () => { setConfirmCancel(false); setCancelNote('') }
        if (isStaff) return changeStatus('cancelled', cancelNote).then(done)
        setWorking('cancelled')
        return axios.put(`/api/orders/${orderId}/cancel/`, { reason: cancelNote }, auth)
            .then(() => { done(); dispatch(getOrderDetails(orderId)); toast.success('Your order was cancelled.') })
            .catch(failed)
            .finally(() => setWorking(''))
    }

    if (loading || (!error && !ready)) return <Loader />
    if (error) return <Container><Message variant='danger'>{error}</Message></Container>

    const pickup = order.delivery_method === 'pickup'
    const items = order.orderItems || []
    const itemsPrice = items.reduce((sum, i) => sum + Number(i.price) * i.qty, 0)
    // GST that was already inside the prices is not added again when working out the coupon.
    const addedTax = order.tax_included ? 0 : Number(order.taxPrice || 0)
    const discount = Math.max(0, itemsPrice + Number(order.shippingPrice || 0) + addedTax - Number(order.totalPrice || 0))
    const gstOrder = order.gst_mode === 'regular'
    const address = order.shippingAddress || {}
    const DeliveryIcon = pickup ? Store : Truck

    const info = [
        [CreditCard, 'Payment', order.paymentMethod],
        [CalendarDays, 'Date', day(order.createdAt)],
        [Clock, 'Time', time(order.createdAt)],
        [Hash, 'Order number', `#${order._id}`],
        [Package, 'Items', `${items.reduce((n, i) => n + i.qty, 0)}`],
        [Wallet, order.isPaid ? 'Amount paid' : 'Amount to pay', formatINR(order.totalPrice)],
    ]

    return (
        <Container className="max-w-3xl space-y-5 pb-28 md:pb-0">
            {justPlaced ? (
                <div className="rounded-3xl bg-gradient-to-b from-emerald-50 to-white px-4 pb-2 pt-6 text-center">
                    <BadgeCheck className="mx-auto h-16 w-16 fill-emerald-500 text-white" strokeWidth={1.5} />
                    <h1 className="mt-3 text-2xl font-bold text-emerald-600">Your order has been placed!</h1>
                    <p className="mt-1 text-slate-500">
                        {pickup ? 'We will let you know when it is ready to collect.' : 'We will let you know when it is on its way.'}
                    </p>
                </div>
            ) : (
                <div>
                    <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">Order details</p>
                    <h1 className="mt-1 text-2xl font-bold text-slate-900">Order #{order._id}</h1>
                </div>
            )}

            <section className={card}>
                <dl className="divide-y divide-slate-100">
                    {info.map(([Icon, label, value]) => (
                        <div key={label} className="flex items-center justify-between gap-4 py-2.5 text-[15px]">
                            <dt className="flex items-center gap-2 text-slate-600"><Icon className="h-4 w-4 text-slate-400" /> {label}</dt>
                            <dd className="font-semibold text-slate-900">{value}</dd>
                        </div>
                    ))}
                </dl>
            </section>

            <section className={card}>
                <Tracker order={order} pickup={pickup} />
                <div className="mt-4 rounded-xl bg-slate-50 p-3">
                    <p className="flex items-center gap-2 font-bold text-slate-900"><DeliveryIcon className="h-5 w-5 text-red-500" /> {pickup ? 'Store pick-up' : 'Home delivery'}</p>
                    <div className="mt-1 pl-7 text-sm text-slate-700">
                        <p className="font-semibold">{address.full_name || (order.user && order.user.name)}</p>
                        {pickup
                            ? <p>{address.address}{address.city && address.city !== '-' ? `, ${address.city}` : ''}</p>
                            : addressLines(address).map((line, i) => <p key={i}>{line}</p>)}
                        {address.phone && <a href={`tel:${address.phone}`} className="mt-1 inline-flex items-center gap-1 text-slate-600 hover:text-slate-900"><Phone className="h-3.5 w-3.5" /> {address.phone}</a>}
                        {isStaff && order.user && <p><a href={`mailto:${order.user.email}`} className="text-brand-700 hover:underline">{order.user.email}</a></p>}
                    </div>
                    {order.delivery_note && (
                        <p className="mt-2 flex items-start gap-2 rounded-lg bg-white px-3 py-2 text-sm text-slate-700 ring-1 ring-slate-200">
                            <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /> {order.delivery_note}
                        </p>
                    )}
                </div>
                <Timeline order={order} pickup={pickup} />
            </section>

            <section className={card}>
                <h2 className="mb-3 text-lg font-bold text-slate-900">Product details</h2>
                <ul className="divide-y divide-slate-100">
                    {items.map((item, index) => (
                        <li key={index} className="flex gap-4 py-3">
                            <span className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-50">
                                {item.image && <img src={item.image} alt="" className="h-full w-full object-cover" />}
                            </span>
                            <div className="min-w-0 flex-1">
                                <Link to={`/product/${item.product}`} className="line-clamp-2 font-bold leading-snug text-slate-900 hover:text-brand-700">{item.name}</Link>
                                <p className="mt-1 text-sm text-slate-500">{qtyText(item.qty, { sold_by_weight: !Number.isInteger(Number(item.qty)) || ['kg', 'g', 'litre', 'l'].includes(item.unit), unit: item.unit })} × {formatINR(item.price)} = <strong className="text-slate-900">{formatINR(item.qty * item.price)}</strong></p>
                                {!inAdmin && order.isDelivered && (
                                    <Link to={`/product/${item.product}#reviews`} className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">
                                        <Star className="h-3.5 w-3.5" /> Add review
                                    </Link>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            </section>

            <section className={card}>
                <h2 className="mb-1 text-lg font-bold text-slate-900">{gstOrder ? 'Tax invoice' : order.gst_mode === 'composition' ? 'Bill of supply' : 'Price details'}</h2>
                {order.gst_mode && order.gst_mode !== 'none' && store.gst && store.gst.gstin && (
                    <p className="text-xs text-slate-500">{store.name} · GSTIN {store.gst.gstin}</p>
                )}
                <dl className="divide-y divide-dashed divide-slate-200 text-[15px]">
                    <div className="flex justify-between py-3"><dt className="text-slate-600">Subtotal</dt><dd className="font-semibold">{formatINR(itemsPrice)}</dd></div>
                    <div className="flex justify-between py-3"><dt className="text-slate-600">{pickup ? 'Store pick-up' : 'Shipping'}</dt><dd className="font-semibold">{Number(order.shippingPrice) ? formatINR(order.shippingPrice) : 'Free'}</dd></div>
                    {gstOrder ? (
                        <div className="flex justify-between py-3">
                            <dt className="text-slate-600">
                                GST{order.tax_included ? ' (included in prices)' : ''}
                                <span className="block text-xs text-slate-400">
                                    {Number(order.igst) ? `IGST ${formatINR(order.igst)}` : `CGST ${formatINR(order.cgst)} + SGST ${formatINR(order.sgst)}`}
                                </span>
                            </dt>
                            <dd className="font-semibold">{formatINR(order.taxPrice)}</dd>
                        </div>
                    ) : Number(order.taxPrice) > 0 && (
                        <div className="flex justify-between py-3"><dt className="text-slate-600">Tax</dt><dd className="font-semibold">{formatINR(order.taxPrice)}</dd></div>
                    )}
                    {discount >= 0.01 && <div className="flex justify-between py-3"><dt className="text-slate-600">Coupon</dt><dd className="font-semibold text-emerald-600">-{formatINR(discount)}</dd></div>}
                    <div className="flex justify-between pt-3 text-lg"><dt className="font-bold">Total amount</dt><dd className="font-extrabold">{formatINR(order.totalPrice)}</dd></div>
                </dl>
            </section>

            {!order.isPaid && !isStaff && order.order_status !== 'cancelled' && (
                <p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">This order hasn't been paid yet. The shop will contact you about payment.</p>
            )}

            {isStaff && (
                <section className={cn(card, 'space-y-3')}>
                    <h2 className="text-lg font-bold text-slate-900">Update this order</h2>
                    {(loadingDeliver || loadingPay || working) && <Loader />}
                    {(order.next_steps || []).length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {order.next_steps.map((status, i) => (
                                <button key={status} type="button" disabled={Boolean(working)} onClick={() => changeStatus(status)}
                                    className={cn('h-11 rounded-xl px-5 font-semibold transition disabled:opacity-60',
                                        i === 0 ? 'bg-brand-600 text-white hover:bg-brand-700' : 'bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50')}>
                                    {i === 0 ? `Mark as ${statusLabel(status, pickup).toLowerCase()}` : `Skip to ${statusLabel(status, pickup).toLowerCase()}`}
                                </button>
                            ))}
                        </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                        {!order.isPaid && order.order_status !== 'cancelled' && (
                            <button type="button" onClick={() => dispatch(payOrder(orderId, {}))} className="h-10 rounded-xl bg-white px-4 text-sm font-semibold text-slate-800 ring-1 ring-slate-300 hover:bg-slate-50">
                                Mark as paid
                            </button>
                        )}
                        {!['delivered', 'cancelled'].includes(order.order_status) && (
                            <button type="button" onClick={() => setConfirmCancel(true)} className="h-10 rounded-xl px-4 text-sm font-semibold text-rose-600 ring-1 ring-rose-200 hover:bg-rose-50">
                                Cancel order
                            </button>
                        )}
                    </div>
                    {order.order_status === 'delivered' && <p className="text-sm text-slate-600">This order is {pickup ? 'collected' : 'delivered'}{order.isPaid ? ' and paid' : ', but not marked as paid yet'}.</p>}
                </section>
            )}

            {!isStaff && order.can_cancel && (
                <button type="button" onClick={() => setConfirmCancel(true)} className="w-full rounded-2xl py-3 text-sm font-semibold text-rose-600 ring-1 ring-rose-200 hover:bg-rose-50">
                    Cancel this order
                </button>
            )}

            <Modal show={confirmCancel} onClose={() => setConfirmCancel(false)} title={`Cancel order #${order._id}?`} size="sm">
                <p className="text-sm text-slate-600">
                    {isStaff ? 'The items go back into stock. If the customer paid online, arrange the refund.' : 'The items go back to the shop and any coupon you used can be used again.'}
                </p>
                <Textarea className="mt-3" rows={2} maxLength={200} value={cancelNote} onChange={(e) => setCancelNote(e.target.value)}
                    placeholder={isStaff ? 'Reason (shown to the customer)' : 'Reason (optional)'} aria-label="Reason" />
                <div className="mt-4 flex gap-2">
                    <button type="button" onClick={() => setConfirmCancel(false)} className="h-11 flex-1 rounded-xl font-semibold text-slate-700 ring-1 ring-slate-200">Keep order</button>
                    <button type="button" disabled={Boolean(working)} onClick={cancelIt} className="h-11 flex-1 rounded-xl bg-rose-600 font-semibold text-white hover:bg-rose-700 disabled:opacity-60">Cancel order</button>
                </div>
            </Modal>

            {!inAdmin && (
                <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 gap-3 border-t border-slate-200 bg-white px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 md:static md:border-0 md:bg-transparent md:p-0">
                    <Link to="/profile" className="inline-flex h-12 items-center justify-center rounded-xl font-bold text-blue-600 ring-1 ring-blue-600 hover:bg-blue-50">Track orders</Link>
                    <Link to="/" className="inline-flex h-12 items-center justify-center rounded-xl bg-red-600 font-bold text-white hover:bg-red-700">Continue shopping</Link>
                </div>
            )}
        </Container>
    )
}

export default OrderScreen
