import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Award, ShoppingBag, Check, Loader2 } from 'lucide-react'
import Rating from './Rating'
import { addToCart } from '../actions/cartActions'
import { Badge, cn, formatTk, finalPrice } from './ui'

// Product card: image in a rounded card, details below, and a quick add-to-cart button.
function Product({ product }) {
    const dispatch = useDispatch()
    const inCart = useSelector((state) => state.cart.cartItems.find((x) => x.product === product._id))
    const [status, setStatus] = useState('idle') // idle | adding | added
    const timer = useRef(null)

    useEffect(() => () => clearTimeout(timer.current), [])

    const topReviewed = product.rating > 2 && product.numReviews > 0
    const stock = product.countInStock || 0
    const inCartQty = inCart ? Number(inCart.qty) : 0
    const soldOut = stock <= 0
    const atLimit = !soldOut && inCartQty >= stock

    const add = async () => {
        if (soldOut || atLimit || status === 'adding') return
        setStatus('adding')
        try {
            await dispatch(addToCart(product._id, Math.min(inCartQty + 1, stock)))
            setStatus('added')
            clearTimeout(timer.current)
            timer.current = setTimeout(() => setStatus('idle'), 1500)
        } catch (e) {
            setStatus('idle')
        }
    }

    const label = soldOut ? 'Sold out'
        : status === 'adding' ? 'Adding'
            : status === 'added' ? 'Added'
                : atLimit ? 'Max in cart'
                    : 'Add'

    return (
        <div className="group flex h-full flex-col">
            <Link to={`/product/${product._id}`} className="block">
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-100 shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl group-hover:shadow-slate-900/10">
                    <img
                        src={product.image}
                        alt={product.name}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute left-3 top-3 flex flex-col gap-1.5">
                        {product.is_offer && <Badge variant="red">-{product.offer_percentage}%</Badge>}
                        {topReviewed && (
                            <Badge variant="amber"><Award className="h-3 w-3" /> Top reviewed</Badge>
                        )}
                    </div>
                    {inCartQty > 0 && (
                        <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-brand-700 shadow-sm backdrop-blur">
                            {inCartQty} in cart
                        </span>
                    )}
                </div>
            </Link>

            <div className="flex flex-1 flex-col px-1 pt-3">
                {product.brand && <p className="mb-0.5 text-xs font-medium uppercase tracking-wider text-slate-400">{product.brand}</p>}
                <Link to={`/product/${product._id}`} className="line-clamp-2 font-semibold leading-snug text-slate-900 hover:text-brand-600">
                    {product.name}
                </Link>
                <div className="mt-1.5">
                    <Rating value={product.rating} text={`(${product.numReviews})`} />
                </div>
                <div className="mt-auto flex items-center justify-between gap-3 pt-2">
                    <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold text-slate-900">{formatTk(finalPrice(product))}</span>
                        {product.is_offer && <span className="text-sm text-slate-400 line-through">{formatTk(product.price)}</span>}
                    </div>
                    <button
                        type="button"
                        onClick={add}
                        disabled={soldOut || atLimit || status === 'adding'}
                        aria-label={soldOut ? `${product.name} is sold out` : `Add ${product.name} to cart`}
                        title={label === 'Add' ? 'Add to cart' : label}
                        className={cn(
                            'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition',
                            status === 'added'
                                ? 'text-emerald-600'
                                : soldOut || atLimit
                                    ? 'cursor-not-allowed text-slate-300'
                                    : 'text-brand-600 hover:scale-110 hover:text-brand-700'
                        )}
                    >
                        {status === 'adding' ? <Loader2 className="h-5 w-5 animate-spin" />
                            : status === 'added' ? <Check className="h-5 w-5" strokeWidth={3} />
                                : <ShoppingBag className="h-5 w-5" />}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default Product
