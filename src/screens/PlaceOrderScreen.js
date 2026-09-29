import React, { useState, useEffect } from 'react'
import axios from 'axios';
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { MapPin, CreditCard, Ticket } from 'lucide-react'
import Message from '../components/Message'
import CheckoutSteps from '../components/CheckoutSteps'
import { Container, Card, Button, Input, formatTk } from '../components/ui'
import { createOrder } from '../actions/orderActions'
import { ORDER_CREATE_RESET } from '../constants/orderConstants'

const unitPrice = (item) => item.offer_percentage
    ? parseFloat(item.price - ((item.price * item.offer_percentage) / 100)).toFixed(2)
    : item.price

function SummaryRow({ label, value, strong }) {
    return (
        <div className={strong ? 'flex justify-between border-t border-slate-100 pt-3 text-base font-bold text-slate-900' : 'flex justify-between text-sm'}>
            <dt className={strong ? '' : 'text-slate-500'}>{label}</dt>
            <dd className={strong ? '' : 'font-medium text-slate-900'}>{value}</dd>
        </div>
    )
}

function PlaceOrderScreen({ history }) {

    const [coupon_code, setCoupon_code] = useState('')
    const [coupon_code_status, setCoupon_code_status] = useState(0)
    const [user_id, setUser_id] = useState()
    const [total_discount, setTotal_discount] = useState(0)
    const orderCreate = useSelector(state => state.orderCreate)
    const { order, error, success } = orderCreate
    const [coupon_id, setCoupon_id] = useState(0);

    const dispatch = useDispatch()

    const cart = useSelector(state => state.cart)
    const userLogin = useSelector(state => state.userLogin)
    const { userInfo } = userLogin

    cart.itemsPrice = cart.cartItems.reduce((acc, item) => acc + unitPrice(item) * item.qty, 0).toFixed(2)
    cart.shippingPrice = (cart.itemsPrice > 100 ? 0 : 10).toFixed(2)
    cart.taxPrice = Number((0.050) * cart.itemsPrice).toFixed(2)
    cart.totalPrice = (Number(cart.itemsPrice) + Number(cart.shippingPrice) + Number(cart.taxPrice)).toFixed(2) - total_discount;

    useEffect(() => {
        if (!userInfo) return
        setUser_id(userInfo._id);
    }, [userInfo])

    const getCoouponCodeStatus = (e) => {
        e.preventDefault()
        axios.post(`/api/products/coupon_check/`, { user_id, coupon_code }).then(res => {
            setCoupon_code_status(res.data.status);
            setTotal_discount(res.data.total_discount);
            setCoupon_id(res.data.coupon_id)
        }).catch((err) => console.log(err))
    }

    if (!cart.paymentMethod) {
        history.push('/payment')
    }

    useEffect(() => {
        if (success) {
            history.push(`/order/${order._id}`)
            dispatch({ type: ORDER_CREATE_RESET })
        }
    }, [success, history, order, dispatch])

    const placeOrder = () => {
        dispatch(createOrder({
            orderItems: cart.cartItems,
            shippingAddress: cart.shippingAddress,
            paymentMethod: cart.paymentMethod,
            itemsPrice: cart.itemsPrice,
            shippingPrice: cart.shippingPrice,
            taxPrice: cart.taxPrice,
            totalPrice: cart.totalPrice,
            coupon_id: coupon_id
        }))
    }


    return (
        <Container>
            <CheckoutSteps step1 step2 step3 step4 />
            <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
                <div className="space-y-6">
                    <Card className="p-6">
                        <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-900"><Ticket className="h-5 w-5 text-slate-400" /> Coupon</h2>
                        <form onSubmit={getCoouponCodeStatus}>
                            <p className="mb-2 text-sm text-slate-500">Have a coupon? Enter it here. Otherwise you can skip this.</p>
                            <div className="flex gap-2">
                                <Input placeholder="XY123ABC" className="font-mono uppercase" onChange={(e) => { setCoupon_code(e.target.value) }} />
                                <Button type="submit" variant="dark" className="h-11 shrink-0">Apply</Button>
                            </div>
                            {coupon_code_status == 3 // eslint-disable-line eqeqeq
                                ? <Message variant="success" className="mt-3">Your code is valid. The discount has been applied.</Message>
                                : coupon_code_status == 2 // eslint-disable-line eqeqeq
                                    ? <Message variant="danger" className="mt-3">That code isn't valid. Please try again.</Message>
                                    : null}
                        </form>
                    </Card>

                    <Card className="grid gap-6 p-6 sm:grid-cols-2">
                        <div>
                            <h2 className="mb-2 flex items-center gap-2 font-semibold text-slate-900"><MapPin className="h-5 w-5 text-slate-400" /> Shipping</h2>
                            <p className="text-sm text-slate-600">
                                {cart.shippingAddress.address}, {cart.shippingAddress.city} {cart.shippingAddress.postalCode}, {cart.shippingAddress.country}
                            </p>
                        </div>
                        <div>
                            <h2 className="mb-2 flex items-center gap-2 font-semibold text-slate-900"><CreditCard className="h-5 w-5 text-slate-400" /> Payment</h2>
                            <p className="text-sm text-slate-600">{cart.paymentMethod}</p>
                        </div>
                    </Card>

                    <Card>
                        <h2 className="border-b border-slate-100 px-6 py-4 font-semibold text-slate-900">Order items</h2>
                        {cart.cartItems.length === 0 ? <div className="p-6"><Message variant='info'>Your cart is empty</Message></div> : (
                            <ul className="divide-y divide-slate-100">
                                {cart.cartItems.map((item, index) => (
                                    <li key={index} className="flex items-center gap-4 px-6 py-4">
                                        <span className="flex h-14 w-16 shrink-0 items-center justify-center rounded-lg bg-slate-50 p-1">
                                            <img src={item.image} alt={item.name} className="max-h-full max-w-full object-contain" />
                                        </span>
                                        <Link to={`/product/${item.product}`} className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900 hover:text-brand-600">{item.name}</Link>
                                        <span className="text-right text-sm text-slate-500">
                                            {item.qty} × {formatTk(unitPrice(item))}
                                            <span className="block font-semibold text-slate-900">{formatTk((item.qty * unitPrice(item)).toFixed(2))}</span>
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Card>
                </div>

                <div className="space-y-4 lg:sticky lg:top-32 lg:self-start">
                    <Card className="p-6">
                        <h2 className="font-semibold text-slate-900">Order summary</h2>
                        <dl className="mt-5 space-y-3">
                            <SummaryRow label="Items" value={formatTk(cart.itemsPrice)} />
                            <SummaryRow label="Shipping" value={formatTk(cart.shippingPrice)} />
                            <SummaryRow label="Tax" value={formatTk(cart.taxPrice)} />
                            {coupon_code_status == 3 && <SummaryRow label="Coupon discount" value={`-${formatTk(total_discount)}`} /> /* eslint-disable-line eqeqeq */}
                            <SummaryRow label="Total" value={formatTk(cart.totalPrice)} strong />
                        </dl>
                        {error && <Message variant='danger' className="mt-4">{error}</Message>}
                        <Button
                            block
                            size="lg"
                            className="mt-6"
                            disabled={cart.cartItems.length === 0}
                            onClick={placeOrder}
                        >
                            Place order
                        </Button>
                    </Card>
                </div>
            </div>
        </Container>
    )
}

export default PlaceOrderScreen
