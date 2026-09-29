import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Trash2, ShoppingBag, ArrowRight } from 'lucide-react'
import { Container, PageHeader, Card, Button, Select, formatTk } from '../components/ui'
import { addToCart, removeFromCart } from '../actions/cartActions'

const unitPrice = (item) => item.offer_percentage
    ? parseFloat(item.price - ((item.price * item.offer_percentage) / 100)).toFixed(2)
    : item.price

function CartScreen({ match, location, history }) {
    const productId = match.params.id
    const qty = location.search ? Number(location.search.split('=')[1]) : 1
    const dispatch = useDispatch()

    const cart = useSelector(state => state.cart)
    const { cartItems } = cart

    useEffect(() => {
        if (productId) {
            dispatch(addToCart(productId, qty))
        }
    }, [dispatch, productId, qty])

    const removeFromCartHandler = (id) => {
        dispatch(removeFromCart(id))
    }

    const checkoutHandler = () => {
        history.push('/login?redirect=shipping')
    }

    const itemCount = cartItems.reduce((acc, item) => acc + item.qty, 0)
    const total = cartItems.reduce((acc, item) => acc + item.qty * unitPrice(item), 0).toFixed(2)

    return (
        <Container>
            <PageHeader title="Shopping cart" subtitle={itemCount ? `${itemCount} ${itemCount === 1 ? 'item' : 'items'} in your cart` : null} />

            {cartItems.length === 0 ? (
                <Card className="flex flex-col items-center px-6 py-20 text-center">
                    <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                        <ShoppingBag className="h-8 w-8" />
                    </span>
                    <h2 className="mt-5 text-lg font-semibold text-slate-900">Your cart is empty</h2>
                    <p className="mt-1 text-sm text-slate-500">Looks like you haven't added anything yet.</p>
                    <Button to="/" className="mt-6">Start shopping</Button>
                </Card>
            ) : (
                <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
                    <Card className="divide-y divide-slate-100">
                        {cartItems.map(item => (
                            <div key={item.product} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                                <Link to={`/product/${item.product}`} className="flex h-24 w-28 shrink-0 items-center justify-center rounded-xl bg-slate-50 p-2">
                                    <img src={item.image} alt={item.name} className="max-h-full max-w-full object-contain" />
                                </Link>
                                <div className="min-w-0 flex-1">
                                    <Link to={`/product/${item.product}`} className="font-semibold text-slate-900 hover:text-brand-600">{item.name}</Link>
                                    <div className="mt-1 flex items-baseline gap-2 text-sm">
                                        <span className="font-semibold text-slate-900">{formatTk(unitPrice(item))}</span>
                                        {item.offer_percentage ? <span className="text-slate-400 line-through">{formatTk(item.price)}</span> : null}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Select
                                        value={item.qty}
                                        onChange={(e) => dispatch(addToCart(item.product, Number(e.target.value)))}
                                        className="h-10 w-24"
                                        aria-label="Quantity"
                                    >
                                        {[...Array(item.countInStock).keys()].map((x) => (
                                            <option key={x + 1} value={x + 1}>{x + 1}</option>
                                        ))}
                                    </Select>
                                    <Button
                                        variant="danger-soft"
                                        size="icon"
                                        onClick={() => removeFromCartHandler(item.product)}
                                        aria-label="Remove"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </Card>

                    <Card className="h-fit p-6 lg:sticky lg:top-32">
                        <h2 className="font-semibold text-slate-900">Order summary</h2>
                        <dl className="mt-5 space-y-3 text-sm">
                            <div className="flex justify-between"><dt className="text-slate-500">Items</dt><dd className="font-medium">{itemCount}</dd></div>
                            <div className="flex justify-between border-t border-slate-100 pt-3 text-base"><dt className="font-semibold">Subtotal</dt><dd className="font-bold">{formatTk(total)}</dd></div>
                        </dl>
                        <Button
                            block
                            size="lg"
                            className="mt-6"
                            disabled={cartItems.length === 0}
                            onClick={checkoutHandler}
                        >
                            Proceed to checkout <ArrowRight className="h-4 w-4" />
                        </Button>
                        <Link to="/" className="mt-4 block text-center text-sm font-medium text-slate-500 hover:text-slate-900">Continue shopping</Link>
                    </Card>
                </div>
            )}
        </Container>
    )
}

export default CartScreen
