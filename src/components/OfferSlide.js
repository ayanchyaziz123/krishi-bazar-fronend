import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Badge, formatTk } from './ui'

// One hero slide used by the offer and top-rated carousels.
function OfferSlide({ product, label = 'Special offer' }) {
    const hasOffer = product.offer_percentage > 0
    const offerPrice = product.price - (product.price * product.offer_percentage) / 100
    return (
        <Link to={`/product/${product._id}`} className="grid h-full items-center gap-6 px-8 py-10 sm:px-12 md:grid-cols-2">
            <div className="order-2 md:order-1">
                <Badge variant="amber" className="mb-4">{label}{hasOffer ? ` · ${product.offer_percentage}% off` : ''}</Badge>
                <h2 className="text-2xl font-bold leading-tight tracking-tight text-white sm:text-4xl">{product.name}</h2>
                <div className="mt-4 flex items-baseline gap-3">
                    <span className="text-2xl font-bold text-white">{formatTk(hasOffer ? offerPrice : product.price)}</span>
                    {hasOffer && <span className="text-lg text-slate-400 line-through">{formatTk(product.price)}</span>}
                </div>
                <span className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition group-hover:bg-slate-100">
                    Shop now <ArrowRight className="h-4 w-4" />
                </span>
            </div>
            <div className="order-1 flex h-48 items-center justify-center sm:h-64 md:order-2 md:h-72">
                <img src={product.image} alt={product.name} className="max-h-full max-w-full object-contain drop-shadow-2xl" />
            </div>
        </Link>
    )
}

export default OfferSlide
