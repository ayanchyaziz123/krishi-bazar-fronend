import React from 'react'
import { Link } from 'react-router-dom'
import { Award } from 'lucide-react'
import Rating from './Rating'
import { Badge, formatTk, finalPrice } from './ui'

// The image sits in a rounded card; name, rating and price sit below it on the page.
function Product({ product }) {
    const topReviewed = product.rating > 2 && product.numReviews > 0
    return (
        <Link to={`/product/${product._id}`} className="group block">
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
            </div>

            <div className="px-1 pt-3">
                {product.brand && <p className="mb-0.5 text-xs font-medium uppercase tracking-wider text-slate-400">{product.brand}</p>}
                <h3 className="line-clamp-2 font-semibold leading-snug text-slate-900 group-hover:text-brand-600">{product.name}</h3>
                <div className="mt-1.5">
                    <Rating value={product.rating} text={`(${product.numReviews})`} />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-lg font-bold text-slate-900">{formatTk(finalPrice(product))}</span>
                    {product.is_offer && <span className="text-sm text-slate-400 line-through">{formatTk(product.price)}</span>}
                </div>
            </div>
        </Link>
    )
}

export default Product
