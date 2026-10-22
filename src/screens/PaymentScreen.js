import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useDispatch, useSelector } from 'react-redux'
import { ShieldCheck, Smartphone, CreditCard, Landmark, Wallet, Loader2 } from 'lucide-react'
import CheckoutSteps, { CheckoutBar, PriceDetails, checkoutButton } from '../components/CheckoutSteps'
import { DeliveryCard } from './PlaceOrderScreen'
import { Alert, Container, formatINR } from '../components/ui'
import { CART_CLEAR_ITEMS } from '../constants/cartConstants'
import { brandFor, useStoreBrand } from '../components/storeBrand'
import {
    cartTotals, getCheckoutAddress, getCheckoutCoupon, getDeliveryMethod, getDeliveryNote, setCheckoutCoupon, setDeliveryNote, shippingRules,
} from '../components/shop/checkout'

const errorText = (e) => (e && e.response && e.response.data && e.response.data.detail) || (e && e.message) || 'Something went wrong. Please try again.'

// Razorpay's payment window, loaded only when someone pays.
function loadRazorpay() {
    return new Promise((resolve, reject) => {
        if (window.Razorpay) return resolve()
        const script = document.createElement('script')
        script.src = 'https://checkout.razorpay.com/v1/checkout.js'
        script.onload = resolve
        script.onerror = () => reject(new Error("The payment window couldn't load. Check your internet connection and try again."))
        document.body.appendChild(script)
    })
}

// Step 3: pay online. The order is placed only after the payment goes through and the
// server has checked it with Razorpay; a closed or failed payment places nothing.
function PaymentScreen({ history }) {
    const dispatch = useDispatch()
    const store = useStoreBrand()
    const rules = shippingRules(store)
    const { userInfo } = useSelector((state) => state.userLogin)
    const { cartItems } = useSelector((state) => state.cart)
    const pickup = getDeliveryMethod() === 'pickup'
    const address = getCheckoutAddress()
    const coupon = getCheckoutCoupon()
    const [stage, setStage] = useState('') // '', 'starting', 'paying', 'confirming'
    const [error, setError] = useState('')
    const [notice, setNotice] = useState('')

    useEffect(() => {
        if (stage) return
        if (!userInfo) history.replace('/login?redirect=shipping')
        else if (!cartItems.length) history.replace('/cart')
        else if (!pickup && !address) history.replace('/shipping')
    }, [userInfo, cartItems.length, pickup, Boolean(address), history, stage]) // eslint-disable-line react-hooks/exhaustive-deps

    const totals = cartTotals(cartItems, { pickup, rules, discount: coupon ? coupon.discount : 0 })
    const auth = { headers: { Authorization: `Bearer ${userInfo ? userInfo.token : ''}` } }

    const placed = (order) => {
        setCheckoutCoupon(null)
        setDeliveryNote('')
        dispatch({ type: CART_CLEAR_ITEMS })
        localStorage.removeItem('cartItems')
        history.push(`/order/${order._id}?placed=1`)
    }

    const pay = async () => {
        setError('')
        setNotice('')
        setStage('starting')
        try {
            await loadRazorpay()
            const { data } = await axios.post('/api/orders/pay/start/', {
                orderItems: cartItems.map((i) => ({ product: i.product, qty: i.qty })),
                deliveryMethod: pickup ? 'pickup' : 'deliver',
                addressId: pickup ? null : address && address.id,
                deliveryNote: getDeliveryNote(),
                coupon_id: coupon ? coupon.id : 0,
            }, auth)
            const checkout = new window.Razorpay({
                key: data.key_id,
                order_id: data.razorpay_order_id,
                amount: data.amount,
                currency: data.currency,
                name: data.shop,
                description: `Order from ${data.shop}`,
                image: brandFor(store).logo ? new URL(brandFor(store).logo, window.location.origin).href : undefined,
                prefill: data.prefill,
                theme: { color: /^#[0-9a-f]{6}$/i.test(brandFor(store).accent || '') ? brandFor(store).accent : '#047857' },
                handler: (result) => {
                    setStage('confirming')
                    axios.post('/api/orders/pay/confirm/', result, auth)
                        .then(({ data: order }) => placed(order))
                        .catch((e) => { setError(errorText(e)); setStage('') })
                },
                modal: {
                    ondismiss: () => {
                        setStage((s) => (s === 'confirming' ? s : ''))
                        setNotice('Payment cancelled. No order was placed and nothing was charged.')
                    },
                },
            })
            checkout.on('payment.failed', (res) => {
                setError(`The payment didn't go through${res && res.error && res.error.description ? `: ${res.error.description}` : ''}. No order was placed. You can try again.`)
            })
            setStage('paying')
            checkout.open()
        } catch (e) {
            setError(errorText(e))
            setStage('')
        }
    }

    if (!userInfo || (!cartItems.length && stage !== 'confirming')) return null

    return (
        <Container className="max-w-3xl space-y-5 pb-28 md:pb-0">
            <CheckoutSteps current={2} />
            <DeliveryCard pickup={pickup} />

            <section>
                <h2 className="mb-3 text-lg font-bold text-slate-900">Payment</h2>
                <div className="rounded-2xl bg-white p-4 ring-2 ring-brand-500">
                    <p className="font-bold text-slate-900">Pay online</p>
                    <p className="text-sm text-slate-500">Your order is placed as soon as the payment goes through.</p>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-700 sm:grid-cols-4">
                        {[[Smartphone, 'UPI'], [CreditCard, 'Cards'], [Landmark, 'Net banking'], [Wallet, 'Wallets']].map(([Icon, label]) => (
                            <span key={label} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2"><Icon className="h-4 w-4 text-brand-600" /> {label}</span>
                        ))}
                    </div>
                </div>
            </section>

            <PriceDetails totals={totals} pickup={pickup} rules={rules} />

            <p className="flex items-start gap-3 text-sm text-slate-600">
                <ShieldCheck className="h-5 w-5 shrink-0 text-red-500" /> Secure payment by Razorpay. Your card or UPI details go to Razorpay, never to this shop.
            </p>
            {notice && <Alert variant="info">{notice}</Alert>}
            {error && <Alert variant="danger">{error}</Alert>}

            <CheckoutBar total={totals.total}>
                <button type="button" onClick={pay} disabled={Boolean(stage)} className={checkoutButton}>
                    {stage === 'confirming' ? <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Placing your order…</span>
                        : stage ? <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Opening payment…</span>
                            : `Pay ${totals.total ? formatINR(totals.total) : ''}`}
                </button>
            </CheckoutBar>
        </Container>
    )
}

export default PaymentScreen
