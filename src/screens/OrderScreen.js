import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { PayPalButton } from 'react-paypal-button-v2'
import { MapPin, CreditCard, Mail, User } from 'lucide-react'
import Message from '../components/Message'
import Loader from '../components/Loader'
import { Container, PageHeader, Card, Button, formatTk } from '../components/ui'
import { getOrderDetails, payOrder, deliverOrder } from '../actions/orderActions'
import { ORDER_PAY_RESET, ORDER_DELIVER_RESET } from '../constants/orderConstants'

function OrderScreen({ match, history }) {
    const orderId = match.params.id
    const dispatch = useDispatch()

    const [sdkReady, setSdkReady] = useState(false)

    const orderDetails = useSelector(state => state.orderDetails)
    const { order, error, loading } = orderDetails

    const orderPay = useSelector(state => state.orderPay)
    const { loading: loadingPay, success: successPay } = orderPay

    const orderDeliver = useSelector(state => state.orderDeliver)
    const { loading: loadingDeliver, success: successDeliver } = orderDeliver

    const userLogin = useSelector(state => state.userLogin)
    const { userInfo } = userLogin

    if (!loading && !error) {
        order.itemsPrice = order.orderItems.reduce((acc, item) => acc + item.price * item.qty, 0).toFixed(2)
    }

    const addPayPalScript = () => {
        const script = document.createElement('script')
        script.type = 'text/javascript'
        script.src = 'https://www.paypal.com/sdk/js?client-id=AeDXja18CkwFUkL-HQPySbzZsiTrN52cG13mf9Yz7KiV2vNnGfTDP0wDEN9sGlhZHrbb_USawcJzVDgn'
        script.async = true
        script.onload = () => {
            setSdkReady(true)
        }
        document.body.appendChild(script)
    }

    useEffect(() => {

        if (!userInfo) {
            history.push('/login')
        }

        if (!order || successPay || order._id !== Number(orderId) || successDeliver) {
            dispatch({ type: ORDER_PAY_RESET })
            dispatch({ type: ORDER_DELIVER_RESET })

            dispatch(getOrderDetails(orderId))
        } else if (!order.isPaid) {
            if (!window.paypal) {
                addPayPalScript()
            } else {
                setSdkReady(true)
            }
        }
    }, [dispatch, order, orderId, successPay, successDeliver]) // eslint-disable-line react-hooks/exhaustive-deps

    const successPaymentHandler = (paymentResult) => {
        dispatch(payOrder(orderId, paymentResult))
    }

    const deliverHandler = () => {
        dispatch(deliverOrder(order))
    }

    return loading ? (
        <Loader />
    ) : error ? (
        <Container><Message variant='danger'>{error}</Message></Container>
    ) : (
        <Container>
            <PageHeader eyebrow="Order details" title={`Order #${order._id}`} subtitle={order.createdAt ? `Placed on ${order.createdAt.substring(0, 10)}` : null} />
            <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
                <div className="space-y-6">
                    <Card className="p-6">
                        <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-900"><MapPin className="h-5 w-5 text-slate-400" /> Shipping</h2>
                        <div className="space-y-2 text-sm text-slate-600">
                            <p className="flex items-center gap-2"><User className="h-4 w-4 text-slate-400" /> {order.user.name}</p>
                            <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-slate-400" /> <a href={`mailto:${order.user.email}`} className="text-brand-600 hover:underline">{order.user.email}</a></p>
                            <p className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-slate-400" />
                                {order.shippingAddress.address}, {order.shippingAddress.city} {order.shippingAddress.postalCode}, {order.shippingAddress.country}
                            </p>
                        </div>
                        <div className="mt-4">
                            {order.isDelivered ? (
                                <Message variant='success'>Delivered on {order.deliveredAt}</Message>
                            ) : (
                                <Message variant='warning'>Not delivered yet</Message>
                            )}
                        </div>
                    </Card>

                    <Card className="p-6">
                        <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-900"><CreditCard className="h-5 w-5 text-slate-400" /> Payment</h2>
                        <p className="text-sm text-slate-600">Method: {order.paymentMethod}</p>
                        <div className="mt-4">
                            {order.isPaid ? (
                                <Message variant='success'>Paid on {order.paidAt}</Message>
                            ) : (
                                <Message variant='warning'>Not paid yet</Message>
                            )}
                        </div>
                    </Card>

                    <Card>
                        <h2 className="border-b border-slate-100 px-6 py-4 font-semibold text-slate-900">Order items</h2>
                        {order.orderItems.length === 0 ? <div className="p-6"><Message variant='info'>Order is empty</Message></div> : (
                            <ul className="divide-y divide-slate-100">
                                {order.orderItems.map((item, index) => (
                                    <li key={index} className="flex items-center gap-4 px-6 py-4">
                                        <span className="flex h-14 w-16 shrink-0 items-center justify-center rounded-lg bg-slate-50 p-1">
                                            <img src={item.image} alt={item.name} className="max-h-full max-w-full object-contain" />
                                        </span>
                                        <Link to={`/product/${item.product}`} className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900 hover:text-brand-600">{item.name}</Link>
                                        <span className="text-right text-sm text-slate-500">
                                            {item.qty} × {formatTk(item.price)}
                                            <span className="block font-semibold text-slate-900">{formatTk((item.qty * item.price).toFixed(2))}</span>
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Card>
                </div>

                <Card className="h-fit p-6 lg:sticky lg:top-32">
                    <h2 className="font-semibold text-slate-900">Order summary</h2>
                    <dl className="mt-5 space-y-3 text-sm">
                        <div className="flex justify-between"><dt className="text-slate-500">Items</dt><dd className="font-medium">{formatTk(order.itemsPrice)}</dd></div>
                        <div className="flex justify-between"><dt className="text-slate-500">Shipping</dt><dd className="font-medium">{formatTk(order.shippingPrice)}</dd></div>
                        <div className="flex justify-between"><dt className="text-slate-500">Tax</dt><dd className="font-medium">{formatTk(order.taxPrice)}</dd></div>
                        <div className="flex justify-between border-t border-slate-100 pt-3 text-base"><dt className="font-semibold">Total</dt><dd className="font-bold">{formatTk(order.totalPrice)}</dd></div>
                    </dl>

                    {!order.isPaid && (
                        <div className="mt-6">
                            {loadingPay && <Loader />}
                            {!sdkReady ? (
                                <Loader />
                            ) : (
                                <PayPalButton
                                    amount={order.totalPrice}
                                    onSuccess={successPaymentHandler}
                                />
                            )}
                        </div>
                    )}

                    {loadingDeliver && <Loader />}
                    {userInfo && userInfo.isAdmin && order.isPaid && !order.isDelivered && (
                        <Button block className="mt-6" onClick={deliverHandler}>
                            Mark as delivered
                        </Button>
                    )}
                </Card>
            </div>
        </Container>
    )
}

export default OrderScreen
