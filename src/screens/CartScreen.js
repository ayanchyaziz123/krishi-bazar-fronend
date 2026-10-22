import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Trash2, ShoppingCart, Minus, Plus } from 'lucide-react'
import { Container, formatINR } from '../components/ui'
import { addToCart, removeFromCart } from '../actions/cartActions'
import { cartTotals, qtyStep, qtyText, unitPrice } from '../components/shop/checkout'
import { checkoutButton } from '../components/CheckoutSteps'

function CartScreen({ match, location, history }) {
    const productId = match.params.id
    const qty = location.search ? Number(new URLSearchParams(location.search).get('qty')) || 1 : 1
    const dispatch = useDispatch()
    const { cartItems } = useSelector(state => state.cart)

    useEffect(() => {
        if (productId) dispatch(addToCart(productId, qty))
    }, [dispatch, productId, qty])

    const totals = cartTotals(cartItems)

    if (cartItems.length === 0) {
        return (
            <Container className="max-w-3xl">
                <div className="flex flex-col items-center rounded-3xl bg-white px-6 py-20 text-center shadow-xs ring-1 ring-slate-200/70">
                    <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600"><ShoppingCart className="h-8 w-8" /></span>
                    <h1 className="mt-5 text-lg font-bold text-slate-900">Your cart is empty</h1>
                    <p className="mt-1 text-sm text-slate-500">Looks like you haven't added anything yet.</p>
                    <Link to="/" className="mt-6 inline-flex h-11 items-center rounded-xl bg-brand-600 px-6 font-semibold text-white hover:bg-brand-700">Start shopping</Link>
                </div>
            </Container>
        )
    }

    return (
        <Container className="max-w-3xl space-y-4">
            <h1 className="hidden text-2xl font-bold tracking-tight text-slate-900 md:block">My cart</h1>
            <p className="text-sm text-slate-500">{totals.count} {totals.count === 1 ? 'item' : 'items'}</p>
            <ul className="space-y-3">
                {cartItems.map((item) => {
                    const unit = unitPrice(item)
                    const n = Number(item.qty)
                    return (
                        <li key={item.product} className="flex gap-4 rounded-2xl bg-white p-3 shadow-xs ring-1 ring-slate-200/70">
                            <Link to={`/product/${item.product}`} className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-50">
                                {item.image && <img src={item.image} alt="" className="h-full w-full object-cover" />}
                            </Link>
                            <div className="flex min-w-0 flex-1 flex-col">
                                <Link to={`/product/${item.product}`} className="line-clamp-2 font-bold leading-snug text-slate-900">{item.name}</Link>
                                <div className="mt-1 flex items-baseline gap-2">
                                    <span className="text-lg font-extrabold text-red-600">{formatINR(unit)}{item.sold_by_weight && <span className="text-sm font-semibold text-slate-500"> / {item.unit || 'kg'}</span>}</span>
                                    {item.offer_percentage > 0 && <span className="text-sm text-slate-400 line-through">{formatINR(item.price)}</span>}
                                </div>
                                <div className="mt-auto flex items-center gap-2 pt-2">
                                    <div className="inline-flex h-9 items-center rounded-xl ring-1 ring-slate-200">
                                        <button type="button" aria-label="One less" disabled={n <= qtyStep(item)} onClick={() => dispatch(addToCart(item.product, n - qtyStep(item)))}
                                            className="flex h-full w-9 items-center justify-center disabled:text-slate-300"><Minus className="h-4 w-4" /></button>
                                        <span className="min-w-7 px-1 text-center text-sm font-semibold tabular-nums">{qtyText(n, item)}</span>
                                        <button type="button" aria-label="One more" disabled={n + qtyStep(item) > item.countInStock} onClick={() => dispatch(addToCart(item.product, n + qtyStep(item)))}
                                            className="flex h-full w-9 items-center justify-center disabled:text-slate-300"><Plus className="h-4 w-4" /></button>
                                    </div>
                                    <button type="button" onClick={() => dispatch(removeFromCart(item.product))} aria-label={`Remove ${item.name}`}
                                        className="ml-auto flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 ring-1 ring-slate-200 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
                                </div>
                            </div>
                        </li>
                    )
                })}
            </ul>
            <div className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-xs ring-1 ring-slate-200/70">
                <div>
                    <p className="text-lg font-extrabold text-slate-900">{formatINR(totals.items)}</p>
                    <p className="text-xs text-slate-500">{totals.saved > 0 ? `You save ${formatINR(totals.saved)} · ` : ''}Delivery and tax at checkout</p>
                </div>
                <button type="button" onClick={() => history.push('/login?redirect=shipping')} className={`${checkoutButton} ml-auto`}>Checkout</button>
            </div>
            <Link to="/" className="block text-center text-sm font-medium text-slate-500 hover:text-slate-900">Continue shopping</Link>
        </Container>
    )
}

export default CartScreen
