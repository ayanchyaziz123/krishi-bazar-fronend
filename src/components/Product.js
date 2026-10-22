import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Plus, Check, Loader2 } from 'lucide-react'
import { addToCart } from '../actions/cartActions'
import { cn, formatINR, finalPrice } from './ui'

// Product card: photo on top, the price in red with the old price struck through, then the
// name. The round button on the photo adds one to the cart without leaving the page.
function Product({ product, compact }) {
    const dispatch = useDispatch()
    const inCart = useSelector((state) => state.cart.cartItems.find((x) => x.product === product._id))
    const [status, setStatus] = useState('idle') // idle | adding | added
    const timer = useRef(null)

    useEffect(() => () => clearTimeout(timer.current), [])

    const stock = product.countInStock || 0
    const inCartQty = inCart ? Number(inCart.qty) : 0
    const soldOut = stock <= 0
    const atLimit = !soldOut && inCartQty >= stock

    const add = async (e) => {
        e.preventDefault()
        if (soldOut || atLimit || status === 'adding') return
        setStatus('adding')
        try {
            await dispatch(addToCart(product._id, Math.min(inCartQty + 1, stock)))
            setStatus('added')
            clearTimeout(timer.current)
            timer.current = setTimeout(() => setStatus('idle'), 1500)
        } catch (err) {
            setStatus('idle')
        }
    }

    return (
        <Link to={`/product/${product._id}`}
            className="group flex h-full flex-col rounded-2xl bg-[#f3f6fb] p-2 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/5">
            <div className={cn('relative overflow-hidden rounded-xl bg-white', compact ? 'aspect-square' : 'aspect-[4/3]')}>
                {product.image && (
                    <img src={product.image} alt={product.name} loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                )}
                {product.is_offer && product.offer_percentage > 0 && (
                    <span className="absolute left-2 top-2 rounded-md bg-red-600 px-1.5 py-0.5 text-[11px] font-bold text-white">-{product.offer_percentage}%</span>
                )}
                {soldOut && <span className="absolute inset-x-0 bottom-0 bg-slate-900/70 py-1 text-center text-xs font-semibold text-white">Sold out</span>}
                {!soldOut && !compact && (
                    <button type="button" onClick={add} disabled={atLimit || status === 'adding'}
                        aria-label={atLimit ? `All ${product.name} in stock are in your cart` : `Add ${product.name} to cart`}
                        title={atLimit ? 'All in stock are in your cart' : 'Add to cart'}
                        className={cn('absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full shadow-md transition',
                            status === 'added' ? 'bg-emerald-500 text-white' : atLimit ? 'bg-white text-slate-300' : 'bg-white text-brand-700 hover:scale-110 hover:bg-brand-600 hover:text-white')}>
                        {status === 'adding' ? <Loader2 className="h-4 w-4 animate-spin" />
                            : status === 'added' ? <Check className="h-4 w-4" strokeWidth={3} /> : <Plus className="h-5 w-5" strokeWidth={2.5} />}
                    </button>
                )}
                {inCartQty > 0 && !compact && (
                    <span className="absolute right-2 top-2 rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-semibold text-brand-700 shadow-sm">{inCartQty} in cart</span>
                )}
            </div>
            <div className="flex flex-1 flex-col px-1.5 pb-1 pt-2.5">
                <div className="flex flex-wrap items-baseline gap-x-1.5">
                    <span className={cn('font-extrabold text-red-600', compact ? 'text-base' : 'text-xl sm:text-2xl')}>
                        {formatINR(finalPrice(product))}{product.sold_by_weight && <span className="text-xs font-semibold text-slate-500">/{product.unit || 'kg'}</span>}
                    </span>
                    {product.is_offer && product.offer_percentage > 0 && (
                        <span className="text-sm font-semibold text-slate-500 line-through">{formatINR(product.price)}</span>
                    )}
                </div>
                <p className={cn('mt-0.5 line-clamp-2 font-bold leading-snug text-slate-900', compact ? 'text-sm' : 'text-[15px] sm:text-base')}>{product.name}</p>
            </div>
        </Link>
    )
}

export default Product
